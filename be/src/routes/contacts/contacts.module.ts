import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repo';
import { DealRepository } from '../deal/deal.repo'; // Import DealRepository
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsRepository, DealRepository] // Add DealRepository here
})
export class ContactsModule {}

