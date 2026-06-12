import { axiosInstance } from "@/lib/api";
import { DashboardRes, DashboardPeriod } from "@/lib/validations/dashboard.schema";

export const dashboardService = {
  getDashboardData: async (period: DashboardPeriod): Promise<DashboardRes> => {
    const res = await axiosInstance.get("dashboard", {
      params: { period },
    });
    return res.data;
  },
};
