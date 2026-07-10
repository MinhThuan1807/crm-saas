"use client";

import { activitiesService } from "@/services/activities.service";
import {
  ActivityType,
  CreateActivityForContactBodyType,
  CreateActivityForDealBodyType,
  GetActivitiesParamsType,
  UpdateActivityBodyType,
} from "@/lib/validations/activities.scheme";
import { ApiError } from "@/types/error.type";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────
// QUERY KEYS — source of truth cho cache
// ─────────────────────────────────────────
export const activityKeys = {
  all: ["activities"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (params?: GetActivitiesParamsType) =>
    [...activityKeys.lists(), params] as const,
  infinite: (params?: Omit<GetActivitiesParamsType, "page">) =>
    [...activityKeys.all, "infinite", params] as const,
  byContact: (contactId: string) =>
    [...activityKeys.all, "contact", contactId] as const,
  byDeal: (dealId: string) => [...activityKeys.all, "deal", dealId] as const,
};

// ─────────────────────────────────────────
// GET ALL (paginated) — used for tables/lists with specific pagination
// ─────────────────────────────────────────
export const useActivities = (params?: GetActivitiesParamsType) => {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activitiesService.getAll(params),
    staleTime: 30_000,
  });
};

// ─────────────────────────────────────────
// GET ALL (infinite scroll / "Load more") — used for Activities page
// ─────────────────────────────────────────
export const useActivitiesInfinite = (
  params?: Omit<GetActivitiesParamsType, "page">,
) => {
  return useInfiniteQuery({
    queryKey: activityKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      activitiesService.getAll({ ...params, page: pageParam as number }),
    staleTime: 30_000,
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
  });
};

// ─────────────────────────────────────────
// GET BY CONTACT — used on Contact Detail Page
// ─────────────────────────────────────────
export const useContactActivities = (contactId: string) => {
  return useQuery({
    queryKey: activityKeys.byContact(contactId),
    queryFn: () => activitiesService.getByContact(contactId),
    enabled: !!contactId,
    staleTime: 30_000,
    select: (data) => data.data, // return ActivityItem[] directly for ease of use
  });
};

// ─────────────────────────────────────────
// GET BY DEAL — used on Deal Detail Page
// ─────────────────────────────────────────
export const useDealActivities = (dealId: string) => {
  return useQuery({
    queryKey: activityKeys.byDeal(dealId),
    queryFn: () => activitiesService.getByDeal(dealId),
    enabled: !!dealId,
    staleTime: 30_000,
    select: (data) => data.data, // return ActivityItem[] directly for ease of use
  });
};

// ─────────────────────────────────────────
// CREATE FOR CONTACT
// ─────────────────────────────────────────
export const useCreateContactActivity = (contactId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateActivityForContactBodyType) =>
      activitiesService.createForContact(contactId, body),
    onSuccess: () => {
      // Invalidate both contact list and global activities
      queryClient.invalidateQueries({
        queryKey: activityKeys.byContact(contactId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Tạo hoạt động thành công");
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message ?? "Tạo hoạt động thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// CREATE FOR DEAL
// ─────────────────────────────────────────
export const useCreateDealActivity = (dealId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateActivityForDealBodyType) =>
      activitiesService.createForDeal(dealId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.byDeal(dealId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Tạo hoạt động thành công");
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message ?? "Tạo hoạt động thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// UPDATE ACTIVITY
// ─────────────────────────────────────────
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateActivityBodyType }) =>
      activitiesService.update(id, body),
    onSuccess: () => {
      // Invalidate all activity cache (list, infinite, byContact, byDeal)
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Cập nhật hoạt động thành công");
    },
    onError: (error: ApiError) => {
      const message =
        error.response?.data.message ?? "Cập nhật hoạt động thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// DELETE ACTIVITY
// ─────────────────────────────────────────
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => activitiesService.delete(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Xóa hoạt động thành công");
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message ?? "Xóa hoạt động thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// Re-export ActivityType enum to use in components
// without importing again from validations
// ─────────────────────────────────────────
export { ActivityType };
