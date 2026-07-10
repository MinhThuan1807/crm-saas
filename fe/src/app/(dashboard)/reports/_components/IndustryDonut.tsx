import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./ChartCard";
import { industryData } from "./reportsData";

import { CustomTooltipProps } from "@/lib/types/chart";

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const payloadData = d.payload as { color?: string } | undefined;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: payloadData?.color }} />
        <span className="text-[#1A1A18]" style={{ fontWeight: 600 }}>{d.name}</span>
        <span className="text-[#6B6B67]">{d.value}%</span>
      </div>
    </div>
  );
};

export function IndustryDonut() {
  return (
    <ChartCard title="Doanh thu theo ngành" subtitle="Phân bổ theo lĩnh vực">
      <div className="flex items-center gap-4 pt-1">
        <div className="shrink-0" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                key="ind-pie"
                data={industryData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
              >
                {industryData.map((entry, i) => (
                  <Cell key={`ind-cell-${i}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip key="ind-tt" content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {industryData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="size-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-[#6B6B67] truncate" style={{ fontSize: 11 }}>{item.name}</span>
              </div>
              <span className="text-[#1A1A18] tabular-nums shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
