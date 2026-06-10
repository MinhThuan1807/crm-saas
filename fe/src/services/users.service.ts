import { axiosInstance } from "@/lib/api";
import { GetUsersResSchema, UserOption } from "@/lib/validations/users.schema";

export const usersService = {
  getAll: async (): Promise<UserOption[]> => {
    const res = await axiosInstance.get("users");
    const parsed = GetUsersResSchema.parse(res.data);

    return Array.isArray(parsed) ? parsed : parsed.data;
  },

  update: async (id: string, data: { name?: string; role?: string }) => {
    const res = await axiosInstance.patch(`users/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete(`users/${id}`);
    return res.data;
  },
};
