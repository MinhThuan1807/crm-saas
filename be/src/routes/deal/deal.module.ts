import { Module } from '@nestjs/common'
import { DealController } from './deal.controller'
import { DealService } from './deal.service'
import { DealRepository } from './deal.repo'
import { PrismaService } from 'src/common/services/prisma.service'
import { AiService } from 'src/routes/ai/ai.service'

@Module({
  controllers: [DealController],
  providers: [DealService, DealRepository, PrismaService, AiService],
})
export class DealModule {}
