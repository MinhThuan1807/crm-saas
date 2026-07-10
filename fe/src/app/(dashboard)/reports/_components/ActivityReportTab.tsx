"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { Activity, CheckSquare } from "lucide-react";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";
import { reportsService } from "@/services/reports.service";

import { CustomTooltipProps } from "@/lib/types/chart";

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-card border border-[#E8E7E2] dark:border-border rounded-lg shadow-md px-3 py-2.5 text-xs text-left">
      <p className="text-[#1A1A18] dark:text-foreground mb-1.5" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between items-center gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-[#6B6B67] dark:text-muted-foreground">{p.name}:</span>
          </div>
          <span className="text-[#1A1A18] dark:text-foreground font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const LEGEND = [
  { color: "#534AB7", name: "Calls" },
  { color: "#7F77DD", name: "Emails" },
  { color: "#AFA9EC", name: "Meetings" },
  { color: "#1D9E75", name: "Tasks" },
];

const STATUS_COLORS: Record<string, string> = {
  "Đã xong": "#1D9E75",
  "Quá hạn": "#D85A30",
  "Đang chờ": "#FBBF24",
};

interface ActivityReportTabProps {
  startDate?: string;
  endDate?: string;
}

export function ActivityReportTab({ startDate, endDate }: ActivityReportTabProps) {
  // Query backend activities statistics
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "activities", startDate, endDate],
    queryFn: () => reportsService.getActivities({ startDate, endDate }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <span className="text-[#6B6B67] text-sm">Đang tải báo cáo hoạt động...</span>
      </div>
    );
  }

  if (!data) return null;

  // Calculate dynamic metrics from trends
  const totalCalls = data.trend.reduce((sum, item) => sum + item.Calls, 0);
  const totalMeetings = data.trend.reduce((sum, item) => sum + item.Meetings, 0);
  const totalTasks = data.trend.reduce((sum, item) => sum + item.Tasks, 0);

  // Call / Meeting ratio
  const callMeetingRatio = totalMeetings > 0 ? (totalCalls / totalMeetings).toFixed(1) : totalCalls.toString();

  // Find overdue task percentage from status distribution
  const overduePercentItem = data.statusDistribution.find(d => d.name === "Quá hạn");
  const overduePercent = overduePercentItem ? overduePercentItem.value : 0;

  const isTrendEmpty = !data.trend || data.trend.length === 0 || (totalCalls === 0 && totalMeetings === 0 && totalTasks === 0);
  const isStatusEmpty = !data.statusDistribution || data.statusDistribution.length === 0 || data.statusDistribution.every(d => d.value === 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-4 flex flex-col gap-1.5 shadow-sm">
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Tỷ lệ Gọi / Hẹn gặp</span>
          <span className="text-[#1A1A18] dark:text-foreground font-bold" style={{ fontSize: 20 }}>{callMeetingRatio} : 1</span>
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>Số cuộc gọi trung bình để có 1 cuộc hẹn</span>
        </div>
        <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-4 flex flex-col gap-1.5 shadow-sm">
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Tổng số cuộc hẹn</span>
          <span className="text-[#1A1A18] dark:text-foreground font-bold" style={{ fontSize: 20 }}>{totalMeetings}</span>
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>Tổng số cuộc họp đã tổ chức trong kỳ</span>
        </div>
        <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-4 flex flex-col gap-1.5 shadow-sm">
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Nhiệm vụ hoàn thành</span>
          <span className="text-[#1A1A18] dark:text-foreground font-bold" style={{ fontSize: 20 }}>{totalTasks}</span>
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>Số lượng đầu việc hoàn thành trong kỳ</span>
        </div>
        <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border p-4 flex flex-col gap-1.5 shadow-sm">
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>Nhiệm vụ trễ hạn (Overdue)</span>
          <span className="text-[#D85A30] font-bold" style={{ fontSize: 20 }}>{overduePercent}%</span>
          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>Cần tập trung giải quyết việc quá hạn</span>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trend Bar Chart */}
        <div className="md:col-span-2">
          <ChartCard
            title="Xu hướng hoạt động theo tháng"
            subtitle="Phân bố các loại cuộc gọi, email, họp mặt và nhiệm vụ"
            action={
              !isTrendEmpty && (
                <div className="flex items-center gap-3 mr-1">
                  {LEGEND.map((l) => (
                    <div key={l.name} className="flex items-center gap-1">
                      <div className="size-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
                      <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 11 }}>{l.name}</span>
                    </div>
                  ))}
                </div>
              )
            }
          >
            {isTrendEmpty ? (
              <EmptyState
                icon={Activity}
                title="Chưa có hoạt động"
                description="Chưa ghi nhận hoạt động (Call, Email, Meeting) nào trong khoảng thời gian này."
                height={240}
              />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.trend} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Calls" stackId="activities" name="Calls" fill="#534AB7" />
                  <Bar dataKey="Emails" stackId="activities" name="Emails" fill="#7F77DD" />
                  <Bar dataKey="Meetings" stackId="activities" name="Meetings" fill="#AFA9EC" />
                  <Bar dataKey="Tasks" stackId="activities" name="Tasks" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Task status Donut Chart */}
        <ChartCard
          title="Trạng thái nhiệm vụ"
          subtitle="Tỷ lệ hoàn thành công việc được giao"
        >
          {isStatusEmpty ? (
            <EmptyState
              icon={CheckSquare}
              title="Chưa có nhiệm vụ"
              description="Không có nhiệm vụ nào được lên lịch hoặc hoàn thành trong khoảng thời gian này."
              height={240}
            />
          ) : (
            <div className="flex flex-col items-center gap-2" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#6B6B67"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom status legend labels */}
              <div className="w-full grid grid-cols-3 gap-1 mt-1">
                {data.statusDistribution.map((d) => (
                  <div key={d.name} className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="size-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.name] || "#6B6B67" }} />
                      <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 10 }}>{d.name}</span>
                    </div>
                    <span className="text-[#1A1A18] dark:text-foreground font-bold" style={{ fontSize: 12 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
