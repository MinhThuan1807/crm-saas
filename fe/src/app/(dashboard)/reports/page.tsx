"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, FileText, Calendar, ChevronDown, TrendingUp, TrendingDown,
  BarChart2, PieChart, Activity, Users, Lock,
} from "lucide-react";
import Link from "next/link";
import { useAbility } from "@/hooks/useAbility";
import { useMe } from "@/hooks/useAuth";

import { RevenueMonthChart } from "./_components/RevenueMonthChart";
import { ForecastAreaChart }  from "./_components/ForecastAreaChart";
import { WinLossChart }       from "./_components/WinLossChart";
import { TopDealsTable }      from "./_components/TopDealsTable";
import { TeamPerformanceTab } from "./_components/TeamPerformanceTab";
import { PipelineAnalysisTab } from "./_components/PipelineAnalysisTab";
import { ActivityReportTab } from "./_components/ActivityReportTab";
import { reportsService } from "@/services/reports.service";
import { formatVndShort } from "@/lib/helper";

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
    <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-4 flex flex-col gap-2.5 shadow-sm">
      <p className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>{label}</p>
      <p className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
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
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>{subtext}</span>
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

  const { data: me, isLoading: isLoadingMe } = useMe();
  const { can } = useAbility();

  const visibleTabs = TABS.filter((tab) => {
    return can("read", "Report", { view: tab.value });
  });

  const hasPermission = visibleTabs.length > 0;

  const isTabRestricted = !can("read", "Report", { view: activeTab });

  const isRedirecting = !isLoadingMe && !visibleTabs.some((t) => t.value === activeTab);

  useEffect(() => {
    if (isLoadingMe) return;
    const isCurrentTabVisible = visibleTabs.some((t) => t.value === activeTab);
    if (!isCurrentTabVisible && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].value);
    }
  }, [activeTab, visibleTabs, isLoadingMe]);

  // Fetch overview analytics
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError
  } = useQuery({
    queryKey: ["reports", "overview", startDate, endDate],
    queryFn: () => reportsService.getOverview({ startDate, endDate }),
    enabled: activeTab === "overview" && hasPermission && !isTabRestricted,
  });

  const isForbidden = isOverviewError && (overviewError as any)?.response?.status === 403;

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F8F8F7] dark:bg-background">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 border-b border-[#E8E7E2] dark:border-border bg-white dark:bg-card flex items-center justify-between px-6 gap-4"
        style={{ height: 64 }}
      >
        <div>
          <h1 className="text-[#1A1A18] dark:text-foreground tracking-tight" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>
            Reports
          </h1>
          <p className="text-[#6B6B67] dark:text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            Phân tích &amp; Báo cáo chuyên sâu
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Date range pill */}
          <button
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[#E8E7E2] dark:border-border bg-white dark:bg-card hover:bg-[#F8F8F7] dark:hover:bg-muted transition-colors cursor-pointer"
            style={{ fontSize: 12, color: "var(--foreground)" }}
          >
            <Calendar size={13} className="text-[#6B6B67] dark:text-muted-foreground" />
            <span>01/01/2026 – 31/12/2026</span>
            <ChevronDown size={12} className="text-[#6B6B67] dark:text-muted-foreground" />
          </button>

          {/* Export CSV */}
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E8E7E2] dark:border-border bg-white dark:bg-card hover:bg-[#F8F8F7] dark:hover:bg-muted transition-colors cursor-pointer"
            style={{ fontSize: 12, color: "var(--muted-foreground)" }}
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
        className="shrink-0 bg-white dark:bg-card border-b border-[#E8E7E2] dark:border-border flex items-end px-6 gap-0"
        style={{ height: 44 }}
      >
        {visibleTabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-1.5 px-4 h-full relative cursor-pointer transition-colors"
              style={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
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

        {isLoadingMe || isRedirecting ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <span className="text-[#6B6B67] text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : !hasPermission || isForbidden ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-card border border-[#E8E7E2] dark:border-border rounded-[12px] p-8 shadow-sm">
            <div className="size-16 rounded-full bg-[#FEE2E2] dark:bg-destructive/10 text-[#EF4444] flex items-center justify-center mb-5 animate-pulse">
              <Lock size={28} />
            </div>
            <h3 className="text-[#1A1A18] dark:text-foreground font-bold text-lg mb-2">
              Không có quyền truy cập
            </h3>
            <p className="text-[#6B6B67] dark:text-muted-foreground text-sm text-center max-w-sm mb-6 leading-relaxed">
              Bạn không có quyền xem trang Báo cáo. Vui lòng liên hệ với Quản trị viên để được phân quyền truy cập.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#534AB7] hover:bg-[#4840A0] transition-colors rounded-[8px] no-underline shadow-sm"
            >
              Quay lại Trang chủ
            </Link>
          </div>
        ) : (
          <>
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
                        value={formatVndShort(overviewData.kpis.totalRevenue.value)}
                        delta={overviewData.kpis.totalRevenue.delta}
                        up={overviewData.kpis.totalRevenue.up}
                      />
                      <KpiCard
                        label="Tổng deals đóng"
                        value={String(overviewData.kpis.closedDeals.value)}
                        delta={overviewData.kpis.closedDeals.delta}
                        up={overviewData.kpis.closedDeals.up}
                      />
                      <KpiCard
                        label="Win rate TB"
                        value={`${overviewData.kpis.winRate.value}%`}
                        delta={overviewData.kpis.winRate.delta}
                        up={overviewData.kpis.winRate.up}
                      />
                      <KpiCard
                        label="Avg deal size"
                        value={formatVndShort(overviewData.kpis.avgDealSize.value)}
                        delta={overviewData.kpis.avgDealSize.delta}
                        up={overviewData.kpis.avgDealSize.up}
                      />
                      <KpiCard
                        label="Avg days to close"
                        value={`${overviewData.kpis.avgDaysToClose.value} ngày`}
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
                        <WinLossChart data={overviewData.winLossData} />
                      </div>
                      <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-5 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[#1A1A18] dark:text-foreground font-bold text-xs" style={{ fontSize: 13 }}>Tỷ lệ chốt Sales</h4>
                          <p className="text-[#6B6B67] dark:text-muted-foreground mt-1.5" style={{ fontSize: 11 }}>
                            Thống kê tỷ lệ thắng (Win) và thua (Loss) của các Deal đã đóng trong kỳ.
                          </p>
                        </div>
                        
                        {/* Display actual KPI Win Rate to fill center space */}
                        <div className="flex flex-col items-center justify-center py-6">
                          <span className="text-[#534AB7] dark:text-primary text-4xl font-bold tracking-tight">
                            {overviewData.kpis.winRate.value}%
                          </span>
                          <span className="text-[#6B6B67] dark:text-muted-foreground mt-1" style={{ fontSize: 11 }}>
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
                            <span className="text-[#6B6B67] dark:text-muted-foreground text-[10px]">so với kỳ trước</span>
                          </div>
                        </div>

                        <div className="text-[#1A1A18] dark:text-foreground font-semibold text-xs border-t border-[#E8E7E2] dark:border-border pt-4" style={{ fontSize: 11 }}>
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
          </>
        )}
      </div>
    </div>
  );
}
