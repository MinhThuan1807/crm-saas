"use client";

import { useEffect } from "react";
import { dealsService } from "@/services/deals.service";
import { useDealPipelineStore } from "@/stores/dealCards-store";
import { useShallow } from 'zustand/react/shallow'
import { ApiError } from "@/lib/types/error";
import {
  CreateDealBodyType,
  DealStage,
  UpdateDealBodyType,
  UpdateDealStageBodyType,
} from "@/lib/validations/deals.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────
// QUERY KEYS — source of truth cho cache
// ─────────────────────────────────────────
export const dealKeys = {
  all: ["deals"] as const,
  pipeline: () => [...dealKeys.all, "pipeline"] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// ─────────────────────────────────────────
// GET PIPELINE — fetch and sync to Zustand
// ─────────────────────────────────────────
export const useGetPipeline = () => {

  const { setPipeline, setLoading, setError } = useDealPipelineStore(
    useShallow((state) => ({
      setPipeline: state.setPipeline, 
      setLoading: state.setLoading,
      setError: state.setError })
    )
  )

  const query = useQuery({
    queryKey: dealKeys.pipeline(),
    queryFn: dealsService.getPipeline,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      setPipeline(query.data);
      setError(null);
    }
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (query.error) {
      setError((query.error as Error).message ?? "Lỗi tải pipeline");
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
};

// ─────────────────────────────────────────
// GET DEAL DETAIL — used on /pipeline/[id] page
// ─────────────────────────────────────────
export const useGetDealDetail = (id: string) => {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealsService.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
};

// ─────────────────────────────────────────
// CREATE DEAL
// ─────────────────────────────────────────
export const useCreateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealBodyType) => dealsService.create(data),
    onSuccess: () => {
      // invalidate pipeline to refetch and sync back to store
      queryClient.invalidateQueries({ queryKey: dealKeys.pipeline() });
      toast.success("Tạo deal thành công");
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message ?? "Tạo deal thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// UPDATE DEAL STAGE — optimistic via Zustand
// ─────────────────────────────────────────
export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  const { rollbackMoveDeal } = useDealPipelineStore();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      from: DealStage;
      to: DealStage;
      data: UpdateDealStageBodyType;
    }) => dealsService.updateStage(id, data),

    // optimistic update was already called in KanbanBoard (moveDeal)
    // if API fails -> rollback
    onError: (error: ApiError, { id, from, to }) => {
      rollbackMoveDeal(id, from, to);
      const message = error.response?.data.message ?? "Cập nhật stage thất bại";
      toast.error(message);
    },

    onSuccess: () => {
      // invalidate to ensure server state is synchronized
      queryClient.invalidateQueries({ queryKey: dealKeys.pipeline() });
    },
  });
};

// ─────────────────────────────────────────
// UPDATE DEAL (title, value, closeDate, note)
// ─────────────────────────────────────────
export const useUpdateDeal = (dealId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDealBodyType) => dealsService.update(dealId, data),
    onSuccess: () => {
      // invalidate both pipeline and detail
      queryClient.invalidateQueries({ queryKey: dealKeys.pipeline() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      toast.success("Cập nhật deal thành công");
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message ?? "Cập nhật deal thất bại";
      toast.error(message);
    },
  });
};

// ─────────────────────────────────────────
// DELETE DEAL (soft delete)
// ─────────────────────────────────────────
export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  const { removeDeal } = useDealPipelineStore();

  return useMutation({
    mutationFn: ({ id }: { id: string; stage: DealStage }) =>
      dealsService.delete(id),

    // optimistic: delete from store immediately
    onMutate: ({ id, stage }) => {
      removeDeal(id, stage);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.pipeline() });
      toast.success("Xóa deal thành công");
    },

    onError: (error: ApiError) => {
      // rollback: refetch pipeline to restore accidentally deleted deal
      queryClient.invalidateQueries({ queryKey: dealKeys.pipeline() });
      const message = error.response?.data.message ?? "Xóa deal thất bại";
      toast.error(message);
    },
  });
};
