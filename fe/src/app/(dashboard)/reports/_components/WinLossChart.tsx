import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { winLossData } from "./reportsData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="text-[#1A1A18] mb-1" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-[#6B6B67]">{p.name}:</span>
          <span className="text-[#1A1A18]" style={{ fontWeight: 500 }}>{p.value}%</span>
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

export function WinLossChart({ data = winLossData }: WinLossChartProps) {
  return (
    <ChartCard title="Win/Loss theo giai đoạn" subtitle="Tỷ lệ thắng/thua">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 8, left: -16, bottom: 5 }}
          barSize={14}
          barCategoryGap="30%"
        >
          <CartesianGrid key="wl-grid"  strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
          <XAxis         key="wl-xaxis" dataKey="stage" tick={{ fontSize: 10, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
          <YAxis         key="wl-yaxis" tick={{ fontSize: 10, fill: "#6B6B67" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
          <Tooltip       key="wl-tt"    content={<CustomTooltip />} />
          <Bar key="wl-win"  dataKey="win"  name="Win"  fill="#1D9E75" radius={[3, 3, 0, 0]} />
          <Bar key="wl-loss" dataKey="loss" name="Loss" fill="#D85A30" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-1">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm" style={{ background: "#1D9E75" }} />
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Win</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm" style={{ background: "#D85A30" }} />
          <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>Loss</span>
        </div>
      </div>
    </ChartCard>
  );
}
