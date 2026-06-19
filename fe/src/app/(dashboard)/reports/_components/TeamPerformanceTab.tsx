"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Edit2, Settings, Users } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";
import { formatVndShort, getInitials, getAvatarColors } from "@/lib/helper";
import { reportsService } from "@/services/reports.service";
import { useMe } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="text-[#1A1A18] mb-1.5" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="text-[#6B6B67]">{p.name}:</span>
          <span className="text-[#1A1A18]" style={{ fontWeight: 500 }}>{formatVndShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const LEGEND = [
  { color: "#534AB7", label: "Thực tế" },
  { color: "#AFA9EC", label: "Target" },
];

interface TeamPerformanceTabProps {
  startDate?: string;
  endDate?: string;
}

export function TeamPerformanceTab({ startDate, endDate }: TeamPerformanceTabProps) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const isAdminOrManager = me?.role === "ADMIN" || me?.role === "MANAGER";

  // Fetch real team performance data
  const { data: teamData = [], isLoading } = useQuery({
    queryKey: ["reports", "team-performance", startDate, endDate],
    queryFn: () => reportsService.getTeamPerformance({ startDate, endDate }),
  });

  // Target Update States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [targetVal, setTargetVal] = useState("0");
  const [month, setMonth] = useState(6); // default to June
  const [year, setYear] = useState(2026); // default to 2026

  // KPI Target mutation
  const updateTargetMutation = useMutation({
    mutationFn: (data: { userId: string; target: number; month: number; year: number }) =>
      reportsService.updateKpiTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Cập nhật target KPI thành công!");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cập nhật target KPI thất bại.");
    },
  });

  const handleOpenEdit = (userId: string, name: string, currentTarget: number) => {
    setEditingUserId(userId);
    setEditingUserName(name);
    // Convert target to millions for user input (currentTarget is now in raw VND, e.g. 500,000,000)
    const millionsVal = currentTarget / 1_000_000;
    setTargetVal(millionsVal.toString());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingUserId) return;
    const numericTarget = parseFloat(targetVal);
    if (isNaN(numericTarget) || numericTarget < 0) {
      toast.error("Vui lòng nhập target hợp lệ.");
      return;
    }

    // Convert from millions input to raw currency amount
    const rawTarget = numericTarget * 1_000_000;

    updateTargetMutation.mutate({
      userId: editingUserId,
      target: rawTarget,
      month,
      year,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <span className="text-[#6B6B67] text-sm">Đang tải dữ liệu hiệu suất đội ngũ...</span>
      </div>
    );
  }

  const isDataEmpty = teamData.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Chart Row */}
      <ChartCard
        title="So sánh doanh số thực tế vs Chỉ tiêu"
        subtitle="Doanh số đạt được so với chỉ tiêu giao cho từng thành viên trong kỳ"
        action={
          !isDataEmpty && (
            <div className="flex items-center gap-3 mr-1">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
                  <span className="text-[#6B6B67]" style={{ fontSize: 11 }}>{l.label}</span>
                </div>
              ))}
            </div>
          )
        }
      >
        {isDataEmpty ? (
          <EmptyState
            icon={Users}
            title="Chưa có dữ liệu hiệu suất"
            description="Chưa có thông tin doanh số thực tế và chỉ tiêu cho từng thành viên trong khoảng thời gian này."
            height={240}
          />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6B67" }} axisLine={false} tickLine={false} tickFormatter={formatVndShort} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" name="Thực tế" fill="#534AB7" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="target" name="Target" fill="#AFA9EC" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Table Row */}
      <div className="bg-white rounded-[10px] border border-[#E8E7E2] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E8E7E2] flex items-center justify-between">
          <div>
            <h3 className="text-[#1A1A18]" style={{ fontSize: 13, fontWeight: 600 }}>Chi tiết chỉ số hiệu suất</h3>
            <p className="text-[#6B6B67] mt-0.5" style={{ fontSize: 11 }}>Đo lường chi tiết năng lực bán hàng và tần suất hoạt động</p>
          </div>
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
              {isDataEmpty ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#6B6B67] text-xs">
                    Không tìm thấy dữ liệu hiệu suất của nhân viên nào.
                  </td>
                </tr>
              ) : (
                teamData.map((row) => {
                  const ratio = row.target > 0 ? ((row.actual / row.target) * 100).toFixed(0) : "0";
                  return (
                    <tr key={row.userId} className="border-b border-[#E8E7E2] last:border-0 hover:bg-[#F8F8F7] transition-colors">
                      {/* User Profile */}
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              background: getAvatarColors(row.userId).bg,
                              color: getAvatarColors(row.userId).color,
                            }}
                          >
                            {getInitials(row.name)}
                          </div>
                          <span className="text-[#1A1A18] font-medium" style={{ fontSize: 12 }}>
                            {row.name}
                          </span>
                        </div>
                      </td>
                      {/* Actual */}
                      <td className="p-3 text-[#1A1A18] text-right font-medium tabular-nums" style={{ fontSize: 12 }}>
                        {formatVndShort(row.actual)}
                      </td>
                      {/* Target */}
                      <td className="p-3 text-[#6B6B67] text-right tabular-nums" style={{ fontSize: 12 }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatVndShort(row.target)}</span>
                          {isAdminOrManager && (
                            <button
                              onClick={() => handleOpenEdit(row.userId, row.name, row.target)}
                              className="p-1 hover:bg-[#EEEDFE] rounded text-[#534AB7] hover:text-[#4840A0] transition-colors cursor-pointer"
                              title="Chỉnh sửa KPI Target"
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Target Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: 14, fontWeight: 600 }}>Thiết lập chỉ tiêu KPI</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nhân viên</Label>
              <Input
                value={editingUserName}
                disabled
                className="col-span-3 text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Thời gian</Label>
              <div className="col-span-3 flex gap-2">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground shrink-0">Tháng</span>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value) || 6)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground shrink-0">Năm</span>
                  <Input
                    type="number"
                    min={2020}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Chỉ tiêu (triệu VND)</Label>
              <Input
                type="number"
                min={0}
                value={targetVal}
                onChange={(e) => setTargetVal(e.target.value)}
                className="col-span-3 text-xs h-9"
                placeholder="Ví dụ: 500 (tương đương 500 triệu)"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-8"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateTargetMutation.isPending}
              style={{ background: "#534AB7" }}
              className="text-xs h-8 text-white"
            >
              {updateTargetMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
