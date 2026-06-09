"use client";

import { Calendar, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ActivitiesHeader({
  dateRangeLabel,
  onNewActivity,
}: {
  dateRangeLabel: string;
  onNewActivity?: () => void;
}) {
  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-4">
      <h2
        className="text-foreground"
        style={{ fontSize: 15, fontWeight: 600, margin: 0 }}
      >
        Activities
      </h2>

      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          <Calendar size={12} />
          {dateRangeLabel}
          <ChevronDown size={11} />
        </button>

        <Button
          size="sm"
          className="h-8 gap-1.5"
          style={{ fontSize: 12 }}
          onClick={onNewActivity}
        >
          <Plus size={13} />
          Thêm hoạt động
        </Button>
      </div>
    </header>
  );
}
