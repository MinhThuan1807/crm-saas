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
  // Tăng thêm bản cache của tenant lên 1 (hủy toàn bộ cache cũ)
  async invalidateTenantCache(tenantId: string): Promise<number> {
    const key = `cache:tenant_version:${tenantId}`
    return await this.redis.incr(key);
  }

  //Lấy phiên bản cache hiện tại của tenant
  async getTenantCacheVersion(tenantId: string): Promise<string> {
    const key = `cache:tenant_version:${tenantId}`;
    let version = await this.redis.get(key);
    if(!version) {
      version = '1';
      await this.redis.set(key, version);
    }
    return version;
  }
}