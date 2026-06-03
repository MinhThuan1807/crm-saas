import Redis from 'ioredis'
import envConfig from '../config'
const host = envConfig.REDIS_HOST || '127.0.0.1'
const port = Number(envConfig.REDIS_PORT || 6379)
const password = envConfig.REDIS_PASSWORD || undefined
const useTls = envConfig.REDIS_TLS === 'true'

export const createRedis = () =>
  new Redis({
    host,
    port,
    password,
    tls: useTls ? {} : undefined,
    // BullMQ requires maxRetriesPerRequest to be null to avoid blocking behavior
    maxRetriesPerRequest: null,
  })
