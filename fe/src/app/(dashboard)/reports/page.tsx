"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, FileText, Calendar, ChevronDown, TrendingUp, TrendingDown,
  BarChart2, PieChart, Activity, Users,
} from "lucide-react";

import { RevenueMonthChart } from "./_components/RevenueMonthChart";
import { ForecastAreaChart }  from "./_components/ForecastAreaChart";
import { WinLossChart }       from "./_components/WinLossChart";
import { TopDealsTable }      from "./_components/TopDealsTable";
import { TeamPerformanceTab } from "./_components/TeamPerformanceTab";
import { PipelineAnalysisTab } from "./_components/PipelineAnalysisTab";
import { ActivityReportTab } from "./_components/ActivityReportTab";
import { reportsService } from "@/services/reports.service";

// ── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "overview" | "team" | "pipeline" | "activity";

const TABS: { value: Tab; label: string; Icon: typeof BarChart2 }[] = [
  { value: "overview",  label: "Sales Overview",     Icon: BarChart2  },
  { value: "team",      label: "Team Performance",   Icon: Users      },
  { value: "pipeline",  label: "Pipeline Analysis",  Icon: Activity   },
  { value: "activity",  label: "Activity Report",    Icon: PieChart   },
];

// ── KPI card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  subtext?: string;
}

function KpiCard({ label, value, delta, up, subtext }: KpiProps) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-2.5 shadow-sm">
      <p className="text-[#6B6B67]" style={{ fontSize: 11 }}>{label}</p>
      <p className="text-[#1A1A18]" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </p>
      <div className="flex items-center gap-1.5">
        {up
          ? <TrendingUp  size={11} className="text-[#1D9E75] shrink-0" />
          : <TrendingDown size={11} className="text-[#D85A30] shrink-0" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: up ? "#1D9E75" : "#D85A30" }}>
          {delta}
        </span>
        {subtext && (
          <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>{subtext}</span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  // Date ranges default to entire 2026 to capture all seeded records
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  // Fetch overview analytics
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["reports", "overview", startDate, endDate],
    queryFn: () => reportsService.getOverview({ startDate, endDate }),
    enabled: activeTab === "overview",
  });

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F8F8F7]">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 border-b border-[#E8E7E2] bg-white flex items-center justify-between px-6 gap-4"
        style={{ height: 64 }}
      >
        <div>
          <h1 className="text-[#1A1A18] tracking-tight" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>
            Reports
          </h1>
          <p className="text-[#6B6B67] mt-1" style={{ fontSize: 12 }}>
            Phân tích &amp; Báo cáo chuyên sâu
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Date range pill */}
          <button
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[#E8E7E2] bg-white hover:bg-[#F8F8F7] transition-colors cursor-pointer"
            style={{ fontSize: 12, color: "#1A1A18" }}
          >
            <Calendar size={13} className="text-[#6B6B67]" />
            <span>01/01/2026 – 31/12/2026</span>
            <ChevronDown size={12} className="text-[#6B6B67]" />
          </button>

          {/* Export CSV */}
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E8E7E2] bg-white hover:bg-[#F8F8F7] transition-colors cursor-pointer"
            style={{ fontSize: 12, color: "#6B6B67" }}
          >
            <Download size={13} />
            Xuất CSV
          </button>

          {/* Export PDF */}
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-white transition-colors cursor-pointer"
            style={{ fontSize: 12, background: "#534AB7", border: "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4840A0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#534AB7")}
          >
            <FileText size={13} />
            Xuất PDF
          </button>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-white border-b border-[#E8E7E2] flex items-end px-6 gap-0"
        style={{ height: 44 }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-1.5 px-4 h-full relative cursor-pointer transition-colors"
              style={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "#534AB7" : "#6B6B67",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2px solid #534AB7" : "2px solid transparent",
              }}
            >
              <tab.Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>

        {activeTab === "overview" && (
          isOverviewLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <span className="text-[#6B6B67] text-sm">Đang tải dữ liệu báo cáo...</span>
            </div>
          ) : (
            overviewData && (
              <div className="flex flex-col gap-5">

                {/* Row 1: KPI cards */}
                <div className="grid grid-cols-5 gap-4">
                  <KpiCard
                    label="Tổng doanh thu"
                    value={overviewData.kpis.totalRevenue.value}
                    delta={overviewData.kpis.totalRevenue.delta}
                    up={overviewData.kpis.totalRevenue.up}
                  />
                  <KpiCard
                    label="Tổng deals đóng"
                    value={overviewData.kpis.closedDeals.value}
                    delta={overviewData.kpis.closedDeals.delta}
                    up={overviewData.kpis.closedDeals.up}
                    subtext={overviewData.kpis.closedDeals.subtext}
                  />
                  <KpiCard
                    label="Win rate TB"
                    value={overviewData.kpis.winRate.value}
                    delta={overviewData.kpis.winRate.delta}
                    up={overviewData.kpis.winRate.up}
                  />
                  <KpiCard
                    label="Avg deal size"
                    value={overviewData.kpis.avgDealSize.value}
                    delta={overviewData.kpis.avgDealSize.delta}
                    up={overviewData.kpis.avgDealSize.up}
                  />
                  <KpiCard
                    label="Avg days to close"
                    value={overviewData.kpis.avgDaysToClose.value}
                    delta={overviewData.kpis.avgDaysToClose.delta}
                    up={overviewData.kpis.avgDaysToClose.up}
                  />
                </div>

                {/* Row 2: Revenue chart + Forecast chart */}
                <div className="grid grid-cols-2 gap-4">
                  <RevenueMonthChart data={overviewData.revenueByMonth} />
                  <ForecastAreaChart data={overviewData.forecastData} />
                </div>

                {/* Row 3: Win/Loss Chart only */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <WinLossChart />
                  </div>
                  <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[#1A1A18] font-bold text-xs" style={{ fontSize: 13 }}>Tỷ lệ chốt Sales</h4>
                      <p className="text-[#6B6B67] mt-1.5" style={{ fontSize: 11 }}>
                        Thống kê tỷ lệ thắng (Win) và thua (Loss) của các Deal đã đóng trong kỳ.
                      </p>
                    </div>
                    
                    {/* Hiển thị chỉ số KPI Win Rate thực tế để lấp khoảng trống ở giữa */}
                    <div className="flex flex-col items-center justify-center py-6">
                      <span className="text-[#534AB7] text-4xl font-bold tracking-tight">
                        {overviewData.kpis.winRate.value}
                      </span>
                      <span className="text-[#6B6B67] mt-1" style={{ fontSize: 11 }}>
                        Tỷ lệ thắng trung bình kỳ này
                      </span>
                      <div className="flex items-center gap-1 mt-2">
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: overviewData.kpis.winRate.up ? "#DCFCE7" : "#FEE2E2",
                            color: overviewData.kpis.winRate.up ? "#166534" : "#991B1B"
                          }}
                        >
                          {overviewData.kpis.winRate.delta}
                        </span>
                        <span className="text-[#6B6B67] text-[10px]">so với kỳ trước</span>
                      </div>
                    </div>

                    <div className="text-[#1A1A18] font-semibold text-xs border-t border-[#E8E7E2] pt-4" style={{ fontSize: 11 }}>
                      Tỷ lệ thắng là tỷ trọng phần trăm số lượng Deal chốt thành công trên tổng số Deal đã kết thúc.
                    </div>
                  </div>
                </div>

                {/* Row 4: Top deals table */}
                <TopDealsTable deals={overviewData.topDeals} />

              </div>
            )
          )
        )}

        {activeTab === "team" && (
          <TeamPerformanceTab startDate={startDate} endDate={endDate} />
        )}

        {activeTab === "pipeline" && (
          <PipelineAnalysisTab />
        )}

        {activeTab === "activity" && (
          <ActivityReportTab startDate={startDate} endDate={endDate} />
        )}

      </div>
    </div>
  );
}
