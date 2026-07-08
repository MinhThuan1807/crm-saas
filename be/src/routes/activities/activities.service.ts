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

  // Create activity associated with contact — validate contact belongs to tenant first
  async createForContact(
    tenantId: string,
    contactId: string,
    userId: string,
    body: CreateActivityForContactBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const contact = await this.contactsRepo.findOne(contactId, userContext)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const activity = await this.activitiesRepo.create(userId, body, { contactId })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Create activity associated with deal — validate deal belongs to tenant first
  // If body has contactId, also validate contact belongs to tenant.
  // In addition, if contactId is missing, automatically assign contactId from Deal (Cascading Timeline)
  async createForDeal(
    tenantId: string,
    dealId: string,
    userId: string,
    body: CreateActivityForDealBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const deal = await this.dealRepo.findOne(dealId, userContext)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    if (body.contactId) {
      const contact = await this.contactsRepo.findOne(body.contactId, userContext)
      if (!contact) throw new NotFoundException('Liên hệ không tồn tại')
    }

    const targetContactId = body.contactId || deal.contactId

    const activity = await this.activitiesRepo.create(userId, body, {
      dealId,
      contactId: targetContactId,
    })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Get activities by contact — validate contact first
  async getByContact(
    tenantId: string,
    contactId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const contact = await this.contactsRepo.findOne(contactId, userContext)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const data = await this.activitiesRepo.findAllByContact(contactId)
    return { data }
  }

  // Get activities by deal — validate deal first
  // Throw NotFoundException if deal does not exist (does not return { data: [] })
  async getByDeal(
    tenantId: string,
    dealId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const deal = await this.dealRepo.findOne(dealId, userContext)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    const data = await this.activitiesRepo.findAllByDeal(dealId)
    return { data }
  }

  // Get all activities of tenant, paginate and filter
  async getAll(
    tenantId: string,
    query: GetActivitiesQueryType,
    userContext?: { userId: string; role: string },
  ): Promise<GetActivitiesPaginatedResType> {
    const { data, total } = await this.activitiesRepo.findAll(query, userContext)
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  // Partial update — only update provided fields (Audit-safe Lock)
  async updateActivity(
    activityId: string,
    tenantId: string,
    body: UpdateActivityBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<ActivityWithRelations> {
    const existing = await this.activitiesRepo.findOne(activityId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    // Lock: Only the creator of the activity or Admin/Manager is allowed to edit
    if (userContext?.role === ROLE.SALES_REP && existing.userId !== userContext.userId) {
      throw new ForbiddenException('Bạn không có quyền sửa hoạt động này')
    }

    const activity = await this.activitiesRepo.update(activityId, body)
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  // Hard delete — Activity has no deletedAt (Audit-safe Lock)
  async deleteActivity(
    activityId: string,
    tenantId: string,
    userContext?: { userId: string; role: string },
  ): Promise<{ message: string }> {
    const existing = await this.activitiesRepo.findOne(activityId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    // Lock: Only the creator of the activity or Admin/Manager is allowed to delete
    if (userContext?.role === ROLE.SALES_REP && existing.userId !== userContext.userId) {
      throw new ForbiddenException('Bạn không có quyền xóa hoạt động này')
    }

    try {
      await this.activitiesRepo.hardDelete(activityId)
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

