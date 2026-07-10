import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { DealStage } from '../../../generated/prisma-client/enums'

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDealsInPeriod(tenantId: string, start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: start, lte: end },
        ...userFilter,
      },
    })
  }

  findClosedWonDealsInPeriod(tenantId: string, start: Date, end: Date, userFilter: Record<string, any>) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        stage: DealStage.CLOSED_WON,
        deletedAt: null,
        createdAt: { gte: start, lte: end },
        ...userFilter,
      },
      select: {
        ownerId: true,
        value: true,
      },
    })
  }

  findUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })
  }

  findRecentDeals(tenantId: string, userFilter: Record<string, any>, take = 5) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...userFilter,
      },
      include: {
        contact: { select: { company: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
  }

  findUpcomingActivities(tenantId: string, start: Date, userFilter: Record<string, any>, take = 5) {
    return this.prisma.activity.findMany({
      where: {
        tenantId,
        date: { gte: start },
        ...userFilter,
      },
      include: {
        contact: { select: { name: true, company: true } },
      },
      orderBy: { date: 'asc' },
      take,
    })
  }
}
