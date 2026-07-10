import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { CommonModule } from 'src/common/common.module';
import { InvitationRepository } from './invitation.repo';

@Module({
  imports: [CommonModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationRepository],
})
export class InvitationsModule {}
