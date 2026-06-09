import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '../../../generated/prisma-client/internal/prismaNamespace'
import { ActivitiesRepository } from './activities.repo'
import {
  CreateActivityForContactBodyType,
  CreateActivityForDealBodyType,
  UpdateActivityBodyType,
  GetActivitiesQueryType,
  GetActivitiesPaginatedResType,
} from './activities.model'
import { ActivityWithRelations } from './activities.repo'
import { ContactsRepository } from '../contacts/contacts.repo'
import { DealRepository } from '../deal/deal.repo'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepository,
    private readonly contactsRepo: ContactsRepository,
    private readonly dealRepo: DealRepository,
  ) {}

  // Tạo activity gắn với contact — validate contact thuộc tenant trước
  async createForContact(
    tenantId: string,
    contactId: string,
    userId: string,
    body: CreateActivityForContactBodyType,
  ): Promise<ActivityWithRelations> {
    const contact = await this.contactsRepo.findOne(contactId, tenantId)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    return this.activitiesRepo.create(tenantId, userId, body, { contactId })
  }

  // Tạo activity gắn với deal — validate deal thuộc tenant trước
  // Nếu body có contactId, cũng validate contact thuộc tenant
  async createForDeal(
    tenantId: string,
    dealId: string,
    userId: string,
    body: CreateActivityForDealBodyType,
  ): Promise<ActivityWithRelations> {
    const deal = await this.dealRepo.findOne(dealId, tenantId)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    if (body.contactId) {
      const contact = await this.contactsRepo.findOne(body.contactId, tenantId)
      if (!contact) throw new NotFoundException('Liên hệ không tồn tại')
    }

    return this.activitiesRepo.create(tenantId, userId, body, {
      dealId,
      contactId: body.contactId,
    })
  }

  // Lấy activities theo contact — validate contact trước
  async getByContact(tenantId: string, contactId: string): Promise<{ data: ActivityWithRelations[] }> {
    const contact = await this.contactsRepo.findOne(contactId, tenantId)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const data = await this.activitiesRepo.findAllByContact(tenantId, contactId)
    return { data }
  }

  // Lấy activities theo deal — validate deal trước
  // Throw NotFoundException khi deal không tồn tại (không trả về { data: [] })
  async getByDeal(tenantId: string, dealId: string): Promise<{ data: ActivityWithRelations[] }> {
    const deal = await this.dealRepo.findOne(dealId, tenantId)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    const data = await this.activitiesRepo.findAllByDeal(tenantId, dealId)
    return { data }
  }

  // Lấy tất cả activities của tenant, phân trang và lọc
  async getAll(tenantId: string, query: GetActivitiesQueryType): Promise<GetActivitiesPaginatedResType> {
    const { data, total } = await this.activitiesRepo.findAll(tenantId, query)
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  // Partial update — chỉ update fields được cung cấp
  async updateActivity(
    activityId: string,
    tenantId: string,
    body: UpdateActivityBodyType,
  ): Promise<ActivityWithRelations> {
    const existing = await this.activitiesRepo.findOne(activityId, tenantId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    return this.activitiesRepo.update(activityId, tenantId, body)
  }

  // Hard delete — Activity không có deletedAt
  async deleteActivity(activityId: string, tenantId: string): Promise<{ message: string }> {
    try {
      await this.activitiesRepo.hardDelete(activityId, tenantId)
      return { message: 'Xóa hoạt động thành công' }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Hoạt động không tồn tại')
      }
      throw error
    }
  }
}
