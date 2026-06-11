import { Queue } from 'bullmq';
import { createRedis } from '../../common/providers/redis.provider';

export const AI_QUEUE_NAME = 'ai-analysis';
const connection = createRedis();

export const aiQueue = new Queue(AI_QUEUE_NAME, { connection: connection as any });