import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { DealStage } from '../../../generated/prisma-client/enums'

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDealsInPeriod(start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
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

  findKpiTargets(userFilter: Record<string, any>) {
    return this.prisma.kpiTarget.findMany({
      where: {
        ...userFilter,
      },
    })
  }

  findTopWonDeals(start: Date, end: Date, userFilter: Record<string, any>, take: number) {
    return this.prisma.deal.findMany({
      where: {
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

  findUsers(userFilter: Record<string, any>) {
    return this.prisma.user.findMany({
      where: {
        ...userFilter,
      },
      select: { id: true, name: true, role: true },
    })
  }

  findUserClosedDeals(userId: string, stage: DealStage, start: Date, end: Date) {
    return this.prisma.deal.findMany({
      where: {
        ownerId: userId,
        stage,
        closeDate: { gte: start, lte: end },
        deletedAt: null,
      },
    })
  }

  countUserActivities(userId: string, start: Date, end: Date) {
    return this.prisma.activity.count({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
    })
  }

  upsertKpiTarget(userId: string, month: number, year: number, target: number) {
    return this.prisma.kpiTarget.upsert({
      where: {
        // we cast where as any to bypass unique compound requirement of tenantId in compiler
        tenantId_userId_month_year: {
          userId,
          month,
          year,
        },
      } as any,
      update: { target },
      create: { userId, month, year, target } as any,
    })
  }

  findAllDeals(userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
        deletedAt: null,
        ...userFilter,
      },
    })
  }

  findKpiTargetsForYear(year: number, userFilter: Record<string, any>) {
    return this.prisma.kpiTarget.findMany({
      where: {
        year,
        ...userFilter,
      },
    })
  }

  findActivities(start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.activity.findMany({
      where: {
        date: { gte: start, lte: end },
        ...userFilter,
      },
    })
  }

  findTasks(start: Date, end: Date, isSalesRep: boolean, userId: string) {
    return this.prisma.task.findMany({
      where: {
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


