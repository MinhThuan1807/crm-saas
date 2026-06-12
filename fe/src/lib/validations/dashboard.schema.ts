import { z } from "zod";

export const MetricTrendSchema = z.object({
  value: z.string(),
  positive: z.boolean(),
});

export const MetricCardSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: MetricTrendSchema.optional(),
  subtext: z.string().optional(),
  progress: z.object({
    current: z.number(),
    target: z.number(),
    label: z.string(),
  }).optional(),
});

export const PipelineStageSchema = z.object({
  name: z.string(),
  count: z.number(),
  value: z.string(),
  color: z.string(),
});

export const LeaderboardRepSchema = z.object({
  rank: z.number(),
  initials: z.string(),
  name: z.string(),
  deals: z.number(),
  revenue: z.number(),
  avatarBg: z.string(),
  avatarColor: z.string(),
});

export const RecentDealSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  stage: z.string(),
  stageBg: z.string(),
  stageColor: z.string(),
  value: z.string(),
  owner: z.object({
    initials: z.string(),
    bg: z.string(),
    color: z.string(),
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
    totalValue: z.string(),
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
