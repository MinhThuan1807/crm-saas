import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from 'src/common/services/prisma.service';
import './ai.processor';

@Module({
  providers: [AiService, PrismaService],
  exports: [AiService],
})
export class AiModule {}