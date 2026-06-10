"use client";

import { useMemo } from "react";
import { FileText, Mail, Phone, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import type { ActivityItem, ActivityType } from "./types";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface SummaryPanelProps {
  /** Toàn bộ unfiltered activities — không thay đổi khi type filter thay đổi */
  activities: ActivityItem[];
  isLoading: boolean;
}

// ─────────────────────────────────────────
// Static config cho type rows
// ─────────────────────────────────────────

const TYPE_ROWS: {
  type: ActivityType;
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    type: "CALL",
    label: "Cuộc gọi",
    icon: <Phone size={13} />,
    color: "#16A05B",
    bg: "#E1F5EE",
  },
  {
    type: "EMAIL",
    label: "Email",
    icon: <Mail size={13} />,
    color: "#534AB7",
    bg: "#EEEDFE",
  },
  {
    type: "MEETING",
    label: "Gặp mặt",
    icon: <Users size={13} />,
    color: "#B45309",
    bg: "#FAEEDA",
  },
  {
    type: "NOTE",
    label: "Ghi chú",
    icon: <FileText size={13} />,
    color: "#6B6B67",
    bg: "#F1EFE8",
  },
];

// Màu avatar deterministic theo userId
const AVATAR_COLORS = [
  "#D4E8F5",
  "#E8D4F5",
  "#D4F5E8",
  "#F5E8D4",
  "#F5D4D4",
  "#D4D4F5",
];
function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─────────────────────────────────────────
// Skeleton rows
// ─────────────────────────────────────────

function TypeSkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="size-6 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-1 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
        </div>
      ))}
    </>
  );
}

function UserSkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="size-5 rounded-full shrink-0" />
          <Skeleton className="size-6 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-1 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export function SummaryPanel({ activities, isLoading }: SummaryPanelProps) {
  // ── Count theo type — useMemo để tránh tính lại mỗi render (req 10.1) ──
  const counts = useMemo(() => {
    return activities.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [activities]);

  const total = activities.length;

  // ── Top 3 users — sort by count desc, tiebreaker name asc (req 10.2, 10.3) ──
  const topUsers = useMemo(() => {
    const userMap: Record<string, { id: string; name: string; count: number }> =
      {};
    for (const a of activities) {
      if (!userMap[a.user.id]) {
        userMap[a.user.id] = { id: a.user.id, name: a.user.name, count: 0 };
      }
      userMap[a.user.id].count++;
    }
    return Object.values(userMap)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"))
      .slice(0, 3);
  }, [activities]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* ── Tổng quan theo type ── */}
      <div
        className="bg-white rounded-xl border p-4"
        style={{ borderColor: "#E8E7E2", borderWidth: "0.5px" }}
      >
        <p
          className="text-foreground mb-3"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          Tổng hoạt động
        </p>

        <div className="space-y-2.5">
          {isLoading ? (
            <TypeSkeletonRows />
          ) : (
            TYPE_ROWS.map((row) => (
              <div key={row.type} className="flex items-center gap-2.5">
                <div
                  className="size-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: row.bg, color: row.color }}
                >
                  {row.icon}
                </div>
                <span
                  className="flex-1 text-muted-foreground"
                  style={{ fontSize: 12 }}
                >
                  {row.label}
                </span>
                <span
                  className="text-foreground"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {counts[row.type] ?? 0}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Total row */}
        {!isLoading && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span style={{ fontSize: 11, color: "#6B6B67" }}>Tổng</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>
              {total}
            </span>
          </div>
        )}
      </div>

      {/* ── Top nhân viên ── */}
      <div
        className="bg-white rounded-xl border p-4"
        style={{ borderColor: "#E8E7E2", borderWidth: "0.5px" }}
      >
        <p
          className="text-foreground mb-3"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          Top nhân viên
        </p>

        <div className="space-y-2">
          {isLoading ? (
            <UserSkeletonRows />
          ) : topUsers.length === 0 ? (
            // Placeholder khi không có data
            [1, 2, 3].map((rank) => (
              <div key={rank} className="flex items-center gap-2.5">
                <span
                  className="size-5 flex items-center justify-center shrink-0 rounded-full"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: rank === 1 ? "#FAEEDA" : "#F1EFE8",
                    color: rank === 1 ? "#B45309" : "#6B6B67",
                  }}
                >
                  {rank}
                </span>
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: 12 }}
                >
                  Chưa có dữ liệu
                </span>
              </div>
            ))
          ) : (
            topUsers.map((user, idx) => {
              const rank = idx + 1;
              const initials = getInitials(user.name);
              const avatarColor = getAvatarColor(user.id);
              return (
                <div key={user.id} className="flex items-center gap-2.5">
                  <span
                    className="size-5 flex items-center justify-center shrink-0 rounded-full"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: rank === 1 ? "#FAEEDA" : "#F1EFE8",
                      color: rank === 1 ? "#B45309" : "#6B6B67",
                    }}
                  >
                    {rank}
                  </span>
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback
                      style={{
                        background: avatarColor,
                        color: "#1A1A18",
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="flex-1 text-foreground"
                    style={{ fontSize: 12, fontWeight: 500 }}
                  >
                    {user.name}
                  </span>
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    {user.count} hoạt động
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
