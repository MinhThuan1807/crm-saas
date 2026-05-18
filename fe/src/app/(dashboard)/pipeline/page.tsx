"use client";

import { Plus, Filter, LayoutGrid, List, ChevronDown } from "lucide-react";
import { useState } from "react";
import { KanbanBoard } from "@/app/(dashboard)/pipeline/_components/KanbanBoard";
import { CreateDealSheet } from "@/app/(dashboard)/pipeline/_components/CreateDealSheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Pipeline() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col flex-1 min-w-0 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-3">
        {/* Left: title + period selector */}
        <div className="flex items-center gap-3">
          <h1
            className="text-foreground tracking-tight"
            style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}
          >
            Pipeline
          </h1>
          <button
            className="flex items-center gap-1 h-6 px-2.5 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            style={{ fontSize: 12 }}
          >
            Q1 2026
            <ChevronDown size={11} />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              title="Kanban"
              className="px-2.5 py-1.5 bg-secondary text-primary flex items-center border-0 cursor-pointer"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              title="Danh sách"
              className="px-2.5 py-1.5 bg-background text-muted-foreground flex items-center border-0 border-l border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <List size={13} />
            </button>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
          >
            <Filter size={13} />
            Lọc theo
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-border text-muted-foreground hover:text-foreground text-xs"
          >
            Tất cả nhân viên
            <ChevronDown size={12} />
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={13} />
            Thêm deal
          </Button>
        </div>
      </header>

      {/* Kanban area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-5 bg-[#F8F8F7]">
        <div className="min-w-230 h-full">
          <KanbanBoard />
        </div>
      </main>

      <CreateDealSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
