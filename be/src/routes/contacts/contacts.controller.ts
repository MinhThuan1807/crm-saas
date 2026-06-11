import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AccessTokenPayload } from 'src/common/types/jwt.type';
import { CreateContactBodyDto, CreateContactResDto, GetContactResDto, GetContactsQueryDto, GetContactsResDto, UpdateContactBodyDto } from './contacts.dto';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactService: ContactsService) {}

  @Get()
  @ZodSerializerDto(GetContactsResDto)
  getContacts(@CurrentUser() user: AccessTokenPayload, @Query() query: GetContactsQueryDto) {
    return this.contactService.getAllContacts(user.tenantId, {
      cursor: query.cursor,
      limit: query.limit,
      search: query.search
    }, { userId: user.userId, role: user.role });
  }

  @Get(':id')
  @ZodSerializerDto(GetContactResDto)
  getContactById(@CurrentUser() user: AccessTokenPayload, @Param('id') contactId: string) {
    return this.contactService.getContactById(contactId, user.tenantId, { userId: user.userId, role: user.role });
  }

  @Post()
  @ZodSerializerDto(CreateContactResDto)
  createContact(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateContactBodyDto,
  ) {
    return this.contactService.createContact(user.tenantId, user.userId, body)
  }

  @Patch(':id')
  updateContact(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') contactId: string,
    @Body() body: UpdateContactBodyDto,
  ) {
    return this.contactService.update(contactId, user.tenantId, body, { userId: user.userId, role: user.role })
  }

  @Delete(':id')
  deleteContact(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') contactId: string,
  ) {
    return this.contactService.delete(contactId, user.tenantId, { userId: user.userId, role: user.role })
  }

  @Patch(':id/restore')
  restoreContact(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') contactId: string,
  ) {
    return this.contactService.restore(contactId, user.tenantId, { userId: user.userId, role: user.role })
  }
}

