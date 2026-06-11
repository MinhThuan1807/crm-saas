"use client";

import { useState } from "react";
import {
  Download, FileText, Calendar, ChevronDown, TrendingUp, TrendingDown,
  BarChart2, PieChart, Activity, Users,
} from "lucide-react";

import { RevenueMonthChart } from "./_components/RevenueMonthChart";
import { ForecastAreaChart }  from "./_components/ForecastAreaChart";
import { WinLossChart }       from "./_components/WinLossChart";
import { IndustryDonut }      from "./_components/IndustryDonut";
import { TopDealsTable }      from "./_components/TopDealsTable";
import { TeamPerformanceTab } from "./_components/TeamPerformanceTab";
import { PipelineAnalysisTab } from "./_components/PipelineAnalysisTab";
import { ActivityReportTab } from "./_components/ActivityReportTab";
import { dealsBySourceData, fmtTr } from "./_components/reportsData";

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
    <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4 flex flex-col gap-2.5">
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

// ── Deals by Source (custom horizontal bars) ─────────────────────────────────
function DealsBySourceCard() {
  const maxDeals = Math.max(...dealsBySourceData.map((d) => d.deals));
  const maxValue = Math.max(...dealsBySourceData.map((d) => d.value));

  return (
    <div className="bg-white rounded-[10px] border border-[#E8E7E2] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[#1A1A18]" style={{ fontSize: 13, fontWeight: 600 }}>Deals theo nguồn</h3>
          <p className="text-[#6B6B67] mt-0.5" style={{ fontSize: 11 }}>Phân phối theo kênh</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full" style={{ background: "#534AB7" }} />
            <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>Deals</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full" style={{ background: "#AFA9EC" }} />
            <span className="text-[#6B6B67]" style={{ fontSize: 10 }}>Doanh thu</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {dealsBySourceData.map((d) => (
          <div key={d.source}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>{d.source}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#1A1A18] tabular-nums" style={{ fontSize: 11, fontWeight: 600 }}>
                  {d.deals} deals
                </span>
                <span className="text-[#6B6B67] tabular-nums" style={{ fontSize: 10 }}>
                  {fmtTr(d.value)}
                </span>
              </div>
            </div>
            {/* Deal count bar */}
            <div className="h-2 bg-[#F1EFE8] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.deals / maxDeals) * 100}%`, background: "#534AB7" }}
              />
            </div>
            {/* Value bar */}
            <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.value / maxValue) * 100}%`, background: "#AFA9EC" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty tab placeholder ─────────────────────────────────────────────────────
function EmptyTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ minHeight: 480 }}>
      <div
        className="size-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "#EEEDFE" }}
      >
        <BarChart2 size={24} style={{ color: "#534AB7" }} />
      </div>
      <p className="text-[#1A1A18] mb-1.5" style={{ fontSize: 15, fontWeight: 600 }}>{title}</p>
      <p className="text-[#6B6B67]" style={{ fontSize: 13 }}>{description}</p>
      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs opacity-30 pointer-events-none select-none">
        {[80, 60, 75, 50].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2 rounded-full bg-[#534AB7]" style={{ width: `${w}%` }} />
            <div className="size-4 rounded bg-[#E8E7E2]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

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
            <span>01/01/2026 – 31/05/2026</span>
            <ChevronDown size={12} className="text-[#6B6B67]" />
          </button>

          {/* Owner filter */}
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E8E7E2] bg-white hover:bg-[#F8F8F7] transition-colors cursor-pointer"
            style={{ fontSize: 12, color: "#6B6B67" }}
          >
            <Users size={13} />
            <span>Lọc theo owner</span>
            <ChevronDown size={12} />
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
      <div className="flex-1 overflow-y-auto bg-[#F8F8F7]" style={{ padding: 24 }}>

        {activeTab === "overview" && (
          <div className="flex flex-col gap-5">

            {/* Row 1: KPI cards */}
            <div className="grid grid-cols-5 gap-4">
              <KpiCard
                label="Tổng doanh thu"
                value="820tr"
                delta="+15% YoY"
                up={true}
              />
              <KpiCard
                label="Tổng deals đóng"
                value="47"
                delta="+8"
                up={true}
                subtext="so với kỳ trước"
              />
              <KpiCard
                label="Win rate TB"
                value="34.2%"
                delta="+2.1%"
                up={true}
              />
              <KpiCard
                label="Avg deal size"
                value="17.4tr"
                delta="+5%"
                up={true}
              />
              <KpiCard
                label="Avg days to close"
                value="22 ngày"
                delta="-3 ngày"
                up={true}
              />
            </div>

            {/* Row 2: Revenue chart + Forecast chart */}
            <div className="grid grid-cols-2 gap-4">
              <RevenueMonthChart />
              <ForecastAreaChart />
            </div>

            {/* Row 3: Deals by source + Win/Loss + Industry donut */}
            <div className="grid grid-cols-3 gap-4">
              <DealsBySourceCard />
              <WinLossChart />
              <IndustryDonut />
            </div>

            {/* Row 4: Top deals table */}
            <TopDealsTable />

          </div>
        )}

        {activeTab === "team" && (
          <TeamPerformanceTab />
        )}

        {activeTab === "pipeline" && (
          <PipelineAnalysisTab />
        )}

        {activeTab === "activity" && (
          <ActivityReportTab />
        )}

      </div>
    </div>
  );
}
