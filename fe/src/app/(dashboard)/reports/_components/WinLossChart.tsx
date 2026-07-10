import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";
import { winLossData } from "./reportsData";

import { CustomTooltipProps } from "@/lib/types/chart";

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-card border border-[#E8E7E2] dark:border-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-[#1A1A18] dark:text-foreground mb-1" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-[#6B6B67] dark:text-muted-foreground">{p.name}:</span>
          <span className="text-[#1A1A18] dark:text-foreground" style={{ fontWeight: 500 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

interface WinLossChartProps {
  data?: {
    stage: string;
    win: number;
    loss: number;
  }[];
}

export function WinLossChart({ data }: WinLossChartProps) {
  const isDataEmpty = !data || data.length === 0 || data.every(d => d.win === 0 && d.loss === 0);
  const chartData = data || [];

  return (
    <ChartCard title="Win/Loss theo giai đoạn" subtitle="Tỷ lệ thắng/thua">
      {isDataEmpty ? (
        <EmptyState
          icon={BarChart2}
          title="Chưa có dữ liệu thắng/thua"
          description="Hãy tạo cơ hội kinh doanh (Deals) và cập nhật trạng thái kết thúc (Won/Lost) để phân tích tỷ lệ chuyển đổi."
          height={213}
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 8, left: -16, bottom: 5 }}
              barSize={14}
              barCategoryGap="30%"
            >
              <CartesianGrid key="wl-grid"  strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis         key="wl-xaxis" dataKey="stage" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis         key="wl-yaxis" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip       key="wl-tt"    content={<CustomTooltip />} />
              <Bar key="wl-win"  dataKey="win"  name="Win"  fill="#1D9E75" radius={[3, 3, 0, 0]} />
              <Bar key="wl-loss" dataKey="loss" name="Loss" fill="#D85A30" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm" style={{ background: "#1D9E75" }} />
              <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm" style={{ background: "#D85A30" }} />
              <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Loss</span>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
