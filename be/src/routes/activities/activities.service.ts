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
import { RedisService } from 'src/common/services/redis.service'
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory'
import { subject } from '@casl/ability'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepository,
    private readonly contactsRepo: ContactsRepository,
    private readonly dealRepo: DealRepository,
    private readonly redisService: RedisService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async createForContact(
    tenantId: string,
    contactId: string,
    userId: string,
    body: CreateActivityForContactBodyType,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<ActivityWithRelations> {
    const contact = await this.contactsRepo.findOne(contactId)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Contact', contact as any))) {
      throw new NotFoundException('Liên hệ không tồn tại')
    }

    const activity = await this.activitiesRepo.create(userId, body, { contactId })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  async createForDeal(
    tenantId: string,
    dealId: string,
    userId: string,
    body: CreateActivityForDealBodyType,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<ActivityWithRelations> {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Deal', deal as any))) {
      throw new NotFoundException('Deal không tồn tại')
    }

    if (body.contactId) {
      const contact = await this.contactsRepo.findOne(body.contactId)
      if (!contact || ability.cannot('read', subject('Contact', contact as any))) {
        throw new NotFoundException('Liên hệ không tồn tại')
      }
    }

    const targetContactId = body.contactId || deal.contactId

    const activity = await this.activitiesRepo.create(userId, body, {
      dealId,
      contactId: targetContactId,
    })
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  async getByContact(
    tenantId: string,
    contactId: string,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const contact = await this.contactsRepo.findOne(contactId)
    if (!contact) throw new NotFoundException('Liên hệ không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Contact', contact as any))) {
      throw new NotFoundException('Liên hệ không tồn tại')
    }

    const data = await this.activitiesRepo.findAllByContact(contactId)
    return { data }
  }

  async getByDeal(
    tenantId: string,
    dealId: string,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<{ data: ActivityWithRelations[] }> {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Deal không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Deal', deal as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Deal không tồn tại')
    }

    const data = await this.activitiesRepo.findAllByDeal(dealId)
    return { data }
  }

  async getAll(
    tenantId: string,
    query: GetActivitiesQueryType,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<GetActivitiesPaginatedResType> {
    const ability = await this.caslAbilityFactory.createForUser(user)
    const filters: { userId?: string } = {}

    if (ability.cannot('read', 'Activity')) {
      throw new ForbiddenException('Bạn không có quyền xem hoạt động')
    }

    if (ability.cannot('read', subject('Activity', { userId: 'other' } as any))) {
      filters.userId = user.userId
    }

    const { data, total } = await this.activitiesRepo.findAll(query, filters)
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async updateActivity(
    activityId: string,
    tenantId: string,
    body: UpdateActivityBodyType,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<ActivityWithRelations> {
    const existing = await this.activitiesRepo.findOne(activityId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('update', subject('Activity', existing as any))) {
      throw new ForbiddenException('Bạn không có quyền sửa hoạt động này')
    }

    const activity = await this.activitiesRepo.update(activityId, body)
    await this.redisService.invalidateTenantCache(tenantId)
    return activity
  }

  async deleteActivity(
    activityId: string,
    tenantId: string,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<{ message: string }> {
    const existing = await this.activitiesRepo.findOne(activityId)
    if (!existing) throw new NotFoundException('Hoạt động không tồn tại')

    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('delete', subject('Activity', existing as any))) {
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
