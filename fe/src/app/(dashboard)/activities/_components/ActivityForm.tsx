"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ActivityFormSchema,
  ActivityFormValues,
  ActivityType,
} from "@/lib/validations/activities.scheme";
import {
  useCreateContactActivity,
  useCreateDealActivity,
  useUpdateActivity,
} from "@/hooks/useActivities";

import type { ActivityItem } from "./types";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type ActivityFormContext =
  | { type: "contact"; contactId: string }
  | { type: "deal"; dealId: string }
  | { type: "global" };

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Khi có activity → edit mode; không có → create mode */
  activity?: ActivityItem;
  /** Context để xác định endpoint khi tạo mới */
  context: ActivityFormContext;
}

// ─────────────────────────────────────────
// Type meta cho Select options
// ─────────────────────────────────────────
const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: ActivityType.CALL, label: "Cuộc gọi" },
  { value: ActivityType.EMAIL, label: "Email" },
  { value: ActivityType.MEETING, label: "Gặp mặt" },
  { value: ActivityType.NOTE, label: "Ghi chú" },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Chuyển Date object sang value của <input type="datetime-local"> */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export function ActivityForm({
  open,
  onOpenChange,
  activity,
  context,
}: ActivityFormProps) {
  const isEditMode = !!activity;

  // ── Mutations — instantiate tất cả, dùng theo context ──────────────────
  // Cần gọi hooks vô điều kiện (rules of hooks)
  const contactId = context.type === "contact" ? context.contactId : "";
  const dealId = context.type === "deal" ? context.dealId : "";

  const createForContact = useCreateContactActivity(contactId);
  const createForDeal = useCreateDealActivity(dealId);
  const updateActivity = useUpdateActivity();

  // isPending của mutation đang hoạt động
  const isPending =
    createForContact.isPending ||
    createForDeal.isPending ||
    updateActivity.isPending;

  // ── Form setup ──────────────────────────────────────────────────────────
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivityFormSchema),
    defaultValues: {
      type: ActivityType.CALL,
      title: "",
      note: "",
      date: new Date(),
    },
  });

  // ── Pre-populate khi edit mode hoặc khi dialog mở lại ──────────────────
  useEffect(() => {
    if (open) {
      if (activity) {
        // Edit mode — pre-fill từ activity
        form.reset({
          type: activity.type,
          title: activity.title ?? "",
          note: activity.note,
          date: new Date(activity.date),
        });
      } else {
        // Create mode — reset về default
        form.reset({
          type: ActivityType.CALL,
          title: "",
          note: "",
          date: new Date(),
        });
      }
    }
  }, [open, activity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit handler ──────────────────────────────────────────────────────
  async function onSubmit(values: ActivityFormValues) {
    const payload = {
      type: values.type,
      title: values.title || null,
      note: values.note,
      date: values.date,
    };

    try {
      if (isEditMode && activity) {
        // Edit mode — PATCH /activities/:id
        await updateActivity.mutateAsync({ id: activity.id, body: payload });
      } else {
        // Create mode — chọn endpoint theo context
        if (context.type === "contact") {
          await createForContact.mutateAsync(payload);
        } else if (context.type === "deal") {
          await createForDeal.mutateAsync(payload);
        } else {
          // global context — không có endpoint cụ thể trong spec;
          // tạm thời không làm gì (cần contactId hoặc dealId)
          // Trong tương lai có thể hiện thêm UI để chọn contact/deal
          console.warn(
            "Global context chưa được hỗ trợ tạo activity trực tiếp",
          );
          return;
        }
      }
      // Thành công → đóng form 
      onOpenChange(false);
    } catch {
      // Thất bại → giữ nguyên form, toast đã được xử lý trong hook 
      // Không gọi onOpenChange(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 15 }}>
            {isEditMode ? "Chỉnh sửa hoạt động" : "Thêm hoạt động mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* Type — required select */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Loại hoạt động <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Chọn loại hoạt động" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            {/* Title — optional text */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập tiêu đề (tuỳ chọn)"
                      className="h-9"
                      style={{ fontSize: 13 }}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            {/* Note — required textarea (req 12.2) */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Nội dung <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập nội dung hoạt động..."
                      className="min-h-[96px] resize-none"
                      style={{ fontSize: 13 }}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  {/* FormMessage tự hiển thị "Nội dung không được để trống" từ Zod */}
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            {/* Date — optional datetime picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>Thời gian</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="h-9"
                      style={{ fontSize: 13 }}
                      disabled={isPending}
                      value={
                        field.value
                          ? toDatetimeLocalValue(
                              field.value instanceof Date
                                ? field.value
                                : new Date(field.value),
                            )
                          : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                style={{ fontSize: 12 }}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                style={{ fontSize: 12 }}
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {isEditMode ? "Lưu thay đổi" : "Thêm hoạt động"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
