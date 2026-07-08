import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repo';
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model';
import { RedisService } from 'src/common/services/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getChangesDiff } from '../deal/deal.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactRepository: ContactsRepository,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getAllContacts(tenantId: string, query: GetContactsQueryType, userContext?: { userId: string; role: string }) {
      const { limit } = query;

      const contacts = await this.contactRepository.findAll(query, userContext);

      const hasNextPage = contacts.length > limit;
      const data = hasNextPage ? contacts.slice(0, -1) : contacts;
      const nextCursor = hasNextPage ? data[data.length - 1].id : null

      const pagination = {nextCursor, hasNextPage}
      return {
        data,
        pagination
      }   
  }

  async getContactById(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const contact =  await this.contactRepository.findOne(contactId, userContext);
    if (!contact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }
    return contact;
  }

  async createContact(tenantId: string, ownerId: string, body: CreateContactBodyType) {
    const result = await this.contactRepository.create(ownerId, body)
    await this.redisService.invalidateTenantCache(tenantId)

     const changes: any = {};
    for (const [key, val] of Object.entries(result)) {
      if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
      changes[key] = { old: null, new: val };
    }
    await this.auditLogsService.logAction({
      tenantId,
      userId: ownerId,
      action: 'CREATE',
      targetType: 'CONTACT',
      targetId: result.id,
      targetName: result.name,
      changes,
    });

    return result
  }

  async update(contactId: string, tenantId: string, body: Partial<CreateContactBodyType>, userContext?: { userId: string; role: string }) {
    const oldContact = await this.contactRepository.findOne(contactId, userContext);
    if (!oldContact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }
    const result = await this.contactRepository.update(contactId, body);
    await this.redisService.invalidateTenantCache(tenantId)
    if (userContext) {
      const changes = getChangesDiff(oldContact, body);
      if (Object.keys(changes).length > 0) {
        await this.auditLogsService.logAction({
          tenantId,
          userId: userContext.userId,
          action: 'UPDATE',
          targetType: 'CONTACT',
          targetId: contactId,
          targetName: result.name,
          changes,
        });
      }
    }
    return result
  }

  async delete(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
   const oldContact = await this.contactRepository.findOne(contactId, userContext);
    if (!oldContact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }
    const result = await this.contactRepository.delete(contactId)
    await this.redisService.invalidateTenantCache(tenantId)
    if (userContext) {
      const changes: any = {};
      for (const [key, val] of Object.entries(oldContact)) {
        if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
        changes[key] = { old: val, new: null };
      }
      await this.auditLogsService.logAction({
        tenantId,
        userId: userContext.userId,
        action: 'DELETE',
        targetType: 'CONTACT',
        targetId: contactId,
        targetName: oldContact.name,
        changes,
      });
    }
    return result
  }

  async restore(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const exits = await this.contactRepository.findDeleted(contactId, userContext);
    if (!exits) {
      throw new NotFoundException('Liên hệ không tồn tại');
  }
    const result = await this.contactRepository.restore(contactId)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }
}

