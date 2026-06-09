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
};
