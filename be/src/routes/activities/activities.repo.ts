import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import {
  CreateActivityForContactBodyType,
  CreateActivityForDealBodyType,
  UpdateActivityBodyType,
  GetActivitiesQueryType,
  ActivityBaseType,
} from './activities.model'

// ActivityWithRelations matches ActivityBaseType (with nested user, contact, deal)
export type ActivityWithRelations = ActivityBaseType

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Shared create for both contact and deal contexts
  create(
    tenantId: string,
    userId: string,
    data: CreateActivityForContactBodyType | CreateActivityForDealBodyType,
    context: { contactId?: string; dealId?: string },
  ): Promise<ActivityWithRelations> {
    return this.prisma.activity.create({
      data: {
        tenantId,
        userId,
        type: data.type,
        note: data.note,
        title: data.title ?? null,
        date: data.date ?? new Date(),
        contactId: context.contactId ?? null,
        dealId: context.dealId ?? null,
      },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    })
  }

  // Get activities by contact, ordered by date desc
  findAllByContact(tenantId: string, contactId: string): Promise<ActivityWithRelations[]> {
    return this.prisma.activity.findMany({
      where: { tenantId, contactId },
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    })
  }

  // Get activities by deal, ordered by date desc with id desc as tiebreaker
  findAllByDeal(tenantId: string, dealId: string): Promise<ActivityWithRelations[]> {
    return this.prisma.activity.findMany({
      where: { tenantId, dealId },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    })
  }

  // Get all activities for tenant with pagination and filters
  async findAll(
    tenantId: string,
    query: GetActivitiesQueryType,
  ): Promise<{ data: ActivityWithRelations[]; total: number }> {
    const where = {
      tenantId,
      ...(query.type && { type: query.type }),
      ...(query.contactId && { contactId: query.contactId }),
      ...(query.dealId && { dealId: query.dealId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { note: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        include: {
          user: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true, company: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      this.prisma.activity.count({ where }),
    ])

    return { data, total }
  }

  // Find a single activity by id + tenantId, returns null if not found
  findOne(activityId: string, tenantId: string): Promise<ActivityWithRelations | null> {
    return this.prisma.activity.findFirst({
      where: { id: activityId, tenantId },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    })
  }

  // Partial update — only updates provided fields
  update(activityId: string, tenantId: string, data: UpdateActivityBodyType): Promise<ActivityWithRelations> {
    return this.prisma.activity.update({
      where: { id: activityId, tenantId },
      data,
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    })
  }

  // Hard delete — Activity has no deletedAt field
  async hardDelete(activityId: string, tenantId: string): Promise<void> {
    await this.prisma.activity.delete({
      where: { id: activityId, tenantId },
    })
  }
}
