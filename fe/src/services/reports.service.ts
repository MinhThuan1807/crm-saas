import { axiosInstance } from "@/lib/api";

export interface DateParams {
  startDate?: string;
  endDate?: string;
}

export interface KpiVal {
  value: string;
  delta: string;
  up: boolean;
  subtext?: string;
}

export interface OverviewRes {
  kpis: {
    totalRevenue: KpiVal;
    closedDeals: KpiVal;
    winRate: KpiVal;
    avgDealSize: KpiVal;
    avgDaysToClose: KpiVal;
  };
  revenueByMonth: {
    month: string;
    actual: number;
    target: number;
  }[];
  forecastData: {
    month: string;
    cumActual: number;
    cumForecast: number;
  }[];
  topDeals: {
    id: string;
    name: string;
    company: string;
    owner: string;
    ownerInitials: string;
    ownerBg: string;
    ownerColor: string;
    value: string;
    closedAt: string;
    stage: string;
  }[];
}

export interface TeamRepPerformance {
  userId: string;
  name: string;
  initials: string;
  bg: string;
  text: string;
  actual: number;
  target: number;
  winRate: number;
  activities: number;
  avgDaysToClose: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

export interface PipelineAnalysisRes {
  conversionFunnel: FunnelStage[];
  bottlenecks: {
    type: "warning" | "success";
    title: string;
    description: string;
  }[];
  averageWinVelocity: string;
  weightedForecast: {
    month: string;
    actual?: number;
    forecast?: number;
    target?: number;
  }[];
}

export interface ActivitiesReportRes {
  trend: {
    name: string;
    Calls: number;
    Emails: number;
    Meetings: number;
    Tasks: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

export const reportsService = {
  getOverview: async (params?: DateParams): Promise<OverviewRes> => {
    const res = await axiosInstance.get("reports/overview", { params });
    return res.data;
  },

  getTeamPerformance: async (params?: DateParams): Promise<TeamRepPerformance[]> => {
    const res = await axiosInstance.get("reports/team-performance", { params });
    // Note: backend wraps it as { reps: [...] } in DTO
    return res.data.reps;
  },

  updateKpiTarget: async (data: {
    userId: string;
    target: number;
    month: number;
    year: number;
  }) => {
    const res = await axiosInstance.post("reports/kpi", data);
    return res.data;
  },

  getPipelineAnalysis: async (): Promise<PipelineAnalysisRes> => {
    const res = await axiosInstance.get("reports/pipeline-analysis");
    return res.data;
  },

  getActivities: async (params?: DateParams): Promise<ActivitiesReportRes> => {
    const res = await axiosInstance.get("reports/activities", { params });
    return res.data;
  },
};
