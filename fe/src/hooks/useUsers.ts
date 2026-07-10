"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { toast } from "sonner";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
};

export const useGetUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersService.getAll,
    staleTime: 30_000,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, role }: { id: string; name?: string; role?: string }) =>
      usersService.update(id, { name, role }),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành viên thành công!");
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Không thể cập nhật thành viên.";
      toast.error(msg);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa thành viên khỏi workspace thành công!");
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Không thể xóa thành viên.";
      toast.error(msg);
    },
  });
};
