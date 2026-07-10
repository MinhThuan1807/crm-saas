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
  // Reorder in same column (sort)
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

  // Optimistic update: move deal immediately on UI
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

  // Rollback: undo moveDeal when API fails
  rollbackMoveDeal: (dealId, from, to) => {
    // from/to is the moved direction — rollback in reverse (to -> from)
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

  // Update deal in its correct column
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

  // Delete deal from column after successful soft delete
  removeDeal: (dealId, stage) => {
    const pipeline = get().pipeline;
    set({
      pipeline: {
        ...pipeline,
        [stage]: pipeline[stage].filter((d) => d.id !== dealId),
      },
    });
  },

  // Reorder in same column — use arrayMove helper
  reorderDeal: (stage, fromIndex, toIndex) => {
    const pipeline = get().pipeline;
    const items = [...pipeline[stage]];
    // arrayMove: take item out of fromIndex, insert into toIndex
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    set({ pipeline: { ...pipeline, [stage]: items } });
  },
}));
