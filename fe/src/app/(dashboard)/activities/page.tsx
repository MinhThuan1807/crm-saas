"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useActivitiesInfinite,
  useDeleteActivity,
} from "@/hooks/useActivities";
import type {
  ActivityItem,
  ActivityGroup,
  ActivityType,
} from "./_components/types";

import { ActivitiesFilters } from "./_components/ActivitiesFilters";
import { ActivitiesHeader } from "./_components/ActivitiesHeader";
import { ActivitiesTimeline } from "./_components/ActivitiesTimeline";
import { SummaryPanel } from "./_components/SummaryPanel";
import {
  ActivityForm,
  type ActivityFormContext,
} from "./_components/ActivityForm";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Format ngày thành label tiếng Việt: "Hôm nay", "Hôm qua", hoặc ngày đầy đủ */
function formatDateLabel(date: Date): string {
  if (isToday(date)) {
    return `Hôm nay — ${format(date, "d 'tháng' M, yyyy")}`;
  }
  if (isYesterday(date)) {
    return `Hôm qua — ${format(date, "d 'tháng' M, yyyy")}`;
  }
  return format(date, "d 'tháng' M, yyyy");
}

/** Group flat ActoivityItem[] the calendar day, sort ngày giảm dần */
function groupActivitiesByDate(activities: ActivityItem[]): ActivityGroup[] {
  const groups: Record<string, ActivityGroup> = {};

  for (const activity of activities) {
    const d = new Date(activity.date);
    const dayKey = format(d, "yyyy-MM-dd");

    if (!groups[dayKey]) {
      groups[dayKey] = {
        date: dayKey,
        dateLabel: formatDateLabel(d),
        items: [],
      };
    }
    groups[dayKey].items.push(activity);
  }

  // Sort groups theo ngày giảm dần (API đã trả về items sorted rồi)
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

// ─────────────────────────────────────────
// Skeleton loading cho timeline
// ─────────────────────────────────────────
function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border p-4 space-y-3"
          style={{ borderColor: "#E8E7E2", borderWidth: "0.5px" }}
        >
          <div className="flex gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function Activities() {
  // ── Filter state ─────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<"all" | ActivityType>("all");
  const [showEmpty, setShowEmpty] = useState(false);

  // ── ActivityForm state ────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formActivity, setFormActivity] = useState<ActivityItem | undefined>(
    undefined,
  );
  const [formContext] = useState<ActivityFormContext>({ type: "global" });

  // ── Delete confirmation state ──────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityItem | null>(
    null,
  );

  // ── Data fetching — infinite scroll  ───────────────────────
  const infiniteParams = useMemo(
    () => (activeFilter !== "all" ? { type: activeFilter } : undefined),
    [activeFilter],
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useActivitiesInfinite(infiniteParams);

  const deleteActivity = useDeleteActivity();

  // ── Flatten all pages → ActivityItem[] ───────────────────────────────────
  const allActivities = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  // ── Group theo ngày cho timeline ────────────────────────────────
  const groups = useMemo(
    () => (showEmpty ? [] : groupActivitiesByDate(allActivities)),
    [allActivities, showEmpty],
  );

  // ── isEmpty check  ───────────────────────────────────────────────
  const isEmpty = !isLoading && allActivities.length === 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleOpenCreate() {
    setFormActivity(undefined);
    setFormOpen(true);
  }

  function handleEdit(activity: ActivityItem) {
    setFormActivity(activity);
    setFormOpen(true);
  }

  function handleDelete(activity: ActivityItem) {
    setActivityToDelete(activity);
    setDeleteConfirmOpen(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <ActivitiesHeader
        dateRangeLabel="Tất cả"
        onNewActivity={handleOpenCreate}
      />

      <ActivitiesFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showEmpty={showEmpty}
        onToggleEmpty={() => setShowEmpty((v) => !v)}
      />

      <div className="flex-1 overflow-y-auto">
        <div
          className="flex gap-6 p-6 items-start mx-auto"
          style={{ maxWidth: 1400 }}
        >
          <div className="min-w-0" style={{ flex: "65 1 0%" }}>
            {isLoading ? (
              <TimelineSkeleton />
            ) : (
              <>
                <ActivitiesTimeline
                  groups={groups}
                  showEmpty={isEmpty || showEmpty}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

                {hasNextPage && !showEmpty && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="gap-1.5"
                      style={{ fontSize: 12 }}
                    >
                      {isFetchingNextPage && (
                        <Loader2 size={12} className="animate-spin" />
                      )}
                      Tải thêm hoạt động
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className="min-w-0"
            style={{ flex: "35 1 0%", minWidth: 260, maxWidth: 320 }}
          >
            <div className="sticky top-6">
              <SummaryPanel activities={allActivities} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>

      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={formActivity}
        context={formContext}
      />

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hoạt động</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hoạt động "
              {activityToDelete?.title ||
                (activityToDelete?.note
                  ? activityToDelete.note.slice(0, 40) +
                    (activityToDelete.note.length > 40 ? "..." : "")
                  : "")}
              "? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivity.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteActivity.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (activityToDelete) {
                  deleteActivity.mutate(activityToDelete.id, {
                    onSuccess: () => {
                      setDeleteConfirmOpen(false);
                    },
                  });
                }
              }}
            >
              {deleteActivity.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
