import { ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_COLORS, formatVndShort } from "@/lib/helper";

const MOCK_STAGES = [
  { name: "Prospect",   count: 38, value: 820000000 },
  { name: "Qualified",  count: 26, value: 610000000 },
  { name: "Proposal",   count: 17, value: 480000000 },
  { name: "Closed Won", count: 11, value: 340000000 },
];

function getStageColor(name: string): string {
  if (name.includes("Prospect")) return STAGE_COLORS.PROSPECT.funnel;
  if (name.includes("Qualified")) return STAGE_COLORS.QUALIFIED.funnel;
  if (name.includes("Proposal")) return STAGE_COLORS.PROPOSAL.funnel;
  if (name.includes("Closed Won") || name.includes("Won")) return STAGE_COLORS.CLOSED_WON.funnel;
  return STAGE_COLORS.PROSPECT.funnel;
}

interface PipelineChartProps {
  stages?: {
    name: string;
    count: number;
    value: number;
  }[];
  totalCount?: number;
  totalValue?: number;
  isLoading?: boolean;
}

export function PipelineChart({
  stages = MOCK_STAGES,
  totalCount = 92,
  totalValue = 2250000000,
  isLoading = false,
}: PipelineChartProps) {
  const maxCount = stages.reduce((max, s) => Math.max(max, s.count), 0) || 1;


  return (
    <Card className="shadow-none border-border/70 gap-0 py-0 h-full flex flex-col">
      <CardHeader className="border-b px-5 py-4">
        <div>
          <CardTitle className="text-sm tracking-tight">Pipeline Funnel</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Phân bổ deals theo giai đoạn
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-primary hover:text-primary hover:bg-secondary/60 text-xs px-2"
          >
            Xem Pipeline
            <ArrowRight className="size-3" />
          </Button>
        </CardAction>
      </CardHeader>

      {isLoading ? (
        <CardContent className="px-5 py-5 flex-1 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 rounded-sm" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-5" />
                </div>
              </div>
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </CardContent>
      ) : (
        <CardContent className="px-5 py-5 flex-1 space-y-4">
          {stages.map((stage, i) => {
            const widthPct = (stage.count / maxCount) * 100;
            const convRate =
              i > 0
                ? Math.round((stage.count / stages[i - 1].count) * 100)
                : null;

            return (
              <div key={stage.name} className="space-y-1.5">
                {/* Label row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-sm shrink-0"
                      style={{ background: getStageColor(stage.name) }}
                    />
                    <span className="text-foreground" style={{ fontSize: 13 }}>
                      {stage.name}
                    </span>
                    {convRate !== null && !isNaN(convRate) && isFinite(convRate) && (
                      <span className="text-muted-foreground bg-muted border border-border/50 px-1.5 py-px rounded-full" style={{ fontSize: 10 }}>
                        {convRate}% chuyển đổi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground">
                      {formatVndShort(stage.value)}
                    </span>
                    <span
                      className="text-foreground tabular-nums w-6 text-right"
                      style={{ fontSize: 14, fontWeight: 600 }}
                    >
                      {stage.count}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-6 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{ width: `${widthPct}%`, background: getStageColor(stage.name) }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      )}

      {isLoading ? (
        <CardFooter className="border-t px-5 py-3 flex items-center justify-between">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Skeleton className="size-1.5 rounded-sm" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3.5 w-28" />
        </CardFooter>
      ) : (
        <CardFooter className="border-t px-5 py-3 flex items-center justify-between">
          <div className="flex gap-4">
            {stages.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div
                  className="size-1.5 rounded-sm shrink-0"
                  style={{ background: getStageColor(s.name) }}
                />
                <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            Tổng: {totalCount} deals · {formatVndShort(totalValue)}
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
