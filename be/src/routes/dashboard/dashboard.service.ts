import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { ROLE } from 'src/common/constants/role.constanst'
import { DealStage, ActivityType } from '../../../generated/prisma-client/enums'
import { DashboardPeriodType, DashboardResType } from './dashboard.model'
import { RedisService } from 'src/common/services/redis.service'

// Target revenue configurable via env, default to 500M VND
const TARGET_REVENUE_VND = process.env.MONTHLY_REVENUE_TARGET
  ? parseInt(process.env.MONTHLY_REVENUE_TARGET, 10)
  : 500000000

const AVATAR_COLORS = [
  { bg: '#D4F5E4', color: '#1A5C38' }, // Greenish
  { bg: '#D4E8F5', color: '#1A4C6A' }, // Bluish
  { bg: '#F5D4D4', color: '#6A1A1A' }, // Reddish
  { bg: '#FFF0D4', color: '#6A400A' }, // Orangish
  { bg: '#EEE8FD', color: '#3D2D8A' }, // Purplish
]

const STAGE_COLORS = {
  PROSPECT: { funnel: '#C4C0F0', bg: '#EEEDFE', text: '#534AB7' },
  QUALIFIED: { funnel: '#9B94E3', bg: '#E6F4D7', text: '#3B6D11' },
  PROPOSAL: { funnel: '#7168CC', bg: '#FEF3E2', text: '#854F0B' },
  CLOSED_WON: { funnel: '#534AB7', bg: '#DCFCE7', text: '#166534' },
  CLOSED_LOST: { funnel: '#E11D48', bg: '#FEE2E2', text: '#A32D2D' },
}

const ACTIVITY_CONFIG = {
  CALL: { bg: '#E6F4D7', color: '#3B6D11' },
  EMAIL: { bg: '#EEEDFE', color: '#534AB7' },
  MEETING: { bg: '#FEF3E2', color: '#854F0B' },
  NOTE: { bg: '#F1EFE8', color: '#6B6B67' },
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

function getPeriodRanges(period: DashboardPeriodType) {
  const now = new Date()
  const currentStart = new Date(now)
  const prevStart = new Date(now)
  const prevEnd = new Date(now)

  if (period === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    currentStart.setDate(diff)
    currentStart.setHours(0, 0, 0, 0)

    prevStart.setDate(diff - 7)
    prevStart.setHours(0, 0, 0, 0)
    prevEnd.setDate(diff - 1)
    prevEnd.setHours(23, 59, 59, 999)
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3)
    currentStart.setMonth(quarter * 3, 1)
    currentStart.setHours(0, 0, 0, 0)

    prevStart.setMonth((quarter - 1) * 3, 1)
    prevStart.setHours(0, 0, 0, 0)
    prevEnd.setMonth(quarter * 3, 0)
    prevEnd.setHours(23, 59, 59, 999)
  } else {
    // Default to 'month'
    currentStart.setDate(1)
    currentStart.setHours(0, 0, 0, 0)

    prevStart.setMonth(now.getMonth() - 1, 1)
    prevStart.setHours(0, 0, 0, 0)
    prevEnd.setDate(0)
    prevEnd.setHours(23, 59, 59, 999)
  }

  return {
    current: { start: currentStart, end: now },
    previous: { start: prevStart, end: prevEnd },
  }
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getDashboardData(
    tenantId: string,
    period: DashboardPeriodType,
    userContext: { userId: string; role: string },
  ): Promise<DashboardResType> {
    // Lấy phiên bản cache hiện tại của Tenant
    const version = await this.redisService.getTenantCacheVersion(tenantId);

    // Tạo khóa cache độc nhất dựa theo Tenant, phiên bản, chu kỳ lọc và phân quyền người dùng
    const cacheKey = `cache:dashboard:${tenantId}:${version}:${period}:${userContext.userId}:${userContext.role}`;

    // Thử dữ liệu từ Redis
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }


    const isSalesRep = userContext.role === ROLE.SALES_REP
    const userFilter = isSalesRep ? { ownerId: userContext.userId } : {}

    const ranges = getPeriodRanges(period)

    // ─── 1. QUERY DEALS FOR METRICS ───
    const [currentDeals, previousDeals] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: ranges.current.start, lte: ranges.current.end },
          ...userFilter,
        },
      }),
      this.prisma.deal.findMany({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: ranges.previous.start, lte: ranges.previous.end },
          ...userFilter,
        },
      }),
    ])

    // Metric 1: Total Deal Value
    const currentTotalValue = currentDeals.reduce((sum, d) => sum + Number(d.value), 0)
    const prevTotalValue = previousDeals.reduce((sum, d) => sum + Number(d.value), 0)
    let totalValueTrend = 0
    if (prevTotalValue > 0) {
      totalValueTrend = Math.round(((currentTotalValue - prevTotalValue) / prevTotalValue) * 100)
    } else if (currentTotalValue > 0) {
      totalValueTrend = 100
    }

    // Metric 2: Open Deals
    const openStages: DealStage[] = [DealStage.PROSPECT, DealStage.QUALIFIED, DealStage.PROPOSAL]
    const currentOpenDeals = currentDeals.filter((d) => openStages.includes(d.stage))
    const prevOpenDeals = previousDeals.filter((d) => openStages.includes(d.stage))
    const openDealsDiff = currentOpenDeals.length - prevOpenDeals.length
    const periodLabel = period === 'week' ? 'tuần này' : period === 'quarter' ? 'quý này' : 'tháng này'

    // Metric 3: Win Rate
    const getWinRate = (dealsList: typeof currentDeals) => {
      const closedWon = dealsList.filter((d) => d.stage === DealStage.CLOSED_WON).length
      const closedLost = dealsList.filter((d) => d.stage === DealStage.CLOSED_LOST).length
      const totalClosed = closedWon + closedLost
      return totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0
    }
    const currentWinRate = getWinRate(currentDeals)
    const prevWinRate = getWinRate(previousDeals)
    const winRateDiff = currentWinRate - prevWinRate

    // Metric 4: Revenue against Target (always monthly target)
    // Filter CLOSED_WON deals closed in the current month/period
    const closedWonDealsInPeriod = currentDeals.filter((d) => d.stage === DealStage.CLOSED_WON)
    const actualRevenue = closedWonDealsInPeriod.reduce((sum, d) => sum + Number(d.value), 0)
    const targetRevenue = TARGET_REVENUE_VND

    // ─── 2. PIPELINE FUNNEL ───
    // Group active deals in the current period by stage
    const funnelStages = [
      { name: 'Prospect', key: DealStage.PROSPECT },
      { name: 'Qualified', key: DealStage.QUALIFIED },
      { name: 'Proposal', key: DealStage.PROPOSAL },
      { name: 'Closed Won', key: DealStage.CLOSED_WON },
    ]

    const pipelineStages = funnelStages.map((stage) => {
      const stageDeals = currentDeals.filter((d) => d.stage === stage.key)
      const count = stageDeals.length
      const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.value), 0)
      return {
        name: stage.name,
        count,
        value: formatVnd(totalValue),
        color: STAGE_COLORS[stage.key].funnel,
      }
    })

    const pipelineTotalCount = currentDeals.length
    const pipelineTotalValue = currentTotalValue

    // ─── 3. LEADERBOARD ───
    // Query users of the tenant to calculate their sales performance
    const tenantUsers = await this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })

    const repsPerformance = await Promise.all(
      tenantUsers.map(async (u) => {
        const userClosedWonDeals = await this.prisma.deal.findMany({
          where: {
            tenantId,
            ownerId: u.id,
            stage: DealStage.CLOSED_WON,
            deletedAt: null,
            createdAt: { gte: ranges.current.start, lte: ranges.current.end },
          },
        })
        const revenue = userClosedWonDeals.reduce((sum, d) => sum + Number(d.value), 0)
        const dealsCount = userClosedWonDeals.length
        return {
          id: u.id,
          name: u.name,
          deals: dealsCount,
          revenue: Math.round(revenue / 1e6), // in millions
        }
      }),
    )

    // Sort reps by revenue descending, rank top 5
    const leaderboard = repsPerformance
      .filter((r) => r.revenue > 0 || r.deals > 0)
      .sort((a, b) => b.revenue - a.revenue || b.deals - a.deals)
      .slice(0, 5)
      .map((rep, idx) => {
        const colors = getAvatarColors(rep.id)
        return {
          rank: idx + 1,
          initials: getInitials(rep.name),
          name: rep.name,
          deals: rep.deals,
          revenue: rep.revenue,
          avatarBg: colors.bg,
          avatarColor: colors.color,
        }
      })

    // ─── 4. RECENT DEALS ───
    const recentDealsRaw = await this.prisma.deal.findMany({
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
      take: 5,
    })

    const now = new Date()
    const recentDeals = recentDealsRaw.map((d) => {
      const diffTime = Math.abs(now.getTime() - d.createdAt.getTime())
      const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const stageColors = STAGE_COLORS[d.stage] || STAGE_COLORS.PROSPECT
      const ownerColors = getAvatarColors(d.owner.id)

      return {
        id: d.id,
        title: d.title,
        company: d.contact?.company || 'N/A',
        stage: d.stage === DealStage.CLOSED_WON ? 'Closed Won' : d.stage === DealStage.CLOSED_LOST ? 'Closed Lost' : d.stage.charAt(0) + d.stage.slice(1).toLowerCase(),
        stageBg: stageColors.bg,
        stageColor: stageColors.text,
        value: formatVnd(Number(d.value)),
        owner: {
          initials: getInitials(d.owner.name),
          bg: ownerColors.bg,
          color: ownerColors.color,
        },
        daysAgo,
      }
    })

    // ─── 5. UPCOMING ACTIVITIES ───
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const upcomingActivitiesRaw = await this.prisma.activity.findMany({
      where: {
        tenantId,
        date: { gte: startOfToday },
        ...(isSalesRep ? { userId: userContext.userId } : {}),
      },
      include: {
        contact: { select: { name: true, company: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    })

    const upcomingActivities = upcomingActivitiesRaw.map((act) => {
      const actDate = new Date(act.date)
      const isToday = actDate.toDateString() === now.toDateString()
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      const isTomorrow = actDate.toDateString() === tomorrow.toDateString()

      let timeLabel = ''
      const timeStr = actDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      if (isToday) {
        timeLabel = `Hôm nay ${timeStr}`
      } else if (isTomorrow) {
        timeLabel = `Ngày mai ${timeStr}`
      } else {
        timeLabel = `${actDate.getDate()}/${actDate.getMonth() + 1} ${timeStr}`
      }

      return {
        id: act.id,
        type: act.type.toLowerCase(),
        title: act.title || 'Hoạt động crm',
        contact: act.contact?.name || 'N/A',
        company: act.contact?.company || 'N/A',
        time: timeLabel,
      }
    })

    // ─── COMPILE RESPONSE ───
    const result =  {
      metrics: {
        totalDealValue: {
          label: 'Tổng deal value',
          value: formatVnd(currentTotalValue),
          trend: {
            value: `${totalValueTrend >= 0 ? '+' : ''}${totalValueTrend}%`,
            positive: totalValueTrend >= 0,
          },
          subtext: 'So với kỳ trước',
        },
        openDeals: {
          label: 'Deals đang mở',
          value: `${currentOpenDeals.length}`,
          trend: {
            value: `${openDealsDiff >= 0 ? '+' : ''}${openDealsDiff} ${periodLabel}`,
            positive: openDealsDiff >= 0,
          },
          subtext: 'Đang trong pipeline',
        },
        winRate: {
          label: 'Tỷ lệ chốt',
          value: `${currentWinRate}%`,
          trend: {
            value: `${winRateDiff >= 0 ? '+' : ''}${winRateDiff}%`,
            positive: winRateDiff >= 0,
          },
          subtext: 'So với kỳ trước',
        },
        monthlyRevenue: {
          label: 'Doanh thu tháng',
          value: formatVnd(actualRevenue),
          progress: {
            current: Math.round(actualRevenue / 1e6), // in millions
            target: Math.round(targetRevenue / 1e6), // in millions
            label: `Target: ${formatVnd(targetRevenue)}`,
          },
        },
      },
      pipelineFunnel: {
        stages: pipelineStages,
        totalCount: pipelineTotalCount,
        totalValue: formatVnd(pipelineTotalValue),
      },
      leaderboard,
      recentDeals,
      upcomingActivities,
    }

    // Lưu kết quả tính toán vào Redis với TTL là 5 phút trước khi trả về
    await this.redisService.set(cacheKey, result, 300);

    return result;
  }
}
