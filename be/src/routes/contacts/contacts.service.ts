import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repo';
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model';
import { RedisService } from 'src/common/services/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getChangesDiff } from '../deal/deal.service';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { subject } from '@casl/ability';
import { DealRepository } from '../deal/deal.repo';
import { AiService } from '../ai/ai.service';


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

  // Logic bulk import Contacts & Deals
  async bulkImport(tenantId: string, currentUserId: string, body: { contacts: any[] }) {
    const results = [];
    
    // Đọc trước tất cả users của Tenant để tìm kiếm Owner theo email một cách nhanh nhất
    const allTenantUsers = await (this.contactRepository as any).prismaService.user.findMany({
      where: { tenantId }
    });
    const userMap = new Map<string, string>(allTenantUsers.map((u: any) => [u.email.toLowerCase(), u.id]));

    for (const item of body.contacts) {
      // 1. Phân quyền chủ sở hữu (Owner)
      let ownerId = currentUserId;
      if (item.ownerEmail) {
        const matchedUserId = userMap.get(item.ownerEmail.toLowerCase());
        if (matchedUserId) {
          ownerId = matchedUserId;
        }
      }

      // 2. Tìm kiếm Contact trùng lặp (Merge/Overwrite)
      let contact = await this.contactRepository.findByEmailOrPhone(item.email, item.phone);

      if (contact) {
        // Cập nhật thông tin mới
        const updateData: any = {};
        if (item.name) updateData.name = item.name;
        if (item.company) updateData.company = item.company;
        if (item.position) updateData.position = item.position;
        
        // Gộp tag cũ và tag mới từ Excel
        if (item.tags && item.tags.length > 0) {
          const existingTags = contact.tags || [];
          updateData.tags = Array.from(new Set([...existingTags, ...item.tags]));
        }
        
        const oldContact = { ...contact };
        contact = await this.contactRepository.update(contact.id, updateData);
        
        // Ghi Audit Log cho hành động UPDATE
        const changes = getChangesDiff(oldContact, updateData);
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
        // Tạo mới Contact
        contact = await this.contactRepository.create(ownerId, {
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          company: item.company || null,
          position: item.position || null,
          tags: item.tags || []
        });

        // Ghi Audit Log cho hành động CREATE Contact
        const changes: any = {};
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

      // 3. Tạo Deal đi kèm nếu có khai báo Deal Title
      if (item.dealTitle) {
        // Chuẩn hóa ngôn ngữ Trạng thái Deal
        let stage: any = 'PROSPECT';
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

        // Ghi Audit Log cho hành động CREATE Deal
        const dealChanges: any = {};
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

    // Xóa cache Redis của tenant đó để cập nhật UI ngay lập tức
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
      // Fallback mapping trong trường hợp lỗi API AI
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
