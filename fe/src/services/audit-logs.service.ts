import { axiosInstance } from "@/lib/api";

export interface AuditLogItem {
  id: string;
  tenantId: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  targetType: "DEAL" | "CONTACT";
  targetId: string;
  targetName: string | null;
  changes: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface GetAuditLogsParams {
  limit?: number;
  cursor?: string;
  action?: string;
  targetType?: string;
  userId?: string;
  search?: string;
}

export interface GetAuditLogsRes {
  data: AuditLogItem[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

export const auditLogsService = {
  getAll: async (params: GetAuditLogsParams): Promise<GetAuditLogsRes> => {
    const res = await axiosInstance.get("audit-logs", { params });
    return res.data;
  },
};
