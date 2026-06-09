import { axiosInstance } from "@/lib/api";
import {
  CreateContactBodyType,
  GetContactResType,
  GetContactsQueryType,
  GetContactsResType,
  UpdateContactBodyType,
  UpdateContactResType,
} from "@/lib/validations/contacts.scheme";

export const contactsService = {
  getAll: async (
    params?: GetContactsQueryType,
  ): Promise<GetContactsResType> => {
    const response = await axiosInstance.get("contacts", { params });
    return response.data;
  },

  getById: async (id: string): Promise<GetContactResType> => {
    const response = await axiosInstance.get(`contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactBodyType): Promise<GetContactResType> => {
    const response = await axiosInstance.post("contacts", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateContactBodyType,
  ): Promise<UpdateContactResType> => {
    const response = await axiosInstance.patch(`contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`contacts/${id}`);
  },
};
