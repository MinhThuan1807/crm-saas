import { ArrowRight, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, getAvatarColors, formatVndShort } from "@/lib/helper";

const MOCK_REPS = [
  { rank: 1, userId: "u1", name: "Trần Thị Hương", deals: 12, revenue: 420000000 },
  { rank: 2, userId: "u2", name: "Nguyễn Quang",   deals: 9,  revenue: 315000000 },
  { rank: 3, userId: "u3", name: "Phạm Thị Lan",   deals: 8,  revenue: 280000000 },
  { rank: 4, userId: "u4", name: "Vũ Đức Minh",    deals: 6,  revenue: 195000000 },
  { rank: 5, userId: "u5", name: "Lê Thị Thu",     deals: 5,  revenue: 140000000 },
];

const rankLabel = (r: number) =>
  r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : String(r);

interface LeaderboardProps {
  reps?: {
    rank: number;
    userId: string;
    name: string;
    deals: number;
    revenue: number;
  }[];
  isLoading?: boolean;
}

export function Leaderboard({ reps = MOCK_REPS, isLoading = false }: LeaderboardProps) {
  const maxRevenue = reps.reduce((max, r) => Math.max(max, r.revenue), 0) || 1;
  return (
    <Card className="shadow-none border-border/70 gap-0 py-0 h-full flex flex-col">
      <CardHeader className="border-b px-5 py-4">
        <div>
          <CardTitle className="text-sm tracking-tight">Bảng xếp hạng</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Hiệu suất tháng này
          </CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <CardContent className="px-3 pt-2 pb-2 flex-1 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
              <Skeleton className="w-5 h-4 rounded shrink-0" />
              <Skeleton className="size-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24 rounded" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-1 w-16 rounded-full" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-10 rounded shrink-0" />
            </div>
          ))}
        </CardContent>
      ) : reps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-muted-foreground text-center px-4">
          <Users className="size-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">Chưa có dữ liệu xếp hạng</p>
          <p style={{ fontSize: 11, marginTop: 2, maxWidth: 200 }} className="text-muted-foreground">Không có deal nào được chốt thành công trong kỳ này</p>
        </div>
      ) : (
        <CardContent className="px-3 pt-2 pb-2 flex-1 space-y-0.5">
          {reps.map((rep) => {
            const isFirst = rep.rank === 1;
            const barW = Math.round((rep.revenue / maxRevenue) * 64);

            return (
              <div
                key={rep.rank}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-default",
                  isFirst
                    ? "bg-secondary/50 border border-primary/20"
                    : "hover:bg-muted/60"
                )}
              >
                {/* Rank */}
                <span
                  className={cn(
                    "w-5 text-center shrink-0 leading-none",
                    isFirst ? "text-base" : "text-muted-foreground"
                  )}
                  style={isFirst ? {} : { fontSize: 12, fontWeight: 500 }}
                >
                  {rankLabel(rep.rank)}
                </span>

                {/* Avatar */}
                <Avatar
                  className="size-7 shrink-0"
                  style={isFirst ? { outline: "1.5px solid #C4C0F0", borderRadius: "50%" } : {}}
                >
                  <AvatarFallback
                    className="border-0"
                    style={{
                      background: getAvatarColors(rep.userId).bg,
                      color: getAvatarColors(rep.userId).color,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(rep.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "truncate leading-tight text-foreground",
                      isFirst ? "" : ""
                    )}
                    style={{ fontSize: 13, fontWeight: isFirst ? 600 : 400 }}
                  >
                    {rep.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: barW,
                        background: isFirst ? "#534AB7" : "#D3D1E8",
                      }}
                    />
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 11 }}
                    >
                      {rep.deals} deals
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <span
                  className="shrink-0 tabular-nums"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isFirst ? "#534AB7" : "#1A1A18",
                  }}
                >
                  {formatVndShort(rep.revenue)}
                </span>
              </div>
            );
          })}
        </CardContent>
      )}

      <CardFooter className="border-t px-5 py-3 justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-primary hover:text-primary hover:bg-secondary/60 text-xs"
        >
          Xem toàn bộ báo cáo
          <ArrowRight className="size-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
