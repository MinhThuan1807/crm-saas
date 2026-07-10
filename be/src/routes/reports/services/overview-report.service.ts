import { Injectable, ForbiddenException } from '@nestjs/common'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { DealStage } from '../../../../generated/prisma-client/enums'
import { ReportsRepository } from '../reports.repo'
import { parseDates, STAGE_PROBABILITIES } from './report-helpers'
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory'
import { subject } from '@casl/ability'

@Injectable()
export class OverviewReportService {
  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async getOverview(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Report', { view: 'overview' } as any))) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo tổng quan')
    }

    const userFilter = {}
    const { start, end } = parseDates(startDateStr, endDateStr)

    // Calculate previous period of same duration
    const duration = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - duration)
    const prevEnd = new Date(start.getTime())

    // ─── Metrics ───
    const [currentDeals, previousDeals] = await Promise.all([
      this.reportsRepo.findDealsInPeriod(start, end, userFilter),
      this.reportsRepo.findDealsInPeriod(prevStart, prevEnd, userFilter),
    ])

    // Metric 1: Total Revenue (CLOSED_WON deals value in period)
    const currentWon = currentDeals.filter((d) => d.stage === DealStage.CLOSED_WON)
    const prevWon = previousDeals.filter((d) => d.stage === DealStage.CLOSED_WON)
    const totalRev = currentWon.reduce((sum, d) => sum + Number(d.value), 0)
    const prevRev = prevWon.reduce((sum, d) => sum + Number(d.value), 0)
    const revDeltaVal = prevRev > 0 ? ((totalRev - prevRev) / prevRev) * 100 : totalRev > 0 ? 100 : 0
    const totalRevenue = {
      value: totalRev,
      delta: `${revDeltaVal >= 0 ? '+' : ''}${Math.round(revDeltaVal)}% YoY`,
      up: revDeltaVal >= 0,
    }

    // Metric 2: Total Closed Deals (won or lost in period)
    const currentClosedCount = currentDeals.filter((d) => d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST).length
    const prevClosedCount = previousDeals.filter((d) => d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST).length
    const closedDeltaVal = currentClosedCount - prevClosedCount
    const closedDeals = {
      value: currentClosedCount,
      delta: `${closedDeltaVal >= 0 ? '+' : ''}${closedDeltaVal}`,
      up: closedDeltaVal >= 0,
    }

    // Metric 3: Avg Win Rate
    const getWinRate = (deals: typeof currentDeals) => {
      const won = deals.filter((d) => d.stage === DealStage.CLOSED_WON).length
      const lost = deals.filter((d) => d.stage === DealStage.CLOSED_LOST).length
      const total = won + lost
      return total > 0 ? (won / total) * 100 : 0
    }
    const currentWinRateVal = getWinRate(currentDeals)
    const prevWinRateVal = getWinRate(previousDeals)
    const wrDeltaVal = currentWinRateVal - prevWinRateVal
    const winRate = {
      value: Number(currentWinRateVal.toFixed(1)),
      delta: `${wrDeltaVal >= 0 ? '+' : ''}${wrDeltaVal.toFixed(1)}%`,
      up: wrDeltaVal >= 0,
    }

    // Metric 4: Avg Deal Size
    const currentAvgSize = currentWon.length > 0 ? currentWon.reduce((sum, d) => sum + Number(d.value), 0) / currentWon.length : 0
    const prevAvgSize = prevWon.length > 0 ? prevWon.reduce((sum, d) => sum + Number(d.value), 0) / prevWon.length : 0
    const sizeDeltaVal = prevAvgSize > 0 ? ((currentAvgSize - prevAvgSize) / prevAvgSize) * 100 : currentAvgSize > 0 ? 100 : 0
    const avgDealSize = {
      value: Math.round(currentAvgSize),
      delta: `${sizeDeltaVal >= 0 ? '+' : ''}${Math.round(sizeDeltaVal)}%`,
      up: sizeDeltaVal >= 0,
    }

    // Metric 5: Avg Days to Close
    const getAvgDaysToClose = (deals: typeof currentDeals) => {
      const closed = deals.filter((d) => (d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST) && d.closeDate)
      if (closed.length === 0) return 0
      const totalDays = closed.reduce((sum, d) => {
        const days = Math.round((d.closeDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        return sum + Math.max(0, days)
      }, 0)
      return totalDays / closed.length
    }
    const currentAvgDays = getAvgDaysToClose(currentDeals)
    const prevAvgDays = getAvgDaysToClose(previousDeals)
    const daysDeltaVal = currentAvgDays - prevAvgDays
    const avgDaysToClose = {
      value: Math.round(currentAvgDays),
      delta: `${daysDeltaVal <= 0 ? '' : '+'}${Math.round(daysDeltaVal)} ngày`,
      up: daysDeltaVal <= 0,
    }

    // ─── Monthly Revenue & Forecast ───
    const monthsList: { label: string; year: number; month: number }[] = []
    const temp = new Date(start)
    while (temp <= end) {
      const label = `T${temp.getMonth() + 1}`
      if (!monthsList.find((m) => m.label === label && m.year === temp.getFullYear())) {
        monthsList.push({ label, year: temp.getFullYear(), month: temp.getMonth() + 1 })
      }
      temp.setMonth(temp.getMonth() + 1)
    }

    const targets = await this.reportsRepo.findKpiTargets(userFilter)

    const monthlyData = monthsList.map((m) => {
      const monthTargets = targets.filter((t) => t.month === m.month && t.year === m.year)
      const targetSum = monthTargets.reduce((sum, t) => sum + Number(t.target), 0)

      const monthWonDeals = currentWon.filter((d) => {
        const dDate = d.closeDate || d.createdAt
        return dDate.getMonth() + 1 === m.month && dDate.getFullYear() === m.year
      })
      const actualSum = monthWonDeals.reduce((sum, d) => sum + Number(d.value), 0)

      return {
        month: m.label,
        actual: actualSum, // raw VND
        target: targetSum, // raw VND
      }
    })

    // Cumulative actual vs forecast
    let cumActual = 0
    let cumForecast = 0
    const forecastCumulativeData = monthsList.map((m) => {
      const monthWon = currentWon.filter((d) => {
        const dDate = d.closeDate || d.createdAt
        return dDate.getFullYear() < m.year || (dDate.getFullYear() === m.year && dDate.getMonth() + 1 <= m.month)
      })
      const wonSum = monthWon.reduce((sum, d) => sum + Number(d.value), 0)

      const openDeals = currentDeals.filter((d) => {
        if (d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST) return false
        const dDate = d.closeDate || d.createdAt
        return dDate.getFullYear() < m.year || (dDate.getFullYear() === m.year && dDate.getMonth() + 1 <= m.month)
      })
      const openWeightedSum = openDeals.reduce((sum, d) => sum + Number(d.value) * (STAGE_PROBABILITIES[d.stage] || 0), 0)

      cumActual = wonSum
      cumForecast = wonSum + openWeightedSum

      return {
        month: m.label,
        cumActual: cumActual, // raw VND
        cumForecast: cumForecast, // raw VND
      }
    })

    // Top CLOSED_WON deals
    const topDealsRaw = await this.reportsRepo.findTopWonDeals(start, end, userFilter, 6)

    const topDeals = topDealsRaw.map((d) => {
      return {
        id: d.id,
        name: d.title,
        company: d.contact?.company || 'N/A',
        owner: {
          id: d.owner.id,
          name: d.owner.name,
        },
        value: Number(d.value), // raw number
        closedAt: d.closeDate ? d.closeDate.toISOString() : d.createdAt.toISOString(),
        stage: 'CLOSED_WON',
      }
    })

    // Calculate Win/Loss by stage conversion heuristic
    const winLossStages = [
      { stage: 'Prospect', winCount: 0, lossCount: 0 },
      { stage: 'Qualified', winCount: 0, lossCount: 0 },
      { stage: 'Proposal', winCount: 0, lossCount: 0 },
      { stage: 'Closed', winCount: 0, lossCount: 0 },
    ]

    for (const d of currentDeals) {
      const activitiesList = (d as any).activities || []
      const actCount = activitiesList.length

      if (d.stage === DealStage.CLOSED_WON) {
        winLossStages[0].winCount++
        winLossStages[1].winCount++
        winLossStages[2].winCount++
        winLossStages[3].winCount++
      } else if (d.stage === DealStage.CLOSED_LOST) {
        if (actCount <= 1) {
          winLossStages[0].lossCount++
        } else if (actCount === 2) {
          winLossStages[0].winCount++
          winLossStages[1].lossCount++
        } else if (actCount === 3) {
          winLossStages[0].winCount++
          winLossStages[1].winCount++
          winLossStages[2].lossCount++
        } else {
          winLossStages[0].winCount++
          winLossStages[1].winCount++
          winLossStages[2].winCount++
          winLossStages[3].lossCount++
        }
      }
    }

    const winLossData = winLossStages.map((s) => {
      const total = s.winCount + s.lossCount
      return {
        stage: s.stage,
        win: total > 0 ? Math.round((s.winCount / total) * 100) : 0,
        loss: total > 0 ? Math.round((s.lossCount / total) * 100) : 0,
      }
    })

    return {
      kpis: {
        totalRevenue,
        closedDeals,
        winRate,
        avgDealSize,
        avgDaysToClose,
      },
      revenueByMonth: monthlyData,
      forecastData: forecastCumulativeData,
      winLossData,
      topDeals,
    }
  }
}
