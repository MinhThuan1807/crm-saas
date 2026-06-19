import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials, getAvatarColors, formatVndShort, STAGE_COLORS } from "@/lib/helper";

interface Deal {
  id: string;
  title: string;
  company: string;
  stage: string;
  value: number;
  owner: { id: string; name: string };
  daysAgo: number;
}

const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Security Audit Platform",
    company: "Ngân hàng JKL",
    stage: "PROPOSAL",
    value: 480000000,
    owner: { id: "u1", name: "Trần Thị Hương" },
    daysAgo: 0,
  },
  {
    id: "d2",
    title: "ERP Implementation",
    company: "Tập đoàn MNO",
    stage: "QUALIFIED",
    value: 720000000,
    owner: { id: "u2", name: "Nguyễn Quang" },
    daysAgo: 1,
  },
  {
    id: "d3",
    title: "Cloud Migration",
    company: "Công ty Cổ phần PQR",
    stage: "PROSPECT",
    value: 320000000,
    owner: { id: "u3", name: "Phạm Thị Lan" },
    daysAgo: 2,
  },
  {
    id: "d4",
    title: "HR Management System",
    company: "Tập đoàn STU",
    stage: "CLOSED_WON",
    value: 195000000,
    owner: { id: "u4", name: "Vũ Đức Minh" },
    daysAgo: 3,
  },
  {
    id: "d5",
    title: "Data Analytics Dashboard",
    company: "Cty TNHH VWX",
    stage: "PROPOSAL",
    value: 560000000,
    owner: { id: "u5", name: "Lê Thị Thu" },
    daysAgo: 5,
  },
];

import { Skeleton } from "@/components/ui/skeleton";

function timeLabel(daysAgo: number) {
  if (daysAgo === 0) return "Hôm nay";
  if (daysAgo === 1) return "Hôm qua";
  return `${daysAgo} ngày trước`;
}

interface RecentDealsProps {
  deals?: Deal[];
  isLoading?: boolean;
}

export function RecentDeals({ deals = MOCK_DEALS, isLoading = false }: RecentDealsProps) {
  return (
    <Card className="shadow-none border-border/70 gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <div>
          <CardTitle className="text-sm tracking-tight">Deals gần đây</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Hoạt động trong 7 ngày qua
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-primary hover:text-primary hover:bg-secondary/60 text-xs px-2"
            asChild
          >
            <Link href="/pipeline">
              Xem tất cả
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b-border/50 hover:bg-transparent">
              <TableHead className="px-5 py-2 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                Deal
              </TableHead>
              <TableHead className="px-2 py-2 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                Giai đoạn
              </TableHead>
              <TableHead className="px-2 py-2 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                Giá trị
              </TableHead>
              <TableHead className="px-2 py-2 text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                Owner
              </TableHead>
              <TableHead className="px-5 py-2 text-muted-foreground text-right" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                Ngày
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="border-b border-b-muted/60 hover:bg-transparent">
                  <TableCell className="px-5 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <Skeleton className="h-4 w-10 rounded" />
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <Skeleton className="size-6 rounded-full" />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <Skeleton className="h-3.5 w-14 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                  Chưa có deal nào được tạo trong kỳ này
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer border-b border-b-muted/60 hover:bg-muted/30"
                >
                  {/* Deal + company */}
                  <TableCell className="px-5 py-3">
                    <div className="min-w-0">
                      <p
                        className="text-foreground truncate max-w-[200px]"
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        {deal.title}
                      </p>
                      <p className="text-muted-foreground truncate max-w-[200px]" style={{ fontSize: 11, marginTop: 1 }}>
                        {deal.company}
                      </p>
                    </div>
                  </TableCell>

                  {/* Stage badge */}
                  <TableCell className="px-2 py-3">
                    {(() => {
                      const stageColors = STAGE_COLORS[deal.stage as keyof typeof STAGE_COLORS] || STAGE_COLORS.PROSPECT;
                      return (
                        <span
                          className="inline-block rounded-full px-2 py-0.5 whitespace-nowrap"
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: stageColors.text,
                            background: stageColors.bg,
                          }}
                        >
                          {stageColors.label}
                        </span>
                      );
                    })()}
                  </TableCell>

                  {/* Value */}
                  <TableCell className="px-2 py-3 text-foreground tabular-nums" style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatVndShort(deal.value)}
                  </TableCell>

                  {/* Owner */}
                  <TableCell className="px-2 py-3">
                    <Avatar className="size-6">
                      <AvatarFallback
                        className="border-0"
                        style={{
                          background: getAvatarColors(deal.owner.id).bg,
                          color: getAvatarColors(deal.owner.id).color,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(deal.owner.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  {/* Time */}
                  <TableCell className="px-5 py-3 text-muted-foreground text-right" style={{ fontSize: 11 }}>
                    {timeLabel(deal.daysAgo)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
