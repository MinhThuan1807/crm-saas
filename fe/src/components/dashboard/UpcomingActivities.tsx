import { Phone, Mail, Users, FileText, Plus, ArrowRight, CalendarCheck } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { UpcomingActivityType } from "@/lib/validations/dashboard.schema";

type ActivityType = "call" | "email" | "meeting" | "note";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  contact: string;
  company: string;
  time: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "call",
    title: "Gọi điện theo dõi deal",
    contact: "Nguyễn Thị Bích",
    company: "Tập đoàn DEF",
    time: "Hôm nay 14:00",
  },
  {
    id: "a2",
    type: "meeting",
    title: "Họp demo sản phẩm",
    contact: "Trần Văn Nam",
    company: "Ngân hàng JKL",
    time: "Hôm nay 15:30",
  },
  {
    id: "a3",
    type: "email",
    title: "Gửi báo giá cập nhật",
    contact: "Phạm Thị Lan",
    company: "Cty CP PQR",
    time: "Ngày mai 09:00",
  },
  {
    id: "a4",
    type: "meeting",
    title: "Thương lượng hợp đồng",
    contact: "Lê Đức Hùng",
    company: "Tập đoàn MNO",
    time: "Ngày mai 14:00",
  },
  {
    id: "a5",
    type: "call",
    title: "Chăm sóc sau ký hợp đồng",
    contact: "Vũ Thị Hoa",
    company: "Cty TNHH VWX",
    time: "24/03 10:30",
  },
];

const typeConfig: Record<
  ActivityType,
  { icon: typeof Phone; bg: string; color: string }
> = {
  call:    { icon: Phone,    bg: "#E6F4D7", color: "#3B6D11" },
  email:   { icon: Mail,     bg: "#EEEDFE", color: "#534AB7" },
  meeting: { icon: Users,    bg: "#FEF3E2", color: "#854F0B" },
  note:    { icon: FileText, bg: "#F1EFE8", color: "#6B6B67" },
};

interface UpcomingActivitiesProps {
  activities?: UpcomingActivityType[];
  isLoading?: boolean;
}

export function UpcomingActivities({ activities = MOCK_ACTIVITIES, isLoading = false }: UpcomingActivitiesProps) {
  return (
    <Card className="shadow-none border-border/70 gap-0 py-0 flex flex-col">
      <CardHeader className="border-b px-5 py-4">
        <div>
          <CardTitle className="text-sm tracking-tight">Hoạt động sắp tới</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Lịch làm việc của bạn
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-primary hover:text-primary hover:bg-secondary/60 text-xs px-2"
            asChild
          >
            <Link href="/activities">
              Tất cả
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      {isLoading ? (
        <CardContent className="p-0 flex-1 space-y-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-b-muted/60 last:border-b-0">
              <Skeleton className="size-[30px] rounded-lg shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
              <Skeleton className="h-3.5 w-16 rounded shrink-0" />
            </div>
          ))}
        </CardContent>
      ) : activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-muted-foreground text-center px-4">
          <CalendarCheck className="size-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">Không có hoạt động sắp tới</p>
          <p style={{ fontSize: 11, marginTop: 2, maxWidth: 200 }} className="text-muted-foreground">Lịch làm việc của bạn đang trống</p>
        </div>
      ) : (
        <CardContent className="p-0 flex-1">
          {activities.map((act, i) => {
            const config = typeConfig[act.type as ActivityType] || typeConfig.note;
            const Icon = config.icon;
            const isToday = act.time.startsWith("Hôm nay");

            return (
              <div
                key={act.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-muted/30",
                  i < activities.length - 1 && "border-b border-b-muted/60"
                )}
              >
                {/* Icon badge */}
                <div
                  className="size-[30px] rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: config.bg }}
                >
                  <Icon size={13} color={config.color} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-foreground truncate leading-tight"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {act.title}
                  </p>
                  <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: 11 }}>
                    {act.contact} · {act.company}
                  </p>
                </div>

                {/* Time badge */}
                <span
                  className={cn(
                    "shrink-0 rounded-full whitespace-nowrap",
                    isToday
                      ? "bg-secondary text-primary px-2 py-0.5"
                      : "text-muted-foreground"
                  )}
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 500 : 400,
                  }}
                >
                  {act.time}
                </span>
              </div>
            );
          })}
        </CardContent>
      )}

      <CardFooter className="border-t px-5 py-3 justify-center">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
        >
          <Plus className="size-3.5" />
          Thêm hoạt động mới
        </Button>
      </CardFooter>
    </Card>
  );
}
