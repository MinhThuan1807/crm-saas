import { z } from 'zod'

export const DashboardPeriodEnum = z.enum(['week', 'month', 'quarter'])
export type DashboardPeriodType = z.infer<typeof DashboardPeriodEnum>

export const GetDashboardQuerySchema = z.object({
  period: DashboardPeriodEnum.default('month'),
}).strict()

export type GetDashboardQueryType = z.infer<typeof GetDashboardQuerySchema>

export const MetricTrendSchema = z.object({
  value: z.number(),
  positive: z.boolean(),
})

export const MetricCardSchema = z.object({
  label: z.string(),
  value: z.number(),
  trend: MetricTrendSchema.optional(),
  subtext: z.string().optional(),
  progress: z.object({
    current: z.number(),
    target: z.number(),
  }).optional(),
})

export const PipelineStageSchema = z.object({
  name: z.string(),
  count: z.number(),
  value: z.number(),
})

export const LeaderboardRepSchema = z.object({
  rank: z.number(),
  userId: z.string(),
  name: z.string(),
  deals: z.number(),
  revenue: z.number(),
})

export const RecentDealSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  stage: z.string(),
  value: z.number(),
  owner: z.object({
    id: z.string(),
    name: z.string(),
  }),
  daysAgo: z.number(),
})

export const UpcomingActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  contact: z.string(),
  company: z.string(),
  time: z.string(),
})

export const DashboardResSchema = z.object({
  metrics: z.object({
    totalDealValue: MetricCardSchema,
    openDeals: MetricCardSchema,
    winRate: MetricCardSchema,
    monthlyRevenue: MetricCardSchema,
  }),
  pipelineFunnel: z.object({
    stages: z.array(PipelineStageSchema),
    totalCount: z.number(),
    totalValue: z.number(),
  }),
  leaderboard: z.array(LeaderboardRepSchema),
  recentDeals: z.array(RecentDealSchema),
  upcomingActivities: z.array(UpcomingActivitySchema),
})

export type DashboardResType = z.infer<typeof DashboardResSchema>
