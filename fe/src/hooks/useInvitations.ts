"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationsService } from "@/services/invitations.service";
import { toast } from "sonner";

export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
};

export const useGetInvitations = () => {
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: invitationsService.getAll,
    staleTime: 10_000,
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      invitationsService.create(email, role),
    onSuccess: (data) => {
      toast.success("Đã gửi lời mời thành công!");
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Không thể gửi lời mời. Vui lòng thử lại.";
      toast.error(msg);
    },
  });
};

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitationsService.revoke(id),
    onSuccess: () => {
      toast.success("Đã hủy lời mời thành công!");
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Không thể hủy lời mời.";
      toast.error(msg);
    },
  });
};

export const useUpdateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email, role }: { id: string; email?: string; role?: string }) =>
      invitationsService.update(id, email, role),
    onSuccess: () => {
      toast.success("Đã cập nhật lời mời và gửi lại email thành công!");
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Không thể cập nhật lời mời.";
      toast.error(msg);
    },
  });
};
