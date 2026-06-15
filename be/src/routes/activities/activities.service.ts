import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
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
import { ROLE } from 'src/common/constants/role.constanst'
import { RedisService } from 'src/common/services/redis.service'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepository,
    private readonly contactsRepo: ContactsRepository,
    private readonly dealRepo: DealRepository,
    private readonly redisService: RedisService,
  ) {}

  // Tạo activity gắn với contact — validate contact thuộc tenant trước
  async createForContact(
    tenantId: string,
    contactId: string,
    userId: string,
    body: CreateActivityForContactBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const contact = await this.contactsRepo.findOne(contactId, tenantId, userContext)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const activity = await this.activitiesRepo.create(tenantId, userId, body, { contactId })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Tạo activity gắn với deal — validate deal thuộc tenant trước
  // Nếu body có contactId, cũng validate contact thuộc tenant.
  // Đồng thời, nếu không có contactId, tự động gán contactId từ Deal (Cascading Timeline)
  async createForDeal(
    tenantId: string,
    dealId: string,
    userId: string,
    body: CreateActivityForDealBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    if (body.contactId) {
      const contact = await this.contactsRepo.findOne(body.contactId, tenantId, userContext)
      if (!contact) throw new NotFoundException('Liên hệ không tồn tại')
    }

    const targetContactId = body.contactId || deal.contactId

    const activity = await this.activitiesRepo.create(tenantId, userId, body, {
      dealId,
      contactId: targetContactId,
    })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Lấy activities theo contact — validate contact trước
  async getByContact(
    tenantId: string,
    contactId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const contact = await this.contactsRepo.findOne(contactId, tenantId, userContext)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const data = await this.activitiesRepo.findAllByContact(tenantId, contactId)
    return { data }
  }

  // Lấy activities theo deal — validate deal trước
  // Throw NotFoundException khi deal không tồn tại (không trả về { data: [] })
  async getByDeal(
    tenantId: string,
    dealId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    const data = await this.activitiesRepo.findAllByDeal(tenantId, dealId)
    return { data }
  }

  // Lấy tất cả activities của tenant, phân trang và lọc
  async getAll(
    tenantId: string,
    query: GetActivitiesQueryType,
    userContext?: { userId: string; role: string },
  ): Promise<GetActivitiesPaginatedResType> {
    const { data, total } = await this.activitiesRepo.findAll(tenantId, query, userContext)
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  // Partial update — chỉ update fields được cung cấp (Audit-safe Lock)
  async updateActivity(
    activityId: string,
    tenantId: string,
    body: UpdateActivityBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const existing = await this.activitiesRepo.findOne(activityId, tenantId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    // Lock: Chỉ người tạo ra activity hoặc Admin/Manager mới được sửa
    if (userContext?.role === ROLE.SALES_REP && existing.userId !== userContext.userId) {
      throw new ForbiddenException('Bạn không có quyền sửa hoạt động này')
    }

    const activity = await this.activitiesRepo.update(activityId, tenantId, body)
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Hard delete — Activity không có deletedAt (Audit-safe Lock)
  async deleteActivity(
    activityId: string,
    tenantId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ message: string }> {
    const existing = await this.activitiesRepo.findOne(activityId, tenantId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    // Lock: Chỉ người tạo ra activity hoặc Admin/Manager mới được xóa
    if (userContext?.role === ROLE.SALES_REP && existing.userId !== userContext.userId) {
      throw new ForbiddenException('Bạn không có quyền xóa hoạt động này')
    }

    try {
      await this.activitiesRepo.hardDelete(activityId, tenantId)
      await this.redisService.invalidateTenantCache(tenantId)
      return { message: 'Xóa hoạt động thành công' }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Hoạt động không tồn tại')
      }
      throw error
    }
  }
}

