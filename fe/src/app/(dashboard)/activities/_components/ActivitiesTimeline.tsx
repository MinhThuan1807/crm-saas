"use client";

import { ChevronRight } from "lucide-react";

import { ActivityGroup, ActivityItem } from "./types";
import { ActivityCard } from "./ActivityCard";
import { DateDivider } from "./DateDivider";
import { EmptyState } from "./EmptyState";

export function ActivitiesTimeline({
  groups,
  showEmpty,
  onEdit,
  onDelete,
}: {
  groups: ActivityGroup[];
  showEmpty: boolean;
  onEdit?: (activity: ActivityItem) => void;
  onDelete?: (activity: ActivityItem) => void;
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
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
