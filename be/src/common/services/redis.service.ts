import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import envConfig from '../config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host: envConfig.REDIS_HOST,
      port: envConfig.REDIS_PORT,
      password: process.env.REDIS_PASSWORD, 
    });

    this.redis.on('connect', () => {
      console.log('✓ Redis connected');
    });

    this.redis.on('error', (err) => {
      console.error('✗ Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }

  getClient(): Redis {
    return this.redis;
  }

  // Các method tiện ích
  async set(key: string, value: any, expiresIn?: number) {
    if (expiresIn) {
      await this.redis.setex(key, expiresIn, JSON.stringify(value));
    } else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  async get(key: string) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string) {
    await this.redis.del(key);
  }

  async clear() {
    await this.redis.flushdb();
  }
}