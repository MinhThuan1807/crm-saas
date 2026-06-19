import { z } from "zod";

export const MetricTrendSchema = z.object({
  value: z.number(),
  positive: z.boolean(),
});

export const MetricCardSchema = z.object({
  label: z.string(),
  value: z.number(),
  trend: MetricTrendSchema.optional(),
  subtext: z.string().optional(),
  progress: z.object({
    current: z.number(),
    target: z.number(),
  }).optional(),
});

export const PipelineStageSchema = z.object({
  name: z.string(),
  count: z.number(),
  value: z.number(),
});

export const LeaderboardRepSchema = z.object({
  rank: z.number(),
  userId: z.string(),
  name: z.string(),
  deals: z.number(),
  revenue: z.number(),
});

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
});

export const UpcomingActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  contact: z.string(),
  company: z.string(),
  time: z.string(),
});

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
});

export type DashboardRes = z.infer<typeof DashboardResSchema>;
export type MetricCardType = z.infer<typeof MetricCardSchema>;
export type PipelineStageType = z.infer<typeof PipelineStageSchema>;
export type LeaderboardRepType = z.infer<typeof LeaderboardRepSchema>;
export type RecentDealType = z.infer<typeof RecentDealSchema>;
export type UpcomingActivityType = z.infer<typeof UpcomingActivitySchema>;
export type DashboardPeriod = "week" | "month" | "quarter";
