import { AbilityBuilder, createMongoAbility, subject, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../services/redis.service';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

export interface PermissionRule {
  action: string;
  subject: string;
  conditions?: Record<string, unknown> | null;
}

// Helper function to parse/interpolate placeholder string ${user.id} -> actual userId
function interpolateConditions(conditions: Record<string, unknown> | null | undefined, user: { userId: string }): Record<string, unknown> | undefined {
  if (!conditions) return undefined;
  const serialized = JSON.stringify(conditions);
  const interpolated = serialized.replace(/\${user\.id}/g, user.userId);
  return JSON.parse(interpolated);
}

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createForUser(user: { userId: string; role: string; tenantId: string }) {
    const { can, build } = new AbilityBuilder<MongoAbility>(createMongoAbility);

    // 1. Create cache key by tenant and role
    const cacheKey = `tenant:${user.tenantId}:role:${user.role}:permissions`;
    let rawRules = (await this.redis.get(cacheKey)) as PermissionRule[] | null;

    if (!rawRules) {
      // 2. Cache miss -> Fetch permissions from database
      const dbRolePermissions = await this.prisma.rolePermission.findMany({
        where: {
          role: {
            tenantId: user.tenantId,
            name: user.role,
          },
        },
        include: {
          permission: true,
        },
      });

      rawRules = dbRolePermissions.map((rp) => ({
        action: rp.permission.action,
        subject: rp.permission.subject,
        conditions: rp.conditions as Record<string, unknown> | null,
      }));

      // 3. Cache hit -> Save to Redis (TTL: 1 hour)
      await this.redis.set(cacheKey, rawRules, 3600);
    }

    // 4. Define the rules
    rawRules.forEach((rule) => {
      const parsedConditions = interpolateConditions(rule.conditions, user);
      can(rule.action, rule.subject, parsedConditions);
    });

    return build({
      detectSubjectType: (item) => {
        // Automatically detect Subject Type from helper subject('SubjectName', data)
        return (
          ((item as Record<string, unknown>)?.__caslSubjectType__ as string | undefined) ||
          ((item as Record<string, unknown>)?.__type as string | undefined)
        );
      }
    });
  }

  // Invalidate cache when Admin changes permissions of a Role
  async invalidateRoleCache(tenantId: string, roleName: string) {
    const cacheKey = `tenant:${tenantId}:role:${roleName}:permissions`;
    await this.redis.delete(cacheKey);
  }
}
