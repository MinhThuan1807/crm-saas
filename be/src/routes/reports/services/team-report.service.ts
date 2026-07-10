import { Injectable, ForbiddenException } from '@nestjs/common'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { DealStage } from '../../../../generated/prisma-client/enums'
import { UpdateKpiTargetDto } from '../reports.dto'
import { ReportsRepository } from '../reports.repo'
import { parseDates } from './report-helpers'
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory'
import { subject } from '@casl/ability'

@Injectable()
export class TeamReportService {
  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async getTeamPerformance(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Report', { view: 'team' } as any))) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo hiệu suất')
    }

    const { start, end } = parseDates(startDateStr, endDateStr)

    // If cannot view others' KPI Targets, filter to only get oneself (ABAC)
    const userFilter = ability.cannot('read', subject('KpiTarget', { userId: 'other' } as any))
      ? { id: user.userId }
      : {}

    const users = await this.reportsRepo.findUsers(userFilter)

    const repsPerformance = await Promise.all(
      users.map(async (u) => {
        const wonDeals = await this.reportsRepo.findUserClosedDeals(u.id, DealStage.CLOSED_WON, start, end)
        const actual = wonDeals.reduce((sum, d) => sum + Number(d.value), 0)

        const lostDeals = await this.reportsRepo.findUserClosedDeals(u.id, DealStage.CLOSED_LOST, start, end)

        const targets = await this.reportsRepo.findKpiTargets({ userId: u.id })
        
        let totalTarget = 0
        const temp = new Date(start)
        while (temp <= end) {
          const matching = targets.find((t) => t.month === temp.getMonth() + 1 && t.year === temp.getFullYear())
          if (matching) totalTarget += Number(matching.target)
          temp.setMonth(temp.getMonth() + 1)
        }

        const totalClosed = wonDeals.length + lostDeals.length
        const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0

        const activitiesCount = await this.reportsRepo.countUserActivities(u.id, start, end)

        const closed = [...wonDeals, ...lostDeals].filter((d) => d.closeDate)
        let avgDaysToClose = 0
        if (closed.length > 0) {
          const totalDays = closed.reduce((sum, d) => {
            const days = Math.round((d.closeDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            return sum + Math.max(0, days)
          }, 0)
          avgDaysToClose = Math.round(totalDays / closed.length)
        }

        return {
          userId: u.id,
          name: u.name,
          actual: actual, // raw VND
          target: totalTarget, // raw VND
          winRate,
          activities: activitiesCount,
          avgDaysToClose,
        }
      }),
    )

    return { reps: repsPerformance }
  }

  async updateKpiTarget(
    dto: UpdateKpiTargetDto,
    user: AccessTokenPayload,
  ) {
    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('update', 'KpiTarget')) {
      throw new ForbiddenException('Bạn không có quyền cập nhật KPI target.')
    }

    return this.reportsRepo.upsertKpiTarget(user.tenantId, dto.userId, dto.month, dto.year, dto.target)
  }
}
