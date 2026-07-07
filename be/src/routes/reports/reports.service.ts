import { Injectable, ForbiddenException } from '@nestjs/common'
import { ROLE } from 'src/common/constants/role.constanst'
import { DealStage, ActivityType } from '../../../generated/prisma-client/enums'
import { UpdateKpiTargetDto } from './reports.dto'
import { ReportsRepository } from './reports.repo'
const STAGE_PROBABILITIES = {
  [DealStage.PROSPECT]: 0.1,
  [DealStage.QUALIFIED]: 0.3,
  [DealStage.PROPOSAL]: 0.6,
  [DealStage.CLOSED_WON]: 1.0,
  [DealStage.CLOSED_LOST]: 0.0,
}

function parseDates(startDateStr?: string, endDateStr?: string) {
  const now = new Date()
  let start = new Date(now.getFullYear(), 0, 1) // default Jan 1st of current year
  let end = new Date(now)

  if (startDateStr) {
    const parsed = new Date(startDateStr)
    if (!isNaN(parsed.getTime())) start = parsed
  }
  if (endDateStr) {
    const parsed = new Date(endDateStr)
    if (!isNaN(parsed.getTime())) end = parsed
  }
  return { start, end }
}

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepo: ReportsRepository) {}

  // ─── 1. OVERVIEW API ────────────────────────────────────────────────────────
  async getOverview(
    tenantId: string,
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    userContext: { userId: string; role: string },
  ) {
    const isSalesRep = userContext.role === ROLE.SALES_REP
    const userFilter = isSalesRep ? { ownerId: userContext.userId } : {}
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

  // ─── 2. TEAM PERFORMANCE API ────────────────────────────────────────────────
  async getTeamPerformance(
    tenantId: string,
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    userContext: { userId: string; role: string },
  ) {
    const isSalesRep = userContext.role === ROLE.SALES_REP
    const { start, end } = parseDates(startDateStr, endDateStr)

    const users = await this.reportsRepo.findUsers(isSalesRep ? { id: userContext.userId } : {})

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

  // ─── 3. POST KPI TARGET ────────────────────────────────────────────────────
  async updateKpiTarget(
    tenantId: string,
    dto: UpdateKpiTargetDto,
    userContext: { role: string },
  ) {
    if (userContext.role !== ROLE.ADMIN && userContext.role !== ROLE.MANAGER) {
      throw new ForbiddenException('Chỉ ADMIN hoặc MANAGER mới có quyền cập nhật KPI.')
    }

    return this.reportsRepo.upsertKpiTarget(dto.userId, dto.month, dto.year, dto.target)
  }

  // ─── 4. PIPELINE ANALYSIS API ──────────────────────────────────────────────
  async getPipelineAnalysis(
    tenantId: string,
    userContext: { userId: string; role: string },
  ) {
    const isSalesRep = userContext.role === ROLE.SALES_REP
    const userFilter = isSalesRep ? { ownerId: userContext.userId } : {}

    const deals = await this.reportsRepo.findAllDeals(userFilter)

    const funnelStages = [
      { name: '1. Lead (Prospect)', key: DealStage.PROSPECT },
      { name: '2. Contacted (Qualified)', key: DealStage.QUALIFIED },
      { name: '3. Proposal', key: DealStage.PROPOSAL },
      { name: '4. Won', key: DealStage.CLOSED_WON },
    ]

    const leadCount = deals.filter((d) => d.stage === DealStage.PROSPECT).length
    const contactedCount = deals.filter((d) => d.stage === DealStage.QUALIFIED).length
    const proposalCount = deals.filter((d) => d.stage === DealStage.PROPOSAL).length
    const wonCount = deals.filter((d) => d.stage === DealStage.CLOSED_WON).length
    const lostCount = deals.filter((d) => d.stage === DealStage.CLOSED_LOST).length

    const getStageSum = (stage: DealStage) => deals.filter((d) => d.stage === stage).reduce((sum, d) => sum + Number(d.value), 0)

    const conversionFunnel = funnelStages.map((stage) => {
      let count = 0
      let value = 0

      if (stage.key === DealStage.PROSPECT) {
        count = leadCount + contactedCount + proposalCount + wonCount
        value = getStageSum(DealStage.PROSPECT) + getStageSum(DealStage.QUALIFIED) + getStageSum(DealStage.PROPOSAL) + getStageSum(DealStage.CLOSED_WON)
      } else if (stage.key === DealStage.QUALIFIED) {
        count = contactedCount + proposalCount + wonCount
        value = getStageSum(DealStage.QUALIFIED) + getStageSum(DealStage.PROPOSAL) + getStageSum(DealStage.CLOSED_WON)
      } else if (stage.key === DealStage.PROPOSAL) {
        count = proposalCount + wonCount
        value = getStageSum(DealStage.PROPOSAL) + getStageSum(DealStage.CLOSED_WON)
      } else {
        count = wonCount
        value = getStageSum(DealStage.CLOSED_WON)
      }

      const baseCount = leadCount + contactedCount + proposalCount + wonCount
      const percentage = baseCount > 0 ? Math.round((count / baseCount) * 100) : 0

      return {
        stage: stage.name,
        count,
        value: value, // raw VND
        percentage,
      }
    })

    const bottlenecks: { type: 'warning' | 'success'; title: string; description: string }[] = []
    
    const totalProspects = leadCount + contactedCount + proposalCount + wonCount
    const totalQualified = contactedCount + proposalCount + wonCount
    const qualRate = totalProspects > 0 ? (totalQualified / totalProspects) * 100 : 0
    if (qualRate < 50 && totalProspects > 0) {
      bottlenecks.push({
        type: 'warning',
        title: `Tỷ lệ Lead -> Contacted thấp (${Math.round(qualRate)}%)`,
        description: 'Tỷ lệ chuyển đổi khách hàng tiềm năng sang liên hệ thấp. Cần tăng cường hoạt động gọi điện/email tiếp cận.',
      })
    } else if (qualRate >= 50 && totalProspects > 0) {
      bottlenecks.push({
        type: 'success',
        title: `Chuyển đổi Lead tốt (${Math.round(qualRate)}%)`,
        description: 'Đội ngũ Sales đang làm tốt việc tiếp cận và xác nhận nhu cầu từ các khách hàng mới.',
      })
    }

    const propRate = totalQualified > 0 ? ((proposalCount + wonCount) / totalQualified) * 100 : 0
    if (propRate < 40 && totalQualified > 0) {
      bottlenecks.push({
        type: 'warning',
        title: `Tỷ lệ Contacted -> Proposal giảm mạnh (${Math.round(propRate)}%)`,
        description: 'Nhiều khách hàng đã liên hệ nhưng không nhận được/chưa đồng ý đề xuất giải pháp. Cần xem xét lại báo giá.',
      })
    }

    const winRateVal = (proposalCount + wonCount) > 0 ? (wonCount / (proposalCount + wonCount)) * 100 : 0
    if (winRateVal >= 50 && wonCount > 0) {
      bottlenecks.push({
        type: 'success',
        title: `Tỷ lệ Proposal -> Won cao (${Math.round(winRateVal)}%)`,
        description: 'Khi đã đề xuất giải pháp thành công, khả năng chốt deal của team rất ấn tượng.',
      })
    }

    const totalClosed = wonCount + lostCount
    const avgWinVelocity = totalClosed > 0 ? `${((wonCount / totalClosed) * 100).toFixed(1)}%` : '0.0%'

    const now = new Date()
    const currentYear = now.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    const kpiTargets = await this.reportsRepo.findKpiTargetsForYear(currentYear, userFilter)

    let cumActual = 0
    let cumForecast = 0
    let cumTarget = 0

    const weightedForecast = months.map((m) => {
      const monthWon = deals.filter((d) => {
        if (d.stage !== DealStage.CLOSED_WON) return false
        const dDate = d.closeDate || d.createdAt
        return dDate.getFullYear() === currentYear && dDate.getMonth() + 1 === m
      })
      const monthActualVal = monthWon.reduce((sum, d) => sum + Number(d.value), 0)

      const monthOpen = deals.filter((d) => {
        if (d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST) return false
        const dDate = d.closeDate || d.createdAt
        return dDate.getFullYear() === currentYear && dDate.getMonth() + 1 === m
      })
      const monthOpenWeightedVal = monthOpen.reduce((sum, d) => sum + Number(d.value) * (STAGE_PROBABILITIES[d.stage] || 0), 0)

      const monthTargets = kpiTargets.filter((t) => t.month === m)
      const monthTargetVal = monthTargets.reduce((sum, t) => sum + Number(t.target), 0)

      cumActual += monthActualVal
      cumTarget += monthTargetVal

      cumForecast += monthActualVal + monthOpenWeightedVal

      const isFutureMonth = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && m > now.getMonth() + 1)

      return {
        month: `T${m}`,
        actual: isFutureMonth ? undefined : cumActual,
        forecast: cumForecast,
        target: cumTarget > 0 ? cumTarget : undefined,
      }
    })

    return {
      conversionFunnel,
      bottlenecks,
      averageWinVelocity: avgWinVelocity,
      weightedForecast,
    }
  }

  // ─── 5. ACTIVITIES REPORT API ──────────────────────────────────────────────
  async getActivitiesReport(
    tenantId: string,
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    userContext: { userId: string; role: string },
  ) {
    const isSalesRep = userContext.role === ROLE.SALES_REP
    const userFilter = isSalesRep ? { userId: userContext.userId } : {}
    const { start, end } = parseDates(startDateStr, endDateStr)

    const activities = await this.reportsRepo.findActivities(start, end, userFilter)

    const monthsList: { label: string; year: number; month: number }[] = []
    const temp = new Date(start)
    while (temp <= end) {
      const label = `T${temp.getMonth() + 1}`
      if (!monthsList.find((m) => m.label === label && m.year === temp.getFullYear())) {
        monthsList.push({ label, year: temp.getFullYear(), month: temp.getMonth() + 1 })
      }
      temp.setMonth(temp.getMonth() + 1)
    }

    const tasks = await this.reportsRepo.findTasks(start, end, isSalesRep, userContext.userId)

    const trend = monthsList.map((m) => {
      const monthActivities = activities.filter((a) => {
        return a.date.getMonth() + 1 === m.month && a.date.getFullYear() === m.year
      })
      const Calls = monthActivities.filter((a) => a.type === ActivityType.CALL).length
      const Emails = monthActivities.filter((a) => a.type === ActivityType.EMAIL).length
      const Meetings = monthActivities.filter((a) => a.type === ActivityType.MEETING).length

      const monthTasks = tasks.filter((t) => {
        return t.done && t.createdAt.getMonth() + 1 === m.month && t.createdAt.getFullYear() === m.year
      }).length

      return {
        name: m.label,
        Calls,
        Emails,
        Meetings,
        Tasks: monthTasks,
      }
    })

    const now = new Date()
    const doneTasksCount = tasks.filter((t) => t.done).length
    const overdueTasksCount = tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < now).length
    const pendingTasksCount = tasks.filter((t) => !t.done && (!t.dueDate || new Date(t.dueDate) >= now)).length

    const totalTasks = doneTasksCount + overdueTasksCount + pendingTasksCount
    const statusDistribution = [
      { name: 'Đã xong', value: totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0 },
      { name: 'Quá hạn', value: totalTasks > 0 ? Math.round((overdueTasksCount / totalTasks) * 100) : 0 },
      { name: 'Đang chờ', value: totalTasks > 0 ? Math.round((pendingTasksCount / totalTasks) * 100) : 0 },
    ]

    return {
      trend,
      statusDistribution,
    }
  }
}

