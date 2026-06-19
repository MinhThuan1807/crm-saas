import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { DealStage } from '../../../generated/prisma-client/enums'

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDealsInPeriod(tenantId: string, start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: start, lte: end },
        ...userFilter,
      },
      include: {
        activities: {
          select: {
            id: true,
          },
        },
      },
    })
  }

  findKpiTargets(tenantId: string, userFilter: Record<string, any>) {
    return this.prisma.kpiTarget.findMany({
      where: {
        tenantId,
        ...userFilter,
      },
    })
  }

  findTopWonDeals(tenantId: string, start: Date, end: Date, userFilter: Record<string, any>, take: number) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        stage: DealStage.CLOSED_WON,
        closeDate: { gte: start, lte: end },
        deletedAt: null,
        ...userFilter,
      },
      include: {
        contact: { select: { company: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { value: 'desc' },
      take,
    })
  }

  findUsers(tenantId: string, userFilter: Record<string, any>) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        ...userFilter,
      },
      select: { id: true, name: true, role: true },
    })
  }

  findUserClosedDeals(tenantId: string, userId: string, stage: DealStage, start: Date, end: Date) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        ownerId: userId,
        stage,
        closeDate: { gte: start, lte: end },
        deletedAt: null,
      },
    })
  }

  countUserActivities(tenantId: string, userId: string, start: Date, end: Date) {
    return this.prisma.activity.count({
      where: {
        tenantId,
        userId,
        date: { gte: start, lte: end },
      },
    })
  }

  upsertKpiTarget(tenantId: string, userId: string, month: number, year: number, target: number) {
    return this.prisma.kpiTarget.upsert({
      where: {
        tenantId_userId_month_year: {
          tenantId,
          userId,
          month,
          year,
        },
      },
      update: { target },
      create: { tenantId, userId, month, year, target },
    })
  }

  findAllDeals(tenantId: string, userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...userFilter,
      },
    })
  }

  findKpiTargetsForYear(tenantId: string, year: number, userFilter: Record<string, any>) {
    return this.prisma.kpiTarget.findMany({
      where: {
        tenantId,
        year,
        ...userFilter,
      },
    })
  }

  findActivities(tenantId: string, start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.activity.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
        ...userFilter,
      },
    })
  }

  findTasks(tenantId: string, start: Date, end: Date, isSalesRep: boolean, userId: string) {
    return this.prisma.task.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        ...(isSalesRep
          ? {
              deal: {
                ownerId: userId,
              },
            }
          : {}),
      },
    })
  }
}
