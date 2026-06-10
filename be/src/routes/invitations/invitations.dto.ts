import { createZodDto } from 'nestjs-zod';
import { CreateInvitationSchema, AcceptInvitationSchema, UpdateInvitationSchema } from './invitations.model';

export class CreateInvitationDto extends createZodDto(CreateInvitationSchema) {}
export class AcceptInvitationDto extends createZodDto(AcceptInvitationSchema) {}
export class UpdateInvitationDto extends createZodDto(UpdateInvitationSchema) {}
