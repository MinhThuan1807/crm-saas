import { axiosInstance } from "@/lib/api";

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP";
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export const invitationsService = {
  create: async (email: string, role: string) => {
    const res = await axiosInstance.post("invitations", { email, role });
    return res.data;
  },

  getAll: async (): Promise<Invitation[]> => {
    const res = await axiosInstance.get("invitations");
    return res.data;
  },

  revoke: async (id: string) => {
    const res = await axiosInstance.delete(`invitations/${id}`);
    return res.data;
  },

  verify: async (token: string) => {
    const res = await axiosInstance.get(`invitations/verify/${token}`);
    return res.data;
  },

  accept: async (data: any) => {
    const res = await axiosInstance.post("invitations/accept", data);
    return res.data;
  },

  update: async (id: string, email?: string, role?: string) => {
    const res = await axiosInstance.patch(`invitations/${id}`, { email, role });
    return res.data;
  },
};
