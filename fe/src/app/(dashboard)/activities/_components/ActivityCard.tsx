"use client";

import { useState, type ReactNode } from "react";
import {
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { ActivityItem, ActivityType, TYPE_META } from "./types";

// NOTE_MAX_LEN = 120 theo requirement 13.1
const NOTE_MAX_LEN = 120;

const ICONS: Record<ActivityType, ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Users size={14} />,
  NOTE: <FileText size={14} />,
};

// Tạo initials từ tên user (lấy 2 chữ cái đầu của 2 từ đầu tiên)
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Màu avatar deterministic theo userId (không random mỗi render)
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

interface ActivityCardProps {
  activity: ActivityItem;
  onEdit?: (activity: ActivityItem) => void;
  onDelete?: (activity: ActivityItem) => void;
}

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[activity.type];
  const isLong = activity.note.length > NOTE_MAX_LEN;
  const displayNote = expanded
    ? activity.note
    : `${activity.note.slice(0, NOTE_MAX_LEN)}${isLong ? "..." : ""}`;

  const initials = getInitials(activity.user.name);
  const avatarColor = getAvatarColor(activity.user.id);

  // Format date cho display
  const formattedDate = new Date(activity.date).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="bg-white rounded-xl border p-3 hover:shadow-sm transition-shadow"
      style={{ borderColor: "#E8E7E2", borderWidth: "0.5px" }}
    >
      <div className="flex gap-3">
        {/* Type icon */}
        <div
          className="size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: meta.iconBg, color: meta.iconColor }}
        >
          {ICONS[activity.type]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row: badge + date + menu */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5"
              style={{
                fontSize: 11,
                fontWeight: 500,
                background: meta.badgeBg,
                color: meta.badgeText,
              }}
            >
              {meta.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                {formattedDate}
              </span>

              {/* Edit/Delete dropdown — chỉ hiển thị khi có callback */}
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 bg-transparent border-0 cursor-pointer"
                      aria-label="Tùy chọn hoạt động"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(activity)}
                        className="gap-2 cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span style={{ fontSize: 12 }}>Chỉnh sửa</span>
                      </DropdownMenuItem>
                    )}
                    {onEdit && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(activity)}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 size={13} />
                        <span style={{ fontSize: 12 }}>Xóa</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Fallback button khi không có callback (view-only) */}
              {!onEdit && !onDelete && (
                <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5 bg-transparent border-0 cursor-pointer">
                  <MoreHorizontal size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          {activity.title && (
            <p
              className="text-foreground mb-1"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {activity.title}
            </p>
          )}

          {/* Contact + company */}
          {activity.contact && (
            <p className="mb-1" style={{ fontSize: 12 }}>
              <a
                href="#"
                className={cn("text-primary hover:underline")}
                style={{ fontWeight: 500, textDecoration: "none" }}
              >
                {activity.contact.name}
              </a>
              {activity.contact.company && (
                <span className="text-muted-foreground">
                  {" "}
                  · {activity.contact.company}
                </span>
              )}
            </p>
          )}

          {/* Deal badge */}
          {activity.deal && (
            <div className="mb-2">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 border border-border text-muted-foreground"
                style={{ fontSize: 11, background: "#F8F8F7" }}
              >
                Deal: {activity.deal.title}
              </span>
            </div>
          )}

          {/* Note với expand/collapse — threshold 120 chars (req 13.1) */}
          <p
            className="text-muted-foreground mb-2"
            style={{ fontSize: 12, lineHeight: 1.55 }}
          >
            {displayNote}
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary ml-1 bg-transparent border-0 cursor-pointer p-0"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {expanded ? "Thu gọn" : "Xem thêm →"}
              </button>
            )}
          </p>

          {/* AI badge — hiển thị khi activity có dealId (req 13.4) */}
          {activity.dealId && (
            <div
              className="rounded-lg px-3 py-2 mb-2 flex items-start justify-between gap-2"
              style={{ background: "#EEEDFE" }}
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <Sparkles
                  size={12}
                  style={{ color: "#534AB7", marginTop: 2 }}
                  className="shrink-0"
                />
                <p style={{ fontSize: 11, color: "#534AB7", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 500 }}>AI Suggestions</span>
                  {" · "}
                  Có gợi ý AI cho deal này
                </p>
              </div>
              <button
                className="shrink-0 text-primary bg-transparent border-0 cursor-pointer whitespace-nowrap"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                Xem →
              </button>
            </div>
          )}

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <Avatar className="size-5 shrink-0">
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
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>
              {activity.user.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
