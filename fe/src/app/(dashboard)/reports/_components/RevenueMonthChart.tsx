import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { revenueByMonth, fmtTr } from "./reportsData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="text-[#1A1A18] mb-1.5" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="text-[#6B6B67]">{p.name}:</span>
          <span className="text-[#1A1A18]" style={{ fontWeight: 500 }}>{fmtTr(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const LEGEND = [
  { color: "#534AB7", label: "Thực tế",  dash: false, bar: true  },
  { color: "#FBBF24", label: "Target",   dash: true,  bar: false },
];

export function RevenueMonthChart() {
  return (
    <ChartCard
      title="Doanh thu theo tháng"
      subtitle="Thực tế so với Target"
      action={
        <div className="flex items-center gap-3 mr-1">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              {l.bar ? (
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
              ) : (
                <svg width="16" height="8">
                  <line x1="0" y1="4" x2="16" y2="4" stroke={l.color} strokeWidth="2" strokeDasharray="4 2" />
                </svg>
              )}
              <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={revenueByMonth} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid key="rm-grid"  strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
          <XAxis         key="rm-xaxis" dataKey="month" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
          <YAxis         key="rm-yaxis" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} tickFormatter={fmtTr} width={44} domain={[0, 200000]} />
          <Tooltip       key="rm-tt"    content={<CustomTooltip />} />
          <Bar  key="rm-bar"  dataKey="actual" name="Thực tế" fill="#534AB7" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Line key="rm-line" type="monotone" dataKey="target" name="Target" stroke="#FBBF24" strokeWidth={2} strokeDasharray="5 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
