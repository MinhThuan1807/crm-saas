import { Injectable, ForbiddenException } from '@nestjs/common'
import { ROLE } from 'src/common/constants/role.constanst'
import { DealStage, ActivityType } from '../../../generated/prisma-client/enums'
import { UpdateKpiTargetDto } from './reports.dto'
import { ReportsRepository } from './reports.repo'

const AVATAR_COLORS = [
  { bg: '#D4F5E4', color: '#1A5C38' }, // Greenish
  { bg: '#D4E8F5', color: '#1A4C6A' }, // Bluish
  { bg: '#F5D4D4', color: '#6A1A1A' }, // Reddish
  { bg: '#FFF0D4', color: '#6A400A' }, // Orangish
  { bg: '#EEE8FD', color: '#3D2D8A' }, // Purplish
]

const STAGE_PROBABILITIES = {
  [DealStage.PROSPECT]: 0.1,
  [DealStage.QUALIFIED]: 0.3,
  [DealStage.PROPOSAL]: 0.6,
  [DealStage.CLOSED_WON]: 1.0,
  [DealStage.CLOSED_LOST]: 0.0,
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const first = parts[0][0]
    const last = parts[parts.length - 1][0]
    return (first + last).toUpperCase()
  }
  return parts[0] ? parts[0][0].toUpperCase() : ''
}

function getAvatarColors(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function formatVnd(value: number): string {
  if (value >= 1e9) {
    const b = value / 1e9
    return `${Number(b.toFixed(1))} tỷ`
  }
  if (value >= 1e6) {
    const m = value / 1e6
    return `${Number(m.toFixed(1))}tr`
  }
  if (value >= 1e3) {
    const k = value / 1e3
    return `${Number(k.toFixed(1))}k`
  }
  return `${value}`
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
      this.reportsRepo.findDealsInPeriod(tenantId, start, end, userFilter),
      this.reportsRepo.findDealsInPeriod(tenantId, prevStart, prevEnd, userFilter),
    ])

    // Metric 1: Total Revenue (CLOSED_WON deals value in period)
    const currentWon = currentDeals.filter((d) => d.stage === DealStage.CLOSED_WON)
    const prevWon = previousDeals.filter((d) => d.stage === DealStage.CLOSED_WON)
    const totalRev = currentWon.reduce((sum, d) => sum + Number(d.value), 0)
    const prevRev = prevWon.reduce((sum, d) => sum + Number(d.value), 0)
    const revDeltaVal = prevRev > 0 ? ((totalRev - prevRev) / prevRev) * 100 : totalRev > 0 ? 100 : 0
    const totalRevenue = {
      value: formatVnd(totalRev),
      delta: `${revDeltaVal >= 0 ? '+' : ''}${Math.round(revDeltaVal)}% YoY`,
      up: revDeltaVal >= 0,
    }

    // Metric 2: Total Closed Deals (won or lost in period)
    const currentClosedCount = currentDeals.filter((d) => d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST).length
    const prevClosedCount = previousDeals.filter((d) => d.stage === DealStage.CLOSED_WON || d.stage === DealStage.CLOSED_LOST).length
    const closedDeltaVal = currentClosedCount - prevClosedCount
    const closedDeals = {
      value: `${currentClosedCount}`,
      delta: `${closedDeltaVal >= 0 ? '+' : ''}${closedDeltaVal}`,
      up: closedDeltaVal >= 0,
      subtext: 'so với kỳ trước',
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
      value: `${currentWinRateVal.toFixed(1)}%`,
      delta: `${wrDeltaVal >= 0 ? '+' : ''}${wrDeltaVal.toFixed(1)}%`,
      up: wrDeltaVal >= 0,
    }

    // Metric 4: Avg Deal Size
    const currentAvgSize = currentWon.length > 0 ? currentWon.reduce((sum, d) => sum + Number(d.value), 0) / currentWon.length : 0
    const prevAvgSize = prevWon.length > 0 ? prevWon.reduce((sum, d) => sum + Number(d.value), 0) / prevWon.length : 0
    const sizeDeltaVal = prevAvgSize > 0 ? ((currentAvgSize - prevAvgSize) / prevAvgSize) * 100 : currentAvgSize > 0 ? 100 : 0
    const avgDealSize = {
      value: formatVnd(currentAvgSize),
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
      value: `${Math.round(currentAvgDays)} ngày`,
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

    const targets = await this.reportsRepo.findKpiTargets(tenantId, userFilter)

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
        actual: Math.round(actualSum / 1000), // in thousands
        target: Math.round(targetSum / 1000), // in thousands
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
        cumActual: Math.round(cumActual / 1000), // in thousands
        cumForecast: Math.round(cumForecast / 1000), // in thousands
      }
    })

    // Top CLOSED_WON deals
    const topDealsRaw = await this.reportsRepo.findTopWonDeals(tenantId, start, end, userFilter, 6)

    const topDeals = topDealsRaw.map((d) => {
      const colors = getAvatarColors(d.owner.id)
      return {
        id: d.id,
        name: d.title,
        company: d.contact?.company || 'N/A',
        owner: d.owner.name,
        ownerInitials: getInitials(d.owner.name),
        ownerBg: colors.bg,
        ownerColor: colors.color,
        value: formatVnd(Number(d.value)),
        closedAt: d.closeDate ? d.closeDate.toLocaleDateString('vi-VN') : d.createdAt.toLocaleDateString('vi-VN'),
        stage: 'CLOSED_WON',
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

    const users = await this.reportsRepo.findUsers(tenantId, isSalesRep ? { id: userContext.userId } : {})

    const repsPerformance = await Promise.all(
      users.map(async (u) => {
        const wonDeals = await this.reportsRepo.findUserClosedDeals(tenantId, u.id, DealStage.CLOSED_WON, start, end)
        const actual = wonDeals.reduce((sum, d) => sum + Number(d.value), 0)

        const lostDeals = await this.reportsRepo.findUserClosedDeals(tenantId, u.id, DealStage.CLOSED_LOST, start, end)

        const targets = await this.reportsRepo.findKpiTargets(tenantId, { userId: u.id })
        
        let totalTarget = 0
        const temp = new Date(start)
        while (temp <= end) {
          const matching = targets.find((t) => t.month === temp.getMonth() + 1 && t.year === temp.getFullYear())
          if (matching) totalTarget += Number(matching.target)
          temp.setMonth(temp.getMonth() + 1)
        }

        const totalClosed = wonDeals.length + lostDeals.length
        const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0

        const activitiesCount = await this.reportsRepo.countUserActivities(tenantId, u.id, start, end)

        const closed = [...wonDeals, ...lostDeals].filter((d) => d.closeDate)
        let avgDaysToClose = 0
        if (closed.length > 0) {
          const totalDays = closed.reduce((sum, d) => {
            const days = Math.round((d.closeDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            return sum + Math.max(0, days)
          }, 0)
          avgDaysToClose = Math.round(totalDays / closed.length)
        }

        const colors = getAvatarColors(u.id)

        return {
          userId: u.id,
          name: u.name,
          initials: getInitials(u.name),
          bg: colors.bg,
          text: colors.color,
          actual: Math.round(actual / 1000),
          target: Math.round(totalTarget / 1000),
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

    return this.reportsRepo.upsertKpiTarget(tenantId, dto.userId, dto.month, dto.year, dto.target)
  }

  // ─── 4. PIPELINE ANALYSIS API ──────────────────────────────────────────────
  async getPipelineAnalysis(
    tenantId: string,
    userContext: { userId: string; role: string },
  ) {
    const isSalesRep = userContext.role === ROLE.SALES_REP
    const userFilter = isSalesRep ? { ownerId: userContext.userId } : {}

    const deals = await this.reportsRepo.findAllDeals(tenantId, userFilter)

    const funnelStages = [
      { name: '1. Lead (Prospect)', key: DealStage.PROSPECT, color: '#534AB7' },
      { name: '2. Contacted (Qualified)', key: DealStage.QUALIFIED, color: '#6C63D3' },
      { name: '3. Proposal', key: DealStage.PROPOSAL, color: '#877EF2' },
      { name: '4. Won', key: DealStage.CLOSED_WON, color: '#1D9E75' },
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
        value: Math.round(value / 1000),
        percentage,
        color: stage.color,
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

    const kpiTargets = await this.reportsRepo.findKpiTargetsForYear(tenantId, currentYear, userFilter)

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
        actual: isFutureMonth ? undefined : Math.round(cumActual / 1000),
        forecast: Math.round(cumForecast / 1000),
        target: cumTarget > 0 ? Math.round(cumTarget / 1000) : undefined,
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

    const activities = await this.reportsRepo.findActivities(tenantId, start, end, userFilter)

    const monthsList: { label: string; year: number; month: number }[] = []
    const temp = new Date(start)
    while (temp <= end) {
      const label = `T${temp.getMonth() + 1}`
      if (!monthsList.find((m) => m.label === label && m.year === temp.getFullYear())) {
        monthsList.push({ label, year: temp.getFullYear(), month: temp.getMonth() + 1 })
      }
      temp.setMonth(temp.getMonth() + 1)
    }

    const tasks = await this.reportsRepo.findTasks(tenantId, start, end, isSalesRep, userContext.userId)

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
      { name: 'Đã xong', value: totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0, color: '#1D9E75' },
      { name: 'Quá hạn', value: totalTasks > 0 ? Math.round((overdueTasksCount / totalTasks) * 100) : 0, color: '#D85A30' },
      { name: 'Đang chờ', value: totalTasks > 0 ? Math.round((pendingTasksCount / totalTasks) * 100) : 0, color: '#FBBF24' },
    ]

    return {
      trend,
      statusDistribution,
    }
  }
}
