import { axiosInstance } from "@/lib/api";
import { GetUsersResSchema, UserOption } from "@/lib/validations/users.schema";

export const usersService = {
  getAll: async (): Promise<UserOption[]> => {
    const res = await axiosInstance.get("users");
    const parsed = GetUsersResSchema.parse(res.data);

    return Array.isArray(parsed) ? parsed : parsed.data;
  },
};
