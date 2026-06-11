import { useState, useRef } from "react";
import {
  Calendar,
  Phone,
  Mail,
  User,
  Building2,
  Plus,
  ChevronRight,
  Edit2,
  TrendingUp,
  Target,
  Flag,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StageBadge } from "@/components/ui/StageBadge";
import { DealStage } from "./types";
import { cn } from "@/lib/utils";
import { DealDetail } from "./types";
import { Task } from "./types";
import {  formatCurrency, formatDate, getInitials } from "@/lib/helper";

type Priority = "high" | "medium" | "low";
type DueStatus = "overdue" | "today" | "upcoming" | "done";

const PIPELINE_STAGES: { key: DealStage; label: string }[] = [
  { key: "PROSPECT",   label: "Prospect" },
  { key: "QUALIFIED",  label: "Qualified" },
  { key: "PROPOSAL",   label: "Proposal" },
  { key: "CLOSED_WON", label: "Closed Won" },
  { key: "CLOSED_LOST", label: "Closed Lost" },
];

const PRIORITY_DOT: Record<Priority, string> = {
  high:   "#ef4444",
  medium: "#f97316",
  low:    "#9ca3af",
};

type DealLeftPanelProps = {
  deal: DealDetail;
  onEdit: () => void;
};

// ── Component ───────────────────────────────────────────────────────────────
export function DealLeftPanel({ deal, onEdit }: DealLeftPanelProps) {
  const [tasks, setTasks]         = useState<Task[]>(deal?.tasks);
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const commitAdd = () => {
    // const title = newTitle.trim();
    // if (title) {
    //   setTasks((prev) => [
    //     ...prev,
    //     {
    //       id: `t${Date.now()}`,
    //       title,
    //       due: "—",
    //       done: false,
    //       priority: "medium",
    //       dueStatus: "upcoming",
    //     },
    //   ]);
    // }
    // setNewTitle("");
    // setAddingTask(false);
  };

  const currentStageIdx = PIPELINE_STAGES.findIndex(
    (s) => s.key === deal?.stage as DealStage
  );
  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount    = tasks.filter((t) =>  t.done).length;

  return (
    <div className="w-[40%] min-w-[320px] shrink-0 flex flex-col border-r border-border bg-background overflow-y-auto">

      {/* ── Deal header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-5 border-b border-border">

        {/* Stage badge + edit */}
        <div className="flex items-center justify-between mb-3">
          <StageBadge stage={deal.stage} />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-muted-foreground hover:text-foreground -mr-1"
            style={{ fontSize: 12 }}
            onClick={onEdit}
          >
            <Edit2 size={11} />
            Chỉnh sửa
          </Button>
        </div>

        {/* Title */}
        <h2
          className="text-foreground mb-4"
          style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}
        >
          {deal.title}
        </h2>

        {/* 2 × 2 metric grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Value */}
          <div className="bg-[#F8F8F7] rounded-[10px] border border-border px-3 py-2.5">
            <p className="flex items-center gap-1 text-muted-foreground mb-1" style={{ fontSize: 11 }}>
              <TrendingUp size={10} strokeWidth={1.8} />
              Giá trị deal
            </p>
            <p className="text-foreground" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {formatCurrency(deal.value)}
            </p>
          </div>

          {/* Close date */}
          <div className="bg-[#F8F8F7] rounded-[10px] border border-border px-3 py-2.5">
            <p className="flex items-center gap-1 text-muted-foreground mb-1" style={{ fontSize: 11 }}>
              <Calendar size={10} strokeWidth={1.8} />
              Ngày chốt dự kiến
            </p>
            <p className="text-foreground" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
              {formatDate(deal.closeDate)}
            </p>
          </div>

          {/* Probability */}
          {/* <div className="bg-[#F8F8F7] rounded-[10px] border border-border px-3 py-2.5">
            <p className="flex items-center gap-1 text-muted-foreground mb-1.5" style={{ fontSize: 11 }}>
              <Target size={10} strokeWidth={1.8} />
              Xác suất chốt
            </p>
            <div className="flex items-center gap-2">
              <p className="text-foreground shrink-0" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
                {deal.probability}%
              </p>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${deal.probability}%`,
                    background: deal.probability >= 70 ? "#534AB7" : deal.probability >= 40 ? "#f97316" : "#ef4444",
                  }}
                />
              </div>
            </div>
          </div> */}

          {/* Owner */}
          <div className="bg-[#F8F8F7] rounded-[10px] border border-border px-3 py-2.5">
            <p className="flex items-center gap-1 text-muted-foreground mb-1.5" style={{ fontSize: 11 }}>
              <User size={10} strokeWidth={1.8} />
              Phụ trách
            </p>
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5 shrink-0">
                <AvatarFallback
                  className="border-0"
                  // style={{
                  //   background: deal.owner.bg,
                  //   color: deal.owner.color,
                  //   fontSize: 9,
                  //   fontWeight: 600,
                  // }}
                >
                  {getInitials(deal.owner.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-foreground truncate" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1 }}>
                  {deal.owner.name}
                </p>
                <p className="text-muted-foreground truncate" style={{ fontSize: 10, marginTop: 2 }}>
                  {deal.owner.name}
                  {/* {deal.owner.role} */}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline stage progress */}
        <div>
          <div className="flex gap-1 mb-1.5">
            {PIPELINE_STAGES.map((s, i) => {
              const isPast   = i < currentStageIdx;
              const isActive = i === currentStageIdx;
              return (
                <div
                  key={s.key}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background: isPast
                      ? "#534AB7"
                      : isActive
                      ? "#9B94E3"
                      : "#E8E7E2",
                  }}
                />
              );
            })}
          </div>
          <div className="flex">
            {PIPELINE_STAGES.map((s, i) => {
              const isActive = i === currentStageIdx;
              const isPast   = i < currentStageIdx;
              return (
                <div key={s.key} className="flex-1 text-center">
                  <span
                    className={cn(
                      isPast || isActive ? "text-primary" : "text-muted-foreground/60"
                    )}
                    style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contact card ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-muted-foreground uppercase"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
          >
            Liên hệ chính
          </p>
          <Link
            href={`/contacts/${deal.contact.id}`}
            className="flex items-center gap-0.5 text-primary hover:underline"
            style={{ fontSize: 11 }}
          >
            Xem hồ sơ
            <ChevronRight size={11} />
          </Link>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback
              className="border-0"
              style={{
                background: "#D4E8F5",
                color: "#1A5C7A",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {getInitials(deal.contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-foreground" style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              {deal.contact.name}
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
              <Building2 size={11} strokeWidth={1.7} />
              {deal.contact.name} · {deal.contact.company}
            </div>
          </div>
        </div>

        {/* Email + phone */}
        <div className="space-y-1.5">
          <a
            href={`mailto:${deal.contact.email}`}
            className="flex items-center gap-2.5 group"
            style={{ textDecoration: "none" }}
          >
            <div className="size-[26px] rounded-[7px] bg-secondary/60 flex items-center justify-center shrink-0">
              <Mail size={11} className="text-primary" />
            </div>
            <span
              className="text-muted-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: 12 }}
            >
              {deal.contact.email}
            </span>
          </a>
          <a
            href={`tel:${deal.contact.phone}`}
            className="flex items-center gap-2.5 group"
            style={{ textDecoration: "none" }}
          >
            <div className="size-[26px] rounded-[7px] bg-secondary/60 flex items-center justify-center shrink-0">
              <Phone size={11} className="text-primary" />
            </div>
            <span
              className="text-muted-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: 12 }}
            >
              {deal.contact.phone}
            </span>
          </a>
        </div>
      </div>

      {/* ── Task list ────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex-1">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p
              className="text-muted-foreground uppercase"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
            >
              Tasks
            </p>
            {pendingCount > 0 && (
              <span
                className="inline-flex items-center justify-center size-[18px] rounded-full bg-primary text-white"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddingTask(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="h-6 gap-1 px-2 text-primary hover:text-primary hover:bg-secondary/60 -mr-1"
            style={{ fontSize: 12 }}
          >
            <Plus size={11} />
            Thêm task
          </Button>
        </div>

        {/* Task rows */}
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggle(task.id)}
              className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none",
                task.done
                  ? "border-green-100 bg-green-50/60"
                  : "border-border bg-background hover:bg-muted/20"
              )}
            >
              <Checkbox
                checked={task.done}
                onCheckedChange={() => toggle(task.id)}
                className="mt-0.5 shrink-0 outline-1 border-2 border-border cursor-pointer hover:border-primary "
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "leading-snug",
                    task.done ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar size={9} strokeWidth={1.7} className="text-muted-foreground shrink-0" />
                  <span
                    // className={cn(
                    //   task.done
                    //     ? "text-muted-foreground"
                    //     : task.dueStatus === "overdue"
                    //     ? "text-red-500"
                    //     : task.dueStatus === "today"
                    //     ? "text-orange-500"
                    //     : "text-muted-foreground"
                    // )}
                    style={{ fontSize: 11 }}
                  >
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Không hạn chót"}
                    {/* {!task.done && task.dueStatus === "overdue" && " · Quá hạn"} */}
                    {/* {!task.done && task.dueStatus === "today"   && " · Hôm nay"} */}
                    {/* {!task.done && task.dueStatus === "today"   && " · Hôm nay"} */}
                  </span>
                </div>
              </div>
              {/* Priority dot */}
              <div
                className="size-1.5 rounded-full shrink-0 mt-1.5"
                // style={{ background: task.done ? "#d1d5db" : PRIORITY_DOT[task.priority] }}
              />
            </div>
          ))}

          {/* Inline new task input */}
          {addingTask && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-primary/40 bg-secondary/20">
              <Checkbox disabled className="shrink-0 mt-0.5 opacity-50" />
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  commitAdd();
                  if (e.key === "Escape") { setAddingTask(false); setNewTitle(""); }
                }}
                onBlur={commitAdd}
                placeholder="Tên task mới... (Enter để thêm)"
                className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50"
                style={{ fontSize: 13 }}
              />
            </div>
          )}
        </div>

        {/* Completion summary */}
        {doneCount > 0 && (
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/50">
            <CheckCircle2 size={12} className="text-green-600 shrink-0" />
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              {doneCount}/{tasks.length} tasks hoàn thành
            </p>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden ml-1">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${(doneCount / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
