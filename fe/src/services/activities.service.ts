import { axiosInstance } from "@/lib/api";
import {
  ActivityItem,
  CreateActivityForContactBodyType,
  CreateActivityForDealBodyType,
  GetActivitiesListResType,
  GetActivitiesPaginatedResType,
  GetActivitiesParamsType,
  UpdateActivityBodyType,
} from "@/lib/validations/activities.scheme";

export const activitiesService = {
  // GET /activities — paginated + filtered
  getAll: async (
    params?: GetActivitiesParamsType,
  ): Promise<GetActivitiesPaginatedResType> => {
    const res = await axiosInstance.get("activities", { params });
    return res.data;
  },

  // GET /contacts/:contactId/activities
  getByContact: async (
    contactId: string,
  ): Promise<GetActivitiesListResType> => {
    const res = await axiosInstance.get(`contacts/${contactId}/activities`);
    return res.data;
  },

  // GET /deals/:dealId/activities
  getByDeal: async (dealId: string): Promise<GetActivitiesListResType> => {
    const res = await axiosInstance.get(`deals/${dealId}/activities`);
    return res.data;
  },

  // POST /contacts/:contactId/activities
  createForContact: async (
    contactId: string,
    body: CreateActivityForContactBodyType,
  ): Promise<ActivityItem> => {
    const res = await axiosInstance.post(
      `contacts/${contactId}/activities`,
      body,
    );
    return res.data;
  },

  // POST /deals/:dealId/activities
  createForDeal: async (
    dealId: string,
    body: CreateActivityForDealBodyType,
  ): Promise<ActivityItem> => {
    const res = await axiosInstance.post(`deals/${dealId}/activities`, body);
    return res.data;
  },

  // PATCH /activities/:id
  update: async (
    activityId: string,
    body: UpdateActivityBodyType,
  ): Promise<ActivityItem> => {
    const res = await axiosInstance.patch(`activities/${activityId}`, body);
    return res.data;
  },

  // DELETE /activities/:id
  delete: async (activityId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`activities/${activityId}`);
    return res.data;
  },
};
