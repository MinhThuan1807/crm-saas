import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { fmtTr } from "./reportsData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="text-[#1A1A18] mb-1.5" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color ?? p.stroke }} />
          <span className="text-[#6B6B67]">{p.name}:</span>
          <span className="text-[#1A1A18]" style={{ fontWeight: 500 }}>{fmtTr(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface ForecastAreaChartProps {
  data?: {
    month: string;
    cumActual: number;
    cumForecast: number;
  }[];
}

export function ForecastAreaChart({ data = [] }: ForecastAreaChartProps) {
  const lastItem = data[data.length - 1];
  const percentDiff = lastItem && lastItem.cumForecast > 0
    ? ((lastItem.cumActual - lastItem.cumForecast) / lastItem.cumForecast) * 100
    : 0;

  const actionText = percentDiff >= 0
    ? `Vượt forecast +${percentDiff.toFixed(1)}%`
    : `Dưới forecast ${percentDiff.toFixed(1)}%`;

  const maxVal = Math.max(...data.map(d => Math.max(d.cumActual, d.cumForecast)), 100);
  const yDomainMax = Math.ceil(maxVal * 1.2);

  return (
    <ChartCard
      title="Forecast vs Thực tế"
      subtitle="Doanh thu lũy kế"
      action={
        data.length > 0 ? (
          <span
            className="px-2 py-0.5 rounded-full text-white mr-1"
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: percentDiff >= 0 ? "#1D9E75" : "#D85A30",
            }}
          >
            {actionText}
          </span>
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="rpt-fva-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#534AB7" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#534AB7" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="rpt-fva-forecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#60A5FA" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid key="fva-grid"  strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
          <XAxis         key="fva-xaxis" dataKey="month" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
          <YAxis         key="fva-yaxis" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} tickFormatter={fmtTr} width={48} domain={[0, yDomainMax]} />
          <Tooltip       key="fva-tt"    content={<CustomTooltip />} />
          <Area
            key="fva-forecast"
            type="monotone"
            dataKey="cumForecast"
            name="Dự báo"
            stroke="#60A5FA"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#rpt-fva-forecast)"
          />
          <Area
            key="fva-actual"
            type="monotone"
            dataKey="cumActual"
            name="Thực tế"
            stroke="#534AB7"
            strokeWidth={2.5}
            fill="url(#rpt-fva-actual)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
