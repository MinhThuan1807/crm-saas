import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import envConfig from '../config';
import { PrismaClient } from '../../../generated/prisma-client/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: envConfig.DATABASE_URL,
      ssl: envConfig.DATABASE_URL.includes('amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined
    });
    super({ adapter });
  }
}
