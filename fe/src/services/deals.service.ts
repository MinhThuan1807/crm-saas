import { axiosInstance } from "@/lib/api";
import {
  CreateDealBodyType,
  UpdateDealBodyType,
  UpdateDealStageBodyType,
  DealCard,
  DealDetail,
  PipelineRes,
} from "@/lib/validations/deals.schema";


export const dealsService = {
  getPipeline: async (): Promise<PipelineRes> => {
    const res = await axiosInstance.get("deals/pipeline");
    return res.data;
  },

  getById: async (id: string): Promise<DealDetail> => {
    const res = await axiosInstance.get(`deals/${id}`);
    return res.data;
  },

  create: async (data: CreateDealBodyType): Promise<DealCard> => {
    const res = await axiosInstance.post("deals", data);
    return res.data;
  },

  updateStage: async (
    id: string,
    data: UpdateDealStageBodyType,
  ): Promise<DealCard> => {
    const res = await axiosInstance.patch(`deals/${id}/stage`, data);
    return res.data;
  },

  update: async (id: string, data: UpdateDealBodyType): Promise<DealCard> => {
    const res = await axiosInstance.patch(`deals/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`deals/${id}`);
  },

  analyze: async (id: string, meetingNote: string): Promise<{ jobId: string }> => {
    const res = await axiosInstance.post(`deals/${id}/analyze`, { meetingNote });
    return res.data;
  },

  createTask: async (dealId: string, title: string, dueDate?: string | null): Promise<any> => {
    const res = await axiosInstance.post(`deals/${dealId}/tasks`, { title, dueDate });
    return res.data;
  },

  createTasksBulk: async (dealId: string, tasks: Array<{ title: string; dueDate?: string | null }>): Promise<any> => {
    const res = await axiosInstance.post(`deals/${dealId}/tasks/bulk`, { tasks });
    return res.data;
  },

  updateTask: async (dealId: string, taskId: string, data: { title?: string; done?: boolean; dueDate?: string | null }): Promise<any> => {
    const res = await axiosInstance.patch(`deals/${dealId}/tasks/${taskId}`, data);
    return res.data;
  },

  deleteTask: async (dealId: string, taskId: string): Promise<any> => {
    const res = await axiosInstance.delete(`deals/${dealId}/tasks/${taskId}`);
    return res.data;
  },
};
