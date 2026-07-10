import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repo';
import { CreateContactBodyType, ContactTagType, GetContactsQueryType } from './contacts.model';
import { RedisService } from 'src/common/services/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getChangesDiff } from '../deal/deal.service';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { subject } from '@casl/ability';
import { DealRepository } from '../deal/deal.repo';
import { AiService } from '../ai/ai.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { DealStageType } from '../deal/deal.model';
import { BulkImportContactsBodyDto } from './contacts.dto';


@Injectable()
export class ContactsService {
  constructor(
    private readonly contactRepository: ContactsRepository,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly dealRepository: DealRepository, // Inject DealRepository
    private readonly aiService: AiService,
  ) {}

  async getAllContacts(tenantId: string, query: GetContactsQueryType, user: { userId: string; role: string; tenantId: string }) {
      const { limit } = query;
      const ability = await this.caslAbilityFactory.createForUser(user);

      if (ability.cannot('read', 'Contact')) {
        throw new ForbiddenException('Bạn không có quyền xem danh sách liên hệ');
      }

      const filters: { ownerId?: string } = {};
      if (ability.cannot('read', subject('Contact', { ownerId: 'other' } as any))) {
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
    // Use subject() helper to map database model type
    if (ability.cannot('read', subject('Contact', contact as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Liên hệ không tồn tại'); // Return 404 to prevent ID scanning
    }

    return contact;
  }

  async createContact(tenantId: string, ownerId: string, body: CreateContactBodyType) {
    const result = await this.contactRepository.create(ownerId, body)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes: Record<string, { old: unknown; new: unknown }> = {};
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
    if (ability.cannot('update', subject('Contact', oldContact as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Liên hệ không tồn tại'); // Security 404
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
    if (ability.cannot('delete', subject('Contact', oldContact as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const result = await this.contactRepository.delete(contactId)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes: Record<string, { old: unknown; new: unknown }> = {};
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
    if (ability.cannot('update', subject('Contact', exits as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    const result = await this.contactRepository.restore(contactId)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }

  // Logic bulk import Contacts & Deals
  async bulkImport(tenantId: string, currentUserId: string, body: BulkImportContactsBodyDto) {
    const results = [];
    
    // Pre-read all Tenant users to find Owner by email as fast as possible
    const allTenantUsers = await (this.contactRepository as unknown as { prismaService: PrismaService }).prismaService.user.findMany({
      where: { tenantId }
    });
    const userMap = new Map<string, string>(allTenantUsers.map((u) => [u.email.toLowerCase(), u.id]));

    for (const item of body.contacts) {
      // 1. Owner authorization
      let ownerId = currentUserId;
      if (item.ownerEmail) {
        const matchedUserId = userMap.get(item.ownerEmail.toLowerCase());
        if (matchedUserId) {
          ownerId = matchedUserId;
        }
      }

      // 2. Search for duplicate Contacts (Merge/Overwrite)
      let contact = await this.contactRepository.findByEmailOrPhone(item.email, item.phone);

      if (contact) {
        // Update with new information
        const updateData: Partial<CreateContactBodyType> & { tags?: ContactTagType[] } = {};
        if (item.name) updateData.name = item.name;
        if (item.company) updateData.company = item.company;
        if (item.position) updateData.position = item.position;
        
        // Merge old tags and new tags from Excel
        if (item.tags && item.tags.length > 0) {
          const existingTags = contact.tags || [];
          // Tags from BulkImportContactItemSchema are plain strings; cast to ContactTagType[] after Zod validation
          const validNewTags = item.tags as ContactTagType[];
          updateData.tags = Array.from(new Set([...existingTags, ...validNewTags])) as ContactTagType[];
        }
        
        const oldContact = { ...contact };
        contact = await this.contactRepository.update(contact.id, updateData);
        
        // Write Audit Log for UPDATE action
        const changes = getChangesDiff(
          oldContact as unknown as Record<string, unknown>,
          updateData as unknown as Record<string, unknown>
        );
        if (Object.keys(changes).length > 0) {
          await this.auditLogsService.logAction({
            tenantId,
            userId: currentUserId,
            action: 'UPDATE',
            targetType: 'CONTACT',
            targetId: contact.id,
            targetName: contact.name,
            changes,
          });
        }
      } else {
        // Create new Contact
        contact = await this.contactRepository.create(ownerId, {
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          company: item.company || null,
          position: item.position || null,
          // Tags from BulkImportContactItemSchema are plain strings; cast to ContactTagType[] after validation
          tags: (item.tags || []) as ContactTagType[]
        });

        // Write Audit Log for CREATE Contact action
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, val] of Object.entries(contact)) {
          if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
          changes[key] = { old: null, new: val };
        }
        await this.auditLogsService.logAction({
          tenantId,
          userId: currentUserId,
          action: 'CREATE',
          targetType: 'CONTACT',
          targetId: contact.id,
          targetName: contact.name,
          changes,
        });
      }

      // 3. Create accompanying Deal if Deal Title is declared
      if (item.dealTitle) {
        // Normalize Deal Stage language
        let stage: DealStageType = 'PROSPECT';
        const rawStage = (item.dealStage || '').toLowerCase().trim();
        
        if (rawStage.includes('mới') || rawStage.includes('prospect')) {
          stage = 'PROSPECT';
        } else if (rawStage.includes('tiềm') || rawStage.includes('qualified')) {
          stage = 'QUALIFIED';
        } else if (rawStage.includes('thương') || rawStage.includes('đề') || rawStage.includes('proposal')) {
          stage = 'PROPOSAL';
        } else if (rawStage.includes('thắng') || rawStage.includes('won') || rawStage.includes('thành công')) {
          stage = 'CLOSED_WON';
        } else if (rawStage.includes('bại') || rawStage.includes('lost') || rawStage.includes('thất bại')) {
          stage = 'CLOSED_LOST';
        }

        const deal = await this.dealRepository.createWithStage({
          ownerId,
          title: item.dealTitle,
          value: item.dealValue || 0,
          stage,
          contactId: contact.id,
          note: item.dealNote || null,
        });

        // Write Audit Log for CREATE Deal action
        const dealChanges: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, val] of Object.entries(deal)) {
          if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
          dealChanges[key] = { old: null, new: val };
        }
        await this.auditLogsService.logAction({
          tenantId,
          userId: currentUserId,
          action: 'CREATE',
          targetType: 'DEAL',
          targetId: deal.id,
          targetName: deal.title,
          changes: dealChanges,
        });
      }

      results.push(contact);
    }

    // Invalidate tenant Redis cache to update UI immediately
    await this.redisService.invalidateTenantCache(tenantId);
    return { success: true, count: results.length };
  }

  async aiMapColumns(headers: string[]) {
    const prompt = `You are an expert data mapping assistant for a CRM system.
    We have 11 system fields:
    - name (Họ và tên - Required)
    - email (Email)
    - phone (Số điện thoại)
    - company (Công ty)
    - position (Chức vụ)
    - tags (Tags)
    - ownerEmail (Email người sở hữu)
    - dealTitle (Tên Deal)
    - dealValue (Giá trị Deal)
    - dealStage (Trạng thái Deal)
    - dealNote (Ghi chú Deal)

    Given this list of headers from an uploaded spreadsheet:
    ${JSON.stringify(headers)}

    Map these user headers to our 11 system fields.
    Return ONLY a single valid JSON object (no explanations, no markdown formatting blocks, no triple backticks, no markdown json block) where keys are system fields, and values are the exact matching header from the spreadsheet list, or null if no matching header is found.
    Example Output Format:
    {
      "name": "Họ và tên",
      "email": "Email liên lạc",
      "phone": "SĐT",
      "company": null,
      ...
    }`;

    try {
      const content = await this.aiService.callModel(prompt, { temperature: 0.1 });
      // Clean markdown format if generated by mistake
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const mappings = JSON.parse(cleanJson);
      return { mappings };
    } catch (err) {
      // Fallback mapping in case of AI API error
      const mappings: Record<string, string | null> = {};
      const fields = [
        'name', 'email', 'phone', 'company', 'position', 'tags',
        'ownerEmail', 'dealTitle', 'dealValue', 'dealStage', 'dealNote'
      ];
      fields.forEach(f => { mappings[f] = null; });
      return { mappings };
    }
  }
}
