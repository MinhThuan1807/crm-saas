import { Module } from '@nestjs/common'
import { ContactActivitiesController, DealActivitiesController, ActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'
import { ActivitiesRepository } from './activities.repo'
import { PrismaService } from 'src/common/services/prisma.service'
import { ContactsRepository } from '../contacts/contacts.repo'
import { DealRepository } from '../deal/deal.repo'

@Module({
  controllers: [ContactActivitiesController, DealActivitiesController, ActivitiesController],
  providers: [ActivitiesService, ActivitiesRepository, PrismaService, ContactsRepository, DealRepository],
})
export class ActivitiesModule {}
