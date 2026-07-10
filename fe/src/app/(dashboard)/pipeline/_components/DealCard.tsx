"use client";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Deal } from "./types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatValue(value: number): string {
  if (value === 0) return "—";
  const millions = value / 1_000_000;
  if (millions >= 1000)
    return `${(millions / 1000).toFixed(1).replace(".0", "")} tỷ`;
  return `${millions % 1 === 0 ? millions : millions.toFixed(1)}tr`;
}

export function DealCard({ deal, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    // data passed into active.data.current in onDragEnd
    data: { stage: deal.stage },
  });

  const [hovered, setHovered] = useState(false);
  const isWon = deal.stage === "CLOSED_WON";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "bg-background rounded-lg p-3 cursor-grab select-none transition-shadow duration-150 relative touch-none",
        isWon ? "border-[1.5px] border-[#3B6D11]" : "border border-border/70",
        !isDragging && hovered
          ? "shadow-[0_2px_10px_rgba(0,0,0,0.07)]"
          : "shadow-none",
      )}
    >
      {isWon && (
        <div className="absolute top-2 right-2 size-4 rounded-full bg-[#3B6D11] flex items-center justify-center">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path
              d="M1 3.5L3.5 6L8 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/pipeline/${deal.id}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "block mb-0.5 transition-colors flex-1 min-w-0",
            hovered ? "text-primary" : "text-foreground",
          )}
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
            paddingRight: isWon ? 20 : 0,
            textDecoration: "none",
          }}
        >
          {deal.title}
        </Link>
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={cn(
            "shrink-0 transition-opacity",
            hovered ? "opacity-100" : "opacity-0",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 border-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                style={{ fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(); 
                }}
              >
                <Pencil size={12} className="mr-2" />
                Chỉnh sửa deal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                style={{ fontSize: 13 }}
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={12} className="mr-2" />
                Xóa deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p
        className="text-muted-foreground"
        style={{ fontSize: 12, marginBottom: 10 }}
      >
        {deal.contact.name}
      </p>

      <div className="flex items-center justify-between">
        <span
          className="text-foreground"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {formatValue(Number(deal.value))}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/pipeline/${deal.id}`}
            onClick={(e) => e.stopPropagation()}
            title="Mở deal"
            className={cn(
              "flex items-center justify-center size-[18px] rounded-[5px] text-muted-foreground transition-opacity",
              hovered ? "opacity-100" : "opacity-0",
            )}
            style={{ textDecoration: "none" }}
          >
            <ExternalLink size={11} />
          </Link>

          <Avatar className="size-5">
            <AvatarFallback
              className="border-0 bg-primary/10 text-primary"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.02em" }}
            >
              {getInitials(deal.owner.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
