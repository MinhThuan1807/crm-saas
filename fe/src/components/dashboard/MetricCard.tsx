import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardAction,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatVndShort } from "@/lib/helper";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: { value: string; positive: boolean };
  progress?: { current: number; target: number; label?: string };
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  progress,
  subtext,
  icon: Icon,
  iconBg = "#EEEDFE",
  iconColor = "#534AB7",
}: MetricCardProps) {
  const pct = progress
    ? Math.min((progress.current / progress.target) * 100, 100)
    : 0;

  return (
    <Card className="gap-0 shadow-none border-border/70 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardDescription className="text-xs">{label}</CardDescription>
        {Icon && (
          <CardAction>
            <div
              className="size-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: iconBg }}
            >
              <Icon size={14} color={iconColor} strokeWidth={2} />
            </div>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-2">
        <div className="flex items-end gap-2">
          <span
            className="text-foreground tracking-tight"
            style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}
          >
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full mb-0.5",
                trend.positive
                  ? "bg-[#F0F9E6] text-[#3B6D11]"
                  : "bg-[#FDF0F0] text-[#A32D2D]"
              )}
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              {trend.positive ? (
                <TrendingUp size={10} strokeWidth={2.2} />
              ) : (
                <TrendingDown size={10} strokeWidth={2.2} />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {subtext && !progress && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}

        {progress && (
          <div className="space-y-1.5 pt-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100 ? "#3B6D11" : "#534AB7",
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                {progress.label || `Target: ${formatVndShort(progress.target)}`}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: pct >= 80 ? "#3B6D11" : "#854F0B",
                }}
              >
                {Math.round(pct)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
