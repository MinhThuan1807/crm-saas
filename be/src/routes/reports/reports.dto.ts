import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// ─── Query DTOs ──────────────────────────────────────────────────────────────
export const ReportsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).strict()

export class ReportsQueryDto extends createZodDto(ReportsQuerySchema) {}

// ─── Post KPI Target DTO ──────────────────────────────────────────────────────
export const UpdateKpiTargetSchema = z.object({
  userId: z.string().min(1),
  target: z.number().min(0),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
}).strict()

export class UpdateKpiTargetDto extends createZodDto(UpdateKpiTargetSchema) {}

// ─── Overview Response DTO ───────────────────────────────────────────────────
export const OverviewResSchema = z.object({
  kpis: z.object({
    totalRevenue: z.object({ value: z.string(), delta: z.string(), up: z.boolean() }),
    closedDeals: z.object({ value: z.string(), delta: z.string(), up: z.boolean(), subtext: z.string() }),
    winRate: z.object({ value: z.string(), delta: z.string(), up: z.boolean() }),
    avgDealSize: z.object({ value: z.string(), delta: z.string(), up: z.boolean() }),
    avgDaysToClose: z.object({ value: z.string(), delta: z.string(), up: z.boolean() }),
  }),
  revenueByMonth: z.array(z.object({
    month: z.string(),
    actual: z.number(),
    target: z.number(),
  })),
  forecastData: z.array(z.object({
    month: z.string(),
    cumActual: z.number(),
    cumForecast: z.number(),
  })),
  topDeals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    company: z.string(),
    owner: z.string(),
    ownerInitials: z.string(),
    ownerBg: z.string(),
    ownerColor: z.string(),
    value: z.string(),
    closedAt: z.string(),
    stage: z.string(),
  })),
})

export class OverviewResDto extends createZodDto(OverviewResSchema) {}

// ─── Team Performance Response DTO ───────────────────────────────────────────
export const TeamRepPerformanceSchema = z.object({
  userId: z.string(),
  name: z.string(),
  initials: z.string(),
  bg: z.string(),
  text: z.string(),
  actual: z.number(),
  target: z.number(),
  winRate: z.number(),
  activities: z.number(),
  avgDaysToClose: z.number(),
})

export const TeamPerformanceResSchema = z.array(TeamRepPerformanceSchema)
export class TeamPerformanceResDto extends createZodDto(z.object({ reps: TeamPerformanceResSchema })) {}

// ─── Pipeline Analysis Response DTO ──────────────────────────────────────────
export const FunnelStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
  value: z.number(),
  percentage: z.number(),
  color: z.string(),
})

export const PipelineAnalysisResSchema = z.object({
  conversionFunnel: z.array(FunnelStageSchema),
  bottlenecks: z.array(z.object({
    type: z.enum(['warning', 'success']),
    title: z.string(),
    description: z.string(),
  })),
  averageWinVelocity: z.string(),
  weightedForecast: z.array(z.object({
    month: z.string(),
    actual: z.number().optional(),
    forecast: z.number().optional(),
    target: z.number().optional(),
  })),
})

export class PipelineAnalysisResDto extends createZodDto(PipelineAnalysisResSchema) {}

// ─── Activities Report Response DTO ──────────────────────────────────────────
export const ActivitiesReportResSchema = z.object({
  trend: z.array(z.object({
    name: z.string(),
    Calls: z.number(),
    Emails: z.number(),
    Meetings: z.number(),
    Tasks: z.number(),
  })),
  statusDistribution: z.array(z.object({
    name: z.string(),
    value: z.number(),
    color: z.string(),
  })),
})

export class ActivitiesReportResDto extends createZodDto(ActivitiesReportResSchema) {}
