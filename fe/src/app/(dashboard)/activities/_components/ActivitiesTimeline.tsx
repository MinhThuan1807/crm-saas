"use client";

import { ChevronRight } from "lucide-react";

import { ActivityGroup } from "./types";
import { ActivityCard } from "./ActivityCard";
import { DateDivider } from "./DateDivider";
import { EmptyState } from "./EmptyState";

export function ActivitiesTimeline({
  groups,
  showEmpty,
}: {
  groups: ActivityGroup[];
  showEmpty: boolean;
}) {
  return showEmpty || groups.length === 0 ? (
    <div
      className="bg-white rounded-xl border"
      style={{ borderColor: "#E8E7E2", borderWidth: "0.5px" }}
    >
      <EmptyState />
    </div>
  ) : (
    <>
      {groups.map((group) => (
        <div key={group.date}>
          <DateDivider label={group.dateLabel} />
          <div className="space-y-3">
            {group.items.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-center mt-6">
        <button
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          Tải thêm hoạt động
          <ChevronRight size={13} />
        </button>
      </div>
    </>
  );
}
