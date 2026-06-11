import { Module } from '@nestjs/common'
import { DealController } from './deal.controller'
import { DealService } from './deal.service'
import { DealRepository } from './deal.repo'
import { PrismaService } from 'src/common/services/prisma.service'
import { AiService } from 'src/routes/ai/ai.service'
import { ContactsRepository } from '../contacts/contacts.repo'

@Module({
  controllers: [DealController],
  providers: [DealService, DealRepository, PrismaService, AiService, ContactsRepository],
})
export class DealModule {}
