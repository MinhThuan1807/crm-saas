import { axiosInstance } from "@/lib/api";
import {
  CreateContactBodyType,
  GetContactResType,
  GetContactsQueryType,
  GetContactsResType,
  UpdateContactBodyType,
  UpdateContactResType,
} from "@/lib/validations/contacts.scheme";

export interface BulkImportContactItem {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  tags?: string[];
  ownerEmail?: string | null;
  dealTitle?: string | null;
  dealValue?: number | null;
  dealStage?: string | null;
  dealNote?: string | null;
}

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

  bulkImport: async (contacts: BulkImportContactItem[]): Promise<{ success: boolean; count: number }> => {
    const response = await axiosInstance.post("contacts/bulk", { contacts });
    return response.data;
  },

  aiMapColumns: async (headers: string[]): Promise<{ mappings: Record<string, string | null> }> => {
    const response = await axiosInstance.post("contacts/import/map-columns", { headers });
    return response.data;
  },
};

