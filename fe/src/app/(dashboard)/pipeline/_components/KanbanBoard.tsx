"use client";
import { useState, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  TouchSensor,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { STAGES, Stage } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { DealCard } from "./DealCard";
import { Button } from "@/components/ui/button";
import { useDealPipelineStore } from "@/stores/dealCards-store";
import { useGetPipeline, useUpdateDealStage } from "@/hooks/useDeals";
import type { Deal } from "./types";

// ── Empty-pipeline illustration ─────────────────────────────────────────────
function EmptyPipelineIllustration() {
  return (
    <svg
      width="148"
      height="96"
      viewBox="0 0 148 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="20"
        width="30"
        height="68"
        rx="6"
        fill="#EEEDFE"
        stroke="#C7C3F4"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <rect
        x="42"
        y="20"
        width="30"
        height="68"
        rx="6"
        fill="#F0F9EC"
        stroke="#A8D490"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <rect
        x="80"
        y="20"
        width="30"
        height="68"
        rx="6"
        fill="#FEF6E8"
        stroke="#F5C842"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <rect
        x="118"
        y="20"
        width="26"
        height="68"
        rx="6"
        fill="#ECF7E8"
        stroke="#8BC47A"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <circle cx="13" cy="30" r="3" fill="#C7C3F4" />
      <circle cx="51" cy="30" r="3" fill="#A8D490" />
      <circle cx="89" cy="30" r="3" fill="#F5C842" />
      <circle cx="127" cy="30" r="3" fill="#8BC47A" />
      <rect
        x="20"
        y="27.5"
        width="10"
        height="5"
        rx="2.5"
        fill="#C7C3F4"
        opacity="0.6"
      />
      <rect
        x="58"
        y="27.5"
        width="10"
        height="5"
        rx="2.5"
        fill="#A8D490"
        opacity="0.6"
      />
      <rect
        x="96"
        y="27.5"
        width="10"
        height="5"
        rx="2.5"
        fill="#F5C842"
        opacity="0.6"
      />
      <rect
        x="133"
        y="27.5"
        width="7"
        height="5"
        rx="2.5"
        fill="#8BC47A"
        opacity="0.6"
      />
      <circle cx="74" cy="56" r="16" fill="#534AB7" opacity="0.10" />
      <circle cx="74" cy="56" r="11" fill="#534AB7" opacity="0.18" />
      <path
        d="M74 49v14M67 56h14"
        stroke="#534AB7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="36" cy="14" r="3" fill="#534AB7" opacity="0.20" />
      <circle cx="112" cy="10" r="2" fill="#3B6D11" opacity="0.25" />
      <circle cx="140" cy="56" r="2.5" fill="#854F0B" opacity="0.20" />
    </svg>
  );
}

// ── Main board ──────────────────────────────────────────────────────────────
export function KanbanBoard() {
  const { pipeline, moveDeal, setPipeline } = useDealPipelineStore();
  const { isLoading, isError, error } = useGetPipeline();
  const updateDealStage = useUpdateDealStage();

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  // Track stage gốc lúc bắt đầu kéo — active.data.current không tự update
  const dragOriginStage = useRef<Stage | null>(null);
  const lastOverStage = useRef<Stage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10,
        delay: 150,
        tolerance: 5,
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <p style={{ fontSize: 13 }}>Đang tải pipeline...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-center max-w-xs">
          <p
            className="text-destructive"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            Không thể tải pipeline
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {(error as Error)?.message ?? "Lỗi không xác định"}
          </p>
        </div>
      </div>
    );
  }

  const allEmpty = STAGES.every((s) => pipeline[s].length === 0);

  // ── tìm stage chứa dealId ───────────────────────────────────────
  function findStage(dealId: string): Stage | undefined {
    const currentPipeline = useDealPipelineStore.getState().pipeline;
    return STAGES.find((s) => currentPipeline[s].some((d) => d.id === dealId));
  }

  // ── onDragStart: lưu deal đang kéo + stage gốc ─────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const dealId = event.active.id as string;
    const deal = STAGES.flatMap((s) => pipeline[s]).find(
      (d) => d.id === dealId,
    );
    setActiveDeal(deal ?? null);
    dragOriginStage.current = findStage(dealId) ?? null;
    lastOverStage.current = dragOriginStage.current;
  }

  // ── onDragOver: live preview khi kéo sang column khác ───────────────────
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    const fromStage = lastOverStage.current;
    if (!fromStage) return;

    const isOverStage = (STAGES as readonly string[]).includes(overId);
    const toStage: Stage | undefined = isOverStage
      ? (overId as Stage)
      : findStage(overId);

    if (!toStage || fromStage === toStage) return;

    // Preview cross-column move trong store (chưa gọi API)
    moveDeal(dealId, fromStage, toStage);
    lastOverStage.current = toStage;
  }

  // ── onDragEnd: commit thay đổi ───────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    // Lấy stage gốc từ ref (không bị ảnh hưởng bởi handleDragOver)
    const originStage = dragOriginStage.current;
    dragOriginStage.current = null;

    if (!over || !originStage) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Stage hiện tại trong store (sau khi handleDragOver đã preview)
    const currentStage = findStage(dealId);
    if (!currentStage) return;
    const isOverStage = (STAGES as readonly string[]).includes(overId);

    if (isOverStage) {
      // Thả vào column header/empty area
      const toStage = overId as Stage;
      if (originStage !== toStage) {
        updateDealStage.mutate({
          id: dealId,
          from: originStage,
          to: toStage,
          data: { stage: toStage },
        });
      }
      return;
    }

    // Thả vào vị trí của card khác
    const overStage = findStage(overId);
    if (!overStage) return;

    if (originStage === overStage) {
      // ── Same-column reorder ──────────────────────────────────────────
      const items = pipeline[currentStage];
      const oldIndex = items.findIndex((d) => d.id === dealId);
      const newIndex = items.findIndex((d) => d.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setPipeline({ ...pipeline, [currentStage]: reordered });
        // Backend không lưu thứ tự → không gọi API
      }
    } else {
      // ── Cross-column: handleDragOver đã move, chỉ gọi API ───────────
      updateDealStage.mutate({
        id: dealId,
        from: originStage,
        to: overStage,
        data: { stage: overStage },
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        {allEmpty ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="mb-6">
                <EmptyPipelineIllustration />
              </div>
              <p
                className="text-foreground mb-2"
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                Pipeline của bạn đang trống
              </p>
              <p
                className="text-muted-foreground mb-6 leading-relaxed"
                style={{ fontSize: 13 }}
              >
                Tạo deal đầu tiên để bắt đầu theo dõi cơ hội bán hàng
              </p>
              <Button size="sm" className="h-8 gap-1.5 text-xs px-4">
                <Plus size={13} />
                Tạo deal đầu tiên
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full items-start">
            {STAGES.map((stage) => (
              <KanbanColumn key={stage} stage={stage} deals={pipeline[stage]} />
            ))}
          </div>
        )}
      </div>

      {/* DragOverlay: render clone của card đang kéo */}
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
