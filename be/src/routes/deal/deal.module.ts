import { Module } from '@nestjs/common'
import { DealController } from './deal.controller'
import { DealService } from './deal.service'
import { DealRepository } from './deal.repo'
import { TaskRepository } from './task.repo'
import { PrismaService } from 'src/common/services/prisma.service'
import { AiModule } from 'src/routes/ai/ai.module'
import { ContactsRepository } from '../contacts/contacts.repo'

@Module({
  imports: [AiModule],
  controllers: [DealController],
  providers: [DealService, DealRepository, TaskRepository, PrismaService, ContactsRepository],
})
export class DealModule {}
