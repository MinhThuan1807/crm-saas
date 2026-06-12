import { axiosInstance } from "@/lib/api";
import { LoginFormValues, RegisterFormValues } from "../types/auth.type";
import { RegisterBodyType } from "@/lib/validations/auth.schema";

export const authService = {
  login: async (values: LoginFormValues) => {
    const response = await axiosInstance.post("auth/login", values);
    return response.data;
  },
  logout: async () => {
    const response = await axiosInstance.post("auth/logout");
    return response.data;
  },
  register: async (values: RegisterBodyType) => {
    const response = await axiosInstance.post("auth/register", values);
    return response.data;
  },
  me: async (): Promise<{ id: string; email: string; name: string; role: string; tenantId: string }> => {
    const response = await axiosInstance.get("auth/me");
    return response.data;
  },
};
