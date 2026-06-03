import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { createRedis } from 'src/common/providers/redis.provider';

const redis = createRedis();

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

// Lua script: INCR key; if value == 1 then EXPIRE key window; return value
const LUA_INCR_WITH_TTL = `
  local v = redis.call('INCR', KEYS[1])
  if v == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return v
`;

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const user = req.user;
    if (!user || !user.userId || !user.tenantId) {
      // let JwtAuthGuard handle auth failure; if unauthenticated, block
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const key = `rl:ai:${user.tenantId}:${user.userId}`;

    try {
      const count = await redis.eval(LUA_INCR_WITH_TTL, 1, key, WINDOW_SECONDS);
      const numeric = typeof count === 'number' ? count : parseInt(String(count), 10);

      if (numeric > MAX_REQUESTS) {
        // get remaining TTL for Retry-After
        const ttl = await redis.ttl(key);
        const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;
        res.setHeader('Retry-After', String(retryAfter));
        throw new HttpException(
          { message: `Giới hạn ${MAX_REQUESTS} yêu cầu/ ${WINDOW_SECONDS}s`, retryAfter },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // allow
      return true;
    } catch (err) {
      // On Redis error, be conservative: fail closed (or you can choose fail-open)
      // Here we return 503 to indicate service degraded.
      throw new HttpException('Rate limiter unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}