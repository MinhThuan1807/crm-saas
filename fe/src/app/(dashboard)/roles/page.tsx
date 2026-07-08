"use client";
import React from "react";
import { ShieldCheck, UserCheck, Users } from "lucide-react";

const rolesData = [
  {
    role: "ADMIN",
    description: "Toàn quyền quản trị workspace",
    icon: ShieldCheck,
    color: "#EF4444",
    bgColor: "#FEF2F2",
    permissions: [
      "Quản lý toàn bộ thông tin công ty và cài đặt tenant",
      "Quản lý (thêm/xóa/sửa vai trò) thành viên",
      "Tạo, cập nhật và xóa tất cả Deal, Contact và Hoạt động",
      "Xem toàn bộ báo cáo doanh thu và KPI của công ty",
      "Xem Nhật ký hoạt động chi tiết (Audit Logs)",
    ],
  },
  {
    role: "MANAGER",
    description: "Quản lý luồng bán hàng và đội nhóm",
    icon: UserCheck,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    permissions: [
      "Xem danh sách thành viên trong workspace",
      "Xem và cập nhật tất cả Deal, Contact của workspace",
      "Thiết lập KPI mục tiêu cho nhân viên bán hàng",
      "Xem báo cáo và phân tích dữ liệu bán hàng",
      "Xem Nhật ký hoạt động (Audit Logs)",
    ],
  },
  {
    role: "SALES_REP",
    description: "Đại diện bán hàng trực tiếp",
    icon: Users,
    color: "#10B981",
    bgColor: "#ECFDF5",
    permissions: [
      "Chỉ xem và cập nhật Deal, Contact do mình sở hữu",
      "Tự lên lịch hoạt động (gọi điện, email, họp) với khách hàng",
      "Xem báo cáo doanh số cá nhân",
      "Không có quyền truy cập nhóm quản trị (Administration)",
    ],
  },
];

export default function RolesPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="h-14 shrink-0 border-b flex items-center px-6">
        <h1 className="text-[#1A1A18] text-sm font-semibold tracking-tight">Workspace Roles</h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#F8F8F7] p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rolesData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.role} className="bg-background border border-border/70 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.bgColor, color: item.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[#1A1A18]">{item.role}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                
                <hr className="border-border/50" />

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#868E96] uppercase tracking-wider block">Quyền hạn</span>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs text-[#495057]">
                    {item.permissions.map((p, idx) => (
                      <li key={idx} className="leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
