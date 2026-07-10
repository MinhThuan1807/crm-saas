"use client";
import { useState } from "react";
import { Phone, Mail, Users, FileText, Clock } from "lucide-react";
import {
  ActivityType,
  ActivityItem,
  CreateActivityForContactBodyType
} from "@/lib/validations/activities.scheme";
import LogActivityForm from "./LogActivityForm";
import { relativeTime, formatDate } from "@/lib/helper";

export type ActivityTab = ActivityType;

interface ActivityTimelineProps {
  activities: ActivityItem[];
  onSubmitActivity: (data: CreateActivityForContactBodyType, reset: () => void) => void;
  isPendingSubmit?: boolean;
  entityType?: "contact" | "deal";
}

const TYPE_CONFIG: Record<
  ActivityType,
  { iconBg: string; iconColor: string; icon: typeof Phone; label: string }
> = {
  [ActivityType.MEETING]: {
    iconBg: "#FEF3E2",
    iconColor: "#854F0B",
    icon: Users,
    label: "Cuộc họp",
  },
  [ActivityType.EMAIL]: {
    iconBg: "#EEEDFE",
    iconColor: "#534AB7",
    icon: Mail,
    label: "Email",
  },
  [ActivityType.CALL]: {
    iconBg: "#E8F5E0",
    iconColor: "#3B6D11",
    icon: Phone,
    label: "Cuộc gọi",
  },
  [ActivityType.NOTE]: {
    iconBg: "#F1EFE8",
    iconColor: "#9B9B96",
    icon: FileText,
    label: "Ghi chú",
  },
};

export default function ActivityTimeline({
  activities,
  onSubmitActivity,
  isPendingSubmit,
  entityType = "contact",
}: ActivityTimelineProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8F8F7] dark:bg-background">
      {/* ── Log activity form ── */}
      <LogActivityForm
        onSubmit={onSubmitActivity}
        isPending={isPendingSubmit}
        entityType={entityType}
      />

      {/* Timeline label */}
      <p
        className="px-6 pt-5 pb-2 text-muted-foreground uppercase"
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
      >
        Lịch sử hoạt động
      </p>

      {/* Timeline items */}
      <div className="px-6 pb-6 flex flex-col gap-0 relative">
        {activities.map((item, index) => {
          const config = TYPE_CONFIG[item.type];
          const Icon = config.icon;
          const isLast = index === activities.length - 1;
          const isExpanded = expanded[item.id];
          const bodyPreview =
            item.note.length > 100 && !isExpanded
              ? item.note.slice(0, 100) + "…"
              : item.note;
          const isFuture = item.date ? new Date(item.date).getTime() > Date.now() : false;

          return (
            <div key={item.id} className="flex gap-3 relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-border z-0" />
              )}

              {/* Icon */}
              <div
                className="shrink-0 size-8 rounded-full border border-border flex items-center justify-center z-10 mt-0.5"
                style={{ background: config.iconBg }}
              >
                <Icon size={14} color={config.iconColor} strokeWidth={2} />
              </div>

              {/* Content card */}
              <div className="flex-1 bg-background rounded-[10px] border border-border px-3.5 py-3 mb-3">
                {/* Card header */}
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <p
                      className="text-foreground"
                      style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}
                    >
                      {item.title}
                    </p>
                    <div
                      className="flex items-center gap-1 text-muted-foreground"
                      style={{ fontSize: 11 }}
                    >
                      <Clock size={10} />
                      {isFuture ? formatDate(item.date) : relativeTime(item.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.date && (
                      <span
                        className="px-2 py-0.5 rounded-full border"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: isFuture ? "#854F0B" : "#3B6D11",
                          background: isFuture ? "#FEF3E2" : "#E8F5E0",
                          borderColor: isFuture ? "#FED7AA" : "#D9F99D",
                        }}
                      >
                        {relativeTime(item.date)}
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: config.iconColor,
                        background: config.iconBg,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <p
                  className="text-muted-foreground"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.65,
                    marginBottom: item.note.length > 100 ? 4 : 0,
                  }}
                >
                  {bodyPreview}
                </p>
                {item.note.length > 100 && (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="text-primary bg-transparent border-0 cursor-pointer p-0"
                    style={{ fontSize: 11, marginBottom: 0 }}
                  >
                    {isExpanded ? "Rút gọn" : "Xem thêm"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
