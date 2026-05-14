"use client";

import { create } from "zustand";
import {
  DealCard,
  PipelineRes,
  DealStage,
} from "@/lib/validations/deals.schema";

const initialPipeline: PipelineRes = {
  PROSPECT: [],
  QUALIFIED: [],
  PROPOSAL: [],
  CLOSED_WON: [],
  CLOSED_LOST: [],
};

type PipelineState = {
  pipeline: PipelineRes;
  isLoading: boolean;
  error: string | null;
} & PipelineActions;

type PipelineActions = {
  setPipeline: (data: PipelineRes) => void;
  moveDeal: (dealId: string, from: DealStage, to: DealStage) => void;
  rollbackMoveDeal: (dealId: string, from: DealStage, to: DealStage) => void;
  // Reorder trong cùng cột (sort)
  reorderDeal: (stage: DealStage, fromIndex: number, toIndex: number) => void;
  updateDeal: (deal: DealCard) => void;
  removeDeal: (dealId: string, stage: DealStage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useDealPipelineStore = create<PipelineState>((set, get) => ({
  pipeline: initialPipeline,
  isLoading: false,
  error: null,

  setPipeline: (data) => set({ pipeline: data }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Optimistic update: di chuyển deal ngay lập tức trên UI
  moveDeal: (dealId, from, to) => {
    const pipeline = get().pipeline;
    const deal = pipeline[from].find((d) => d.id === dealId);
    if (!deal) return;

    set({
      pipeline: {
        ...pipeline,
        [from]: pipeline[from].filter((d) => d.id !== dealId),
        [to]: [{ ...deal, stage: to }, ...pipeline[to]],
      },
    });
  },

  // Rollback: hoàn tác moveDeal khi API thất bại
  rollbackMoveDeal: (dealId, from, to) => {
    // from/to là chiều đã move — rollback ngược lại (to → from)
    const pipeline = get().pipeline;
    const deal = pipeline[to].find((d) => d.id === dealId);
    if (!deal) return;

    set({
      pipeline: {
        ...pipeline,
        [to]: pipeline[to].filter((d) => d.id !== dealId),
        [from]: [...pipeline[from], { ...deal, stage: from }],
      },
    });
  },

  // Cập nhật deal trong đúng cột của nó
  updateDeal: (updatedDeal) => {
    const pipeline = get().pipeline;
    const stage = updatedDeal.stage;

    set({
      pipeline: {
        ...pipeline,
        [stage]: pipeline[stage].map((d) =>
          d.id === updatedDeal.id ? updatedDeal : d,
        ),
      },
    });
  },

  // Xóa deal khỏi cột sau khi soft delete thành công
  removeDeal: (dealId, stage) => {
    const pipeline = get().pipeline;
    set({
      pipeline: {
        ...pipeline,
        [stage]: pipeline[stage].filter((d) => d.id !== dealId),
      },
    });
  },

  // Reorder trong cùng cột — dùng arrayMove helper
  reorderDeal: (stage, fromIndex, toIndex) => {
    const pipeline = get().pipeline;
    const items = [...pipeline[stage]];
    // arrayMove: lấy item ra khỏi fromIndex, chèn vào toIndex
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    set({ pipeline: { ...pipeline, [stage]: items } });
  },
}));
