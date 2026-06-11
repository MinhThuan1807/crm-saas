import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repo';
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model';

@Injectable()
export class ContactsService {
  constructor(private readonly contactRepository: ContactsRepository) {}

  async getAllContacts(tenantId: string, query: GetContactsQueryType, userContext?: { userId: string; role: string }) {
      const { cursor, limit, search } = query;

      const contacts = await this.contactRepository.findAll(tenantId, {
        cursor,
        limit,
        search
      }, userContext);
      // 3. Tính hasNextPage
      const hasNextPage = contacts.length > limit;

      const data = hasNextPage ? contacts.slice(0, -1) : contacts;
      // slice(0, -1) bỏ phần tử cuối (phần tử thừa)

      // 4. Lấy cursor tiếp theo
      const nextCursor = hasNextPage ? data[data.length - 1].id : null

      const pagination = {nextCursor, hasNextPage}

      return {
        data,
        pagination
      }   
  }

  async getContactById(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const contact =  await this.contactRepository.findOne(contactId, tenantId, userContext);
    if (!contact) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    return contact;
  }

  createContact(tenantId: string, ownerId: string, body: CreateContactBodyType) {
    return this.contactRepository.create(tenantId, ownerId, body)
  }

  async update(contactId: string, tenantId: string, body: Partial<CreateContactBodyType>, userContext?: { userId: string; role: string }) {
    const exits = await this.contactRepository.findOne(contactId, tenantId, userContext);
    if (!exits) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    return this.contactRepository.update(contactId, tenantId, body);
  }

  async delete(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const exits = await this.contactRepository.findOne(contactId, tenantId, userContext);
    if (!exits) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    return this.contactRepository.delete(contactId, tenantId)
  }

  async restore(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const exits = await this.contactRepository.findDeleted(contactId, tenantId, userContext);
    if (!exits) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }
    return this.contactRepository.restore(contactId, tenantId)
  }
}

