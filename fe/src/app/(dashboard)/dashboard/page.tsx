"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus, Wallet, GitBranch, Target, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/useAuth";
import { useAbility } from "@/hooks/useAbility";
import { dashboardService } from "@/services/dashboard.service";
import { DashboardPeriod } from "@/lib/validations/dashboard.schema";
import { formatVndShort } from "@/lib/helper";

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("quarter");
  const { data: me } = useMe();
  const { can } = useAbility();

  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", period],
    queryFn: () => dashboardService.getDashboardData(period),
    retry: false,
  });

  const isForbidden = isError && (error as any)?.response?.status === 403;

  const canCreateDeal = can("create", "Deal");
  const canReadReport = can("read", "Report");
  const canViewLeaderboard = can("read", "Report", { view: "team" });
  const canReadActivity = can("read", "Activity");

  const formatDateVi = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const date = new Date();
    return `${days[date.getDay()]}, ${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
  };

  if (isForbidden) {
    return (
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-3">
          <h1
            className="text-foreground tracking-tight"
            style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}
          >
            Dashboard
          </h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-6 bg-[#F8F8F7] dark:bg-background">
          <div className="max-w-md w-full text-center bg-background border border-border rounded-xl p-8 shadow-sm space-y-4">
            <div className="mx-auto size-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
              <Lock className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Bạn không có quyền truy cập</h2>
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn chưa được cấp quyền xem dữ liệu trên Dashboard. Vui lòng liên hệ với Quản trị viên để biết thêm chi tiết.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-3">
        <h1
          className="text-foreground tracking-tight"
          style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}
        >
          Dashboard
        </h1>

        <div className="flex items-center gap-2">
          {/* Period tabs */}
          <Tabs value={period} onValueChange={(val) => setPeriod(val as DashboardPeriod)}>
            <TabsList className="h-8 gap-0 p-0.5">
              <TabsTrigger value="week"    className="h-7 px-3 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tuần này</TabsTrigger>
              <TabsTrigger value="month"   className="h-7 px-3 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tháng này</TabsTrigger>
              <TabsTrigger value="quarter" className="h-7 px-3 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Quý này</TabsTrigger>
            </TabsList>
          </Tabs>

          {(canReadReport || canCreateDeal) && <Separator orientation="vertical" className="h-5 mx-0.5" />}

          {canReadReport && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
            >
              <Download className="size-3.5" />
              Xuất báo cáo
            </Button>
          )}

          {canCreateDeal && (
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Thêm deal
            </Button>
          )}
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8F8F7] dark:bg-background">

        {/* Welcome strip */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            Chào buổi sáng,{" "}
            <strong className="text-foreground" style={{ fontWeight: 600 }}>
              {me?.name || "Nguyễn Minh"}
            </strong>{" "}
            👋
          </p>
          <span
            className="text-muted-foreground bg-background border border-border rounded-md px-2.5 py-1"
            style={{ fontSize: 11 }}
          >
            {formatDateVi()}
          </span>
        </div>

        {/* ── Metric cards ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-background border border-border/70 rounded-xl p-5 space-y-3 shadow-none">
                <Skeleton className="h-3.5 w-24 rounded" />
                <div className="flex items-end gap-2">
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-4.5 w-10 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : (
          dashboardData && (
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                label={dashboardData.metrics.totalDealValue.label}
                value={formatVndShort(dashboardData.metrics.totalDealValue.value)}
                trend={
                  dashboardData.metrics.totalDealValue.trend
                    ? {
                        value: `${dashboardData.metrics.totalDealValue.trend.value >= 0 ? "+" : ""}${dashboardData.metrics.totalDealValue.trend.value}%`,
                        positive: dashboardData.metrics.totalDealValue.trend.positive,
                      }
                    : undefined
                }
                subtext={dashboardData.metrics.totalDealValue.subtext}
                icon={Wallet}
              />
              <MetricCard
                label={dashboardData.metrics.openDeals.label}
                value={String(dashboardData.metrics.openDeals.value)}
                trend={
                  dashboardData.metrics.openDeals.trend
                    ? {
                        value: `${dashboardData.metrics.openDeals.trend.value >= 0 ? "+" : ""}${dashboardData.metrics.openDeals.trend.value} ${period === "week" ? "tuần này" : period === "quarter" ? "quý này" : "tháng này"}`,
                        positive: dashboardData.metrics.openDeals.trend.positive,
                      }
                    : undefined
                }
                subtext={dashboardData.metrics.openDeals.subtext}
                icon={GitBranch}
              />
              <MetricCard
                label={dashboardData.metrics.winRate.label}
                value={`${dashboardData.metrics.winRate.value}%`}
                trend={
                  dashboardData.metrics.winRate.trend
                    ? {
                        value: `${dashboardData.metrics.winRate.trend.value >= 0 ? "+" : ""}${dashboardData.metrics.winRate.trend.value}%`,
                        positive: dashboardData.metrics.winRate.trend.positive,
                      }
                    : undefined
                }
                subtext={dashboardData.metrics.winRate.subtext}
                icon={Target}
                iconBg="#FEE2E2"
                iconColor="#A32D2D"
              />
              <MetricCard
                label={dashboardData.metrics.monthlyRevenue.label}
                value={formatVndShort(dashboardData.metrics.monthlyRevenue.value)}
                icon={TrendingUp}
                progress={dashboardData.metrics.monthlyRevenue.progress}
              />
            </div>
          )
        )}

        {/* ── Charts row ───────────────────────────────────────────────────── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: canViewLeaderboard ? "3fr 2fr" : "1fr", minHeight: 340 }}>
          <PipelineChart
            stages={dashboardData?.pipelineFunnel.stages}
            totalCount={dashboardData?.pipelineFunnel.totalCount}
            totalValue={dashboardData?.pipelineFunnel.totalValue}
            isLoading={isLoading}
          />
          {canViewLeaderboard && (
            <Leaderboard reps={dashboardData?.leaderboard} isLoading={isLoading} />
          )}
        </div>

        {/* ── Bottom row ───────────────────────────────────────────────────── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: canReadActivity ? "3fr 2fr" : "1fr" }}>
          <RecentDeals deals={dashboardData?.recentDeals} isLoading={isLoading} />
          {canReadActivity && (
            <UpcomingActivities activities={dashboardData?.upcomingActivities} isLoading={isLoading} />
          )}
        </div>

      </main>
    </div>
  );
}
