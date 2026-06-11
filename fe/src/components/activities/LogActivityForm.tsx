"use client";
import {
  ActivityType,
  CreateActivityForContactBodySchema,
  CreateActivityForContactBodyType,
} from "@/lib/validations/activities.scheme";
import {
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  ChevronDown,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { relativeTime } from "@/lib/helper";

export type ActivityTab = ActivityType;

const TABS: { key: ActivityTab; label: string; icon: typeof Phone }[] = [
  { key: ActivityType.CALL, label: "Cuộc gọi", icon: Phone },
  { key: ActivityType.EMAIL, label: "Email", icon: Mail },
  { key: ActivityType.MEETING, label: "Gặp mặt", icon: Users },
  { key: ActivityType.NOTE, label: "Ghi chú", icon: FileText },
];

interface LogActivityFormProps {
  onSubmit: (data: CreateActivityForContactBodyType, reset: () => void) => void;
  isPending?: boolean;
  entityType?: "contact" | "deal";
}

function LogActivityForm({ onSubmit, isPending, entityType = "contact" }: LogActivityFormProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>(
    ActivityType.CALL,
  );

  const form = useForm({
    resolver: zodResolver(CreateActivityForContactBodySchema),
    defaultValues: {
      title: "",
      note: "",
      date: new Date(),
      type: ActivityType.CALL as ActivityType,
    },
  });

  const note = useWatch({ control: form.control, name: "note" });

  const handleTabChange = (tab: ActivityTab) => {
    setActiveTab(tab);
    form.reset({
      title: "",
      note: "",
      date: new Date(),
      type: tab,
    });
  };

  const handleSubmit = (data: any) => {
    const reset = () =>
      form.reset({ title: "", note: "", date: new Date(), type: activeTab });
    
    const payload = {
      ...data,
      title: data.title?.trim() ? data.title.trim() : null,
    };
    onSubmit(payload, reset);
  };

  const PLACEHOLDER: Record<ActivityTab, string> = {
    [ActivityType.CALL]:
      "Ghi chú cuộc gọi... nội dung trao đổi, kết quả, bước tiếp theo...",
    [ActivityType.EMAIL]:
      "Tóm tắt email... chủ đề, nội dung chính, phản hồi của khách...",
    [ActivityType.MEETING]:
      "Ghi chú cuộc họp... agenda, thảo luận, quyết định, action items...",
    [ActivityType.NOTE]:
      entityType === "deal"
        ? "Ghi chú nội bộ... thông tin quan trọng về deal này..."
        : "Ghi chú nội bộ... thông tin quan trọng về liên hệ này...",
  };

  return (
    <div className="mx-6 mt-5 mb-0 bg-background rounded-xl border border-border overflow-hidden shrink-0">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Tab selector */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-2.5 border-0 cursor-pointer transition-all",
                  "-mb-px border-b-2",
                  isActive
                    ? "bg-secondary/40 text-primary border-b-primary"
                    : "bg-transparent text-muted-foreground border-b-transparent hover:text-foreground hover:bg-muted/30",
                )}
                style={{ fontSize: 12, fontWeight: isActive ? 500 : 400 }}
              >
                <Icon size={12} strokeWidth={isActive ? 2.2 : 1.7} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Title input */}
        <div className="px-4 pt-3">
          <Input
            {...form.register("title")}
            value={form.watch("title") || ""}
            placeholder="Tiêu đề hoạt động (tùy chọn)"
            className="bg-[#F8F8F7] border-[#E8E7E2] text-sm"
            style={{ fontSize: 13 }}
          />
        </div>
    
        {/* Textarea */}
        <div className="px-4 py-2">
          <Textarea
            {...form.register("note")}
            value={form.watch("note") || ""}
            placeholder={PLACEHOLDER[activeTab]}
            rows={3}
            className="bg-[#F8F8F7] border-[#E8E7E2] text-sm resize-none"
            style={{ fontSize: 13, lineHeight: 1.6 }}
          />
        </div>

        {/* Form footer */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-border">
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md border border-border bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Clock size={11} />
            {relativeTime(new Date())}
            <ChevronDown size={10} />
          </button>

          <Button
            type="submit"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={!note?.trim() || isPending}
          >
            <Send size={11} />
            {isPending ? "Đang lưu..." : "Lưu hoạt động"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LogActivityForm;
