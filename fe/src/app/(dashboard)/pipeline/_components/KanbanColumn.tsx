"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Deal, Stage, STAGE_CONFIG } from "./types";
import { DealCard } from "./DealCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  stage: Stage;
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

function formatTotal(total: number): string {
  if (total === 0) return "—";
  const millions = total / 1_000_000;
  if (millions >= 1000) return `${(millions / 1000).toFixed(1).replace(".0", "")} tỷ`;
  return `${millions % 1 === 0 ? millions : millions.toFixed(1)}tr`;
}

export function KanbanColumn({ stage, deals, onEdit, onDelete }: Props) {
  const config = STAGE_CONFIG[stage];

  // Column là droppable target — id = stage string
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const isEmpty = deals.length === 0;

  // SortableContext cần danh sách id theo thứ tự hiện tại
  const dealIds = deals.map((d) => d.id);

  return (
    <div className="flex flex-col flex-1 min-w-[220px] group/col h-full overflow-hidden">
      {/* ── Column header ─────────────────────────────────────────────── */}
      <div className="pb-3 pl-0.5">
        <div className="flex items-center gap-2">
          <div
            className="size-2 rounded-full shrink-0"
            style={{ background: config.dot }}
          />
          <span
            className="text-foreground"
            style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}
          >
            {config.label}
          </span>
          <span
            className="rounded-full px-1.5 tabular-nums"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: config.badgeColor,
              background: config.badgeBg,
            }}
          >
            {deals.length}
          </span>
        </div>
        <p
          className="pl-4 mt-0.5 text-muted-foreground tabular-nums"
          style={{ fontSize: 12 }}
        >
          {isEmpty
            ? "Chưa có deal"
            : `${deals.length} deal${deals.length > 1 ? "s" : ""} · ${formatTotal(totalValue)}`}
        </p>
      </div>

      {/* ── Droppable + Sortable zone ──────────────────────────────────── */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[300px] rounded-[10px] p-2 flex flex-col gap-2 overflow-y-auto transition-all duration-150",
          isOver
            ? "bg-primary/5 border-[1.5px] border-dashed border-primary"
            : "bg-[#F8F8F7] border-[1.5px] border-border/70",
        )}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {isEmpty ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 flex-grow",
                "min-h-[80px] rounded-lg border-[1.5px] border-dashed transition-all duration-150",
                isOver
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/50 bg-transparent",
              )}
            >
              <p
                className="text-muted-foreground/60 select-none"
                style={{ fontSize: 12 }}
              >
                Kéo deal vào đây
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/8 px-3"
                style={{ fontSize: 12 }}
              >
                <Plus size={12} />
                Thêm deal
              </Button>
            </div>
          ) : (
            deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onEdit={() => onEdit(deal)}
                onDelete={() => onDelete(deal)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
