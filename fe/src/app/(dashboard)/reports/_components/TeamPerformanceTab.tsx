import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { teamPerformanceData, fmtTr } from "./reportsData";

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
  { color: "#534AB7", label: "Thực tế" },
  { color: "#AFA9EC", label: "Target" },
];

export function TeamPerformanceTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Chart Row */}
      <ChartCard
        title="So sánh doanh số thực tế vs Chỉ tiêu"
        subtitle="Doanh số đạt được so với chỉ tiêu giao cho từng thành viên trong năm nay"
        action={
          <div className="flex items-center gap-3 mr-1">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
                <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>{l.label}</span>
              </div>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={teamPerformanceData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} tickFormatter={fmtTr} width={44} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="actual" name="Thực tế" fill="#534AB7" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="target" name="Target" fill="#AFA9EC" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Table Row */}
      <div className="bg-white rounded-[10px] border border-[#E8E7E2] overflow-hidden">
        <div className="p-4 border-b border-[#E8E7E2]">
          <h3 className="text-[#1A1A18]" style={{ fontSize: 13, fontWeight: 600 }}>Chi tiết chỉ số hiệu suất</h3>
          <p className="text-[#6B6B67] mt-0.5" style={{ fontSize: 11 }}>Đo lường chi tiết năng lực bán hàng và tần suất hoạt động</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E7E2] bg-[#F8F8F7]">
                <th className="p-3 pl-4 text-[#6B6B67] font-medium" style={{ fontSize: 11 }}>NHÂN VIÊN</th>
                <th className="p-3 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>DOANH SỐ ĐẠT</th>
                <th className="p-3 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>CHỈ TIÊU (TARGET)</th>
                <th className="p-3 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>TỶ LỆ ĐẠT</th>
                <th className="p-3 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>TỶ LỆ CHỐT (WIN RATE)</th>
                <th className="p-3 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>HOẠT ĐỘNG</th>
                <th className="p-3 pr-4 text-[#6B6B67] font-medium text-right" style={{ fontSize: 11 }}>SỐ NGÀY CHỐT TB</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformanceData.map((row) => {
                const ratio = ((row.actual / row.target) * 100).toFixed(0);
                return (
                  <tr key={row.name} className="border-b border-[#E8E7E2] last:border-0 hover:bg-[#F8F8F7] transition-colors">
                    {/* User Profile */}
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-7 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{ background: row.bg, color: row.text }}
                        >
                          {row.initials}
                        </div>
                        <span className="text-[#1A1A18] font-medium" style={{ fontSize: 12 }}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {/* Actual */}
                    <td className="p-3 text-[#1A1A18] text-right font-medium tabular-nums" style={{ fontSize: 12 }}>
                      {fmtTr(row.actual)}
                    </td>
                    {/* Target */}
                    <td className="p-3 text-[#6B6B67] text-right tabular-nums" style={{ fontSize: 12 }}>
                      {fmtTr(row.target)}
                    </td>
                    {/* Ratio */}
                    <td className="p-3 text-right tabular-nums" style={{ fontSize: 12 }}>
                      <span
                        className="px-2 py-0.5 rounded font-semibold"
                        style={{
                          fontSize: 11,
                          background: Number(ratio) >= 100 ? "#E6F6F0" : "#FDF2E9",
                          color: Number(ratio) >= 100 ? "#1D9E75" : "#D85A30",
                        }}
                      >
                        {ratio}%
                      </span>
                    </td>
                    {/* Win Rate */}
                    <td className="p-3 text-[#1A1A18] text-right font-medium tabular-nums" style={{ fontSize: 12 }}>
                      {row.winRate}%
                    </td>
                    {/* Activities */}
                    <td className="p-3 text-[#6B6B67] text-right tabular-nums" style={{ fontSize: 12 }}>
                      {row.activities}
                    </td>
                    {/* Average Days to Close */}
                    <td className="p-3 pr-4 text-[#6B6B67] text-right tabular-nums" style={{ fontSize: 12 }}>
                      {row.avgDaysToClose} ngày
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
