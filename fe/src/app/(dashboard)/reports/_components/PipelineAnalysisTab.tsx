"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, Area,
  Line, CartesianGrid, ComposedChart
} from "recharts";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";
import { formatVndShort, STAGE_COLORS } from "@/lib/helper";
import { reportsService } from "@/services/reports.service";

function getFunnelColor(stageName: string): string {
  if (stageName.includes("Prospect")) return STAGE_COLORS.PROSPECT.funnel;
  if (stageName.includes("Qualified")) return STAGE_COLORS.QUALIFIED.funnel;
  if (stageName.includes("Proposal")) return STAGE_COLORS.PROPOSAL.funnel;
  if (stageName.includes("Won")) return STAGE_COLORS.CLOSED_WON.funnel;
  return STAGE_COLORS.PROSPECT.funnel;
}

const FunnelTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-card border border-[#E8E7E2] dark:border-border rounded-lg shadow-md px-3 py-2.5 text-xs text-left">
      <p className="text-[#1A1A18] dark:text-foreground mb-1.5" style={{ fontWeight: 600 }}>{data.stage}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-[#6B6B67] dark:text-muted-foreground">Số lượng deal:</span>
          <span className="text-[#1A1A18] dark:text-foreground font-semibold">{data.count} deals</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-[#6B6B67] dark:text-muted-foreground">Tổng giá trị:</span>
          <span className="text-[#1A1A18] dark:text-foreground font-semibold">{formatVndShort(data.value)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-[#6B6B67] dark:text-muted-foreground">Tỷ lệ chuyển đổi:</span>
          <span className="text-[#1E90FF] font-semibold">{data.percentage}%</span>
        </div>
      </div>
    </div>
  );
};

const ForecastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-card border border-[#E8E7E2] dark:border-border rounded-lg shadow-md px-3 py-2.5 text-xs text-left">
      <p className="text-[#1A1A18] dark:text-foreground mb-1.5" style={{ fontWeight: 600 }}>Tháng {label.replace("T", "")}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between items-center gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.color ?? p.fill }} />
            <span className="text-[#6B6B67] dark:text-muted-foreground">{p.name}:</span>
          </div>
          <span className="text-[#1A1A18] dark:text-foreground font-semibold">{formatVndShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function PipelineAnalysisTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "pipeline-analysis"],
    queryFn: () => reportsService.getPipelineAnalysis(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <span className="text-[#6B6B67] text-sm">Đang tải phân tích phễu chuyển đổi...</span>
      </div>
    );
  }

  if (!data) return null;

  const isFunnelEmpty = !data.conversionFunnel || data.conversionFunnel.length === 0 || data.conversionFunnel.every(d => d.count === 0);
  const isForecastEmpty = !data.weightedForecast || data.weightedForecast.length === 0 || data.weightedForecast.every(d => !d.actual && !d.forecast && !d.target);

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Funnel & KPI summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Funnel Chart */}
        <ChartCard
          title="Phễu chuyển đổi bán hàng (Conversion Funnel)"
          subtitle="Tỷ lệ hao hụt và giữ chân deal qua các bước trong kỳ báo cáo"
        >
          {isFunnelEmpty ? (
            <EmptyState
              icon={Activity}
              title="Chưa có dữ liệu phễu"
              description="Hãy bắt đầu tạo các cơ hội kinh doanh (Deals) ở các giai đoạn khác nhau để xem phễu chuyển đổi."
              height={290}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={data.conversionFunnel}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<FunnelTooltip />} />
                  <Bar
                    dataKey="percentage"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    background={{ fill: "var(--muted)", radius: 4 }}
                  >
                    {data.conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getFunnelColor(entry.stage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Funnel breakdown legends */}
              <div className="grid grid-cols-4 border-t border-[#E8E7E2] dark:border-border pt-4 text-center">
                {data.conversionFunnel.map((d) => (
                  <div key={d.stage} className="flex flex-col gap-1 border-r border-[#E8E7E2] dark:border-border last:border-0">
                    <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>{d.stage.split(" (")[0].split(". ")[1] || d.stage}</span>
                    <span className="text-[#1A1A18] dark:text-foreground font-bold" style={{ fontSize: 13 }}>{d.count}</span>
                    <span className="font-semibold" style={{ fontSize: 10, color: getFunnelColor(d.stage) }}>{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Funnel bottlenecks summary cards */}
        <div className="flex flex-col gap-4 justify-between">
          <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-5 flex flex-col gap-3 flex-1 shadow-sm">
            <h4 className="text-[#1A1A18] dark:text-foreground font-bold text-xs" style={{ fontSize: 13 }}>Phân tích điểm nghẽn (Bottlenecks)</h4>
            <div className="space-y-3 mt-1.5">
              {isFunnelEmpty ? (
                <p className="text-[#6B6B67] dark:text-muted-foreground text-xs">Chưa có đủ dữ liệu phễu chuyển đổi để phân tích điểm nghẽn hiện tại.</p>
              ) : data.bottlenecks.length === 0 ? (
                <p className="text-[#6B6B67] dark:text-muted-foreground text-xs">Không phát hiện điểm nghẽn nghiêm trọng nào trong phễu chuyển đổi hiện tại.</p>
              ) : (
                data.bottlenecks.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className={`size-5 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      b.type === "warning" ? "bg-[#FEE2E2] dark:bg-destructive/20 text-[#A32D2D] dark:text-destructive" : "bg-[#E6F6F0] dark:bg-secondary text-[#1D9E75] dark:text-primary"
                    }`}>
                      {b.type === "warning" ? "!" : "✓"}
                    </span>
                    <div>
                      <p className="text-[#1A1A18] dark:text-foreground font-medium text-xs" style={{ fontSize: 12 }}>
                        {b.title}
                      </p>
                      <p className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>
                        {b.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#534AB7] rounded-[10px] p-5 text-white flex flex-col justify-between" style={{ minHeight: 120 }}>
            <div>
              <p className="opacity-80" style={{ fontSize: 11 }}>Tỉ lệ thắng phễu bán hàng (Conversion Funnel Win Velocity)</p>
              <p className="font-extrabold mt-1" style={{ fontSize: 26 }}>{isFunnelEmpty ? "0.0%" : data.averageWinVelocity}</p>
            </div>
            <p className="opacity-70 border-t border-white/20 pt-2.5 mt-2" style={{ fontSize: 10 }}>
              Biểu diễn tỉ trọng số lượng cơ hội chuyển đổi thành Deal thắng thực tế trên tổng số Deal đã đóng.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Weighted Revenue Forecast */}
      <ChartCard
        title="Dự báo doanh số cộng dồn (Weighted Revenue Forecast)"
        subtitle="Biểu diễn xu hướng doanh số thực tế so với mục tiêu và dự báo dựa trên phễu"
        action={
          !isForecastEmpty && (
            <div className="flex items-center gap-3 mr-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "#534AB7" }} />
                <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Đà đạt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "#877EF2" }} />
                <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Dự báo (Weighted)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="8">
                  <line x1="0" y1="4" x2="16" y2="4" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 2" />
                </svg>
                <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Chỉ tiêu Target</span>
              </div>
            </div>
          )
        }
      >
        {isForecastEmpty ? (
          <EmptyState
            icon={TrendingUp}
            title="Chưa có dự báo doanh số"
            description="Chưa có thông tin doanh số thực tế và dự báo chốt hợp đồng (weighted) trong khoảng thời gian này."
            height={260}
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.weightedForecast} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={formatVndShort} width={50} />
              <Tooltip content={<ForecastTooltip />} />
              
              {/* Cum Actual Area */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Doanh thu thực"
                fill="rgba(83, 74, 183, 0.08)"
                stroke="#534AB7"
                strokeWidth={2.5}
              />

              {/* Cum Forecast Area */}
              <Area
                type="monotone"
                dataKey="forecast"
                name="Dự báo chốt"
                fill="rgba(135, 126, 242, 0.04)"
                stroke="#877EF2"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
              />

              {/* Target Line */}
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#FBBF24"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
