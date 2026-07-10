import { axiosInstance } from "@/lib/api";
import { GetUsersResSchema, UserOption } from "@/lib/validations/users.schema";

export interface RolePermission {
  id: string;
  action: string;
  subject: string;
  conditions?: Record<string, unknown> | null;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
}

export interface PermissionDto {
  id: string;
  action: string;
  subject: string;
  description: string | null;
}

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

  getRoles: async (): Promise<RoleDto[]> => {
    const res = await axiosInstance.get("users/roles");
    return res.data;
  },

  getPermissions: async (): Promise<PermissionDto[]> => {
    const res = await axiosInstance.get("users/permissions");
    return res.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const res = await axiosInstance.put(`users/roles/${roleId}/permissions`, { permissionIds });
    return res.data;
  },

  createRole: async (data: { name: string; description?: string }) => {
    const res = await axiosInstance.post("users/roles", data);
    return res.data;
  },

  updateRole: async (roleId: string, data: { name: string; description?: string }) => {
    const res = await axiosInstance.patch(`users/roles/${roleId}`, data);
    return res.data;
  },

  deleteRole: async (roleId: string) => {
    const res = await axiosInstance.delete(`users/roles/${roleId}`);
    return res.data;
  },
};
