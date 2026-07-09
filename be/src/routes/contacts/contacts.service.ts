import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repo';
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model';
import { RedisService } from 'src/common/services/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getChangesDiff } from '../deal/deal.service';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { subject } from '@casl/ability';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactRepository: ContactsRepository,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async getAllContacts(tenantId: string, query: GetContactsQueryType, user: { userId: string; role: string; tenantId: string }) {
      const { limit } = query;
      const ability = await this.caslAbilityFactory.createForUser(user);

      // Nếu không có quyền đọc toàn bộ Contact, chèn filter ownerId tự động
      const filters: any = {};
      if (ability.cannot('read', 'Contact')) {
        filters.ownerId = user.userId;
      }

      const contacts = await this.contactRepository.findAll(query, filters);

      const hasNextPage = contacts.length > limit;
      const data = hasNextPage ? contacts.slice(0, -1) : contacts;
      const nextCursor = hasNextPage ? data[data.length - 1].id : null

      const pagination = { nextCursor, hasNextPage }
      return { data, pagination }   
  }

  async getContactById(contactId: string, tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const contact = await this.contactRepository.findOne(contactId);
    if (!contact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    // Sử dụng helper subject() để map type của model database
    if (ability.cannot('read', subject('Contact', contact as any))) {
      throw new NotFoundException('Liên hệ không tồn tại'); // Trả về 404 để chống rà quét ID
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

  async update(contactId: string, tenantId: string, body: Partial<CreateContactBodyType>, user: { userId: string; role: string; tenantId: string }) {
    const oldContact = await this.contactRepository.findOne(contactId);
    if (!oldContact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Contact', oldContact as any))) {
      throw new NotFoundException('Liên hệ không tồn tại'); // Bảo mật 404
    }

    const result = await this.contactRepository.update(contactId, body);
    await this.redisService.invalidateTenantCache(tenantId)

    const changes = getChangesDiff(oldContact, body);
    if (Object.keys(changes).length > 0) {
      await this.auditLogsService.logAction({
        tenantId,
        userId: user.userId,
        action: 'UPDATE',
        targetType: 'CONTACT',
        targetId: contactId,
        targetName: result.name,
        changes,
      });
    }
    return result
  }

  async delete(contactId: string, tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const oldContact = await this.contactRepository.findOne(contactId);
    if (!oldContact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('delete', subject('Contact', oldContact as any))) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const result = await this.contactRepository.delete(contactId)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes: any = {};
    for (const [key, val] of Object.entries(oldContact)) {
      if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
      changes[key] = { old: val, new: null };
    }
    await this.auditLogsService.logAction({
      tenantId,
      userId: user.userId,
      action: 'DELETE',
      targetType: 'CONTACT',
      targetId: contactId,
      targetName: oldContact.name,
      changes,
    });
    return result
  }

  async restore(contactId: string, tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const exits = await this.contactRepository.findDeleted(contactId);
    if (!exits) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Contact', exits as any))) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const result = await this.contactRepository.restore(contactId)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }
}
