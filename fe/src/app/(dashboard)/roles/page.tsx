"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, Users, Edit2, Loader2, Pencil, Trash2, Plus, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { useMe } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const getRoleIcon = (name: string) => {
  if (name === "ADMIN") return { icon: ShieldCheck, color: "#EF4444", bgColor: "#FEF2F2" };
  if (name === "MANAGER") return { icon: UserCheck, color: "#3B82F6", bgColor: "#EFF6FF" };
  return { icon: Users, color: "#10B981", bgColor: "#ECFDF5" };
};

const formatAction = (action: string) => {
  const map: Record<string, string> = {
    create: "Thêm",
    read: "Xem",
    update: "Sửa",
    delete: "Xóa",
    manage: "Toàn quyền",
  };
  return map[action] || action;
};

const formatSubject = (subject: string) => {
  const map: Record<string, string> = {
    Contact: "Liên hệ",
    Deal: "Cơ hội (Deal)",
    Task: "Nhiệm vụ",
    Activity: "Hoạt động",
    User: "Thành viên",
    all: "Hệ thống",
  };
  return map[subject] || subject;
};

// Hàm tóm tắt gộp quyền theo subject để tối ưu không gian hiển thị trên card
const getGroupedPermissionsText = (rolePermissions: any[]) => {
  const hasManageAll = rolePermissions.some((p) => p.action === "manage" && p.subject === "all");
  if (hasManageAll) {
    return ["Toàn quyền hệ thống (manage:all)"];
  }

  const groups: Record<string, string[]> = {};
  rolePermissions.forEach((p) => {
    if (!groups[p.subject]) groups[p.subject] = [];
    const actionMap: Record<string, string> = {
      create: "Thêm",
      read: "Xem",
      update: "Sửa",
      delete: "Xóa",
      manage: "Toàn quyền",
    };
    groups[p.subject].push(actionMap[p.action] || p.action);
  });

  return Object.entries(groups).map(([subject, actions]) => {
    const subjectLabel = formatSubject(subject);
    const actionsList = actions.join(", ");
    return `${subjectLabel}: ${actionsList}`;
  });
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = me?.role === "ADMIN";

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles, refetch: refetchRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: usersService.getRoles,
  });

  const { data: allPermissions = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ["permissions"],
    queryFn: usersService.getPermissions,
  });

  // State quản trị quyền
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);

  // State CRUD Role
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [editingRoleDesc, setEditingRoleDesc] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<any>(null);

  // Matrix Configuration
  const subjects = ['Contact', 'Deal', 'Task', 'Activity', 'User', 'all'];
  const actions = ['read', 'create', 'update', 'delete', 'manage'];

  // Mutations
  const updatePermsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      usersService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success("Cập nhật quyền hạn thành công!");
      setIsPermDialogOpen(false);
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại.";
      toast.error(msg);
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      usersService.createRole(data),
    onSuccess: () => {
      toast.success("Tạo vai trò mới thành công!");
      setIsCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      refetchRoles();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Không thể tạo vai trò.";
      toast.error(msg);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: { name: string; description?: string } }) =>
      usersService.updateRole(roleId, data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin vai trò thành công!");
      setIsEditOpen(false);
      setEditingRole(null);
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Không thể cập nhật vai trò.";
      toast.error(msg);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => usersService.deleteRole(roleId),
    onSuccess: () => {
      toast.success("Đã xóa vai trò thành công!");
      setIsDeleteOpen(false);
      setDeletingRole(null);
      refetchRoles();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Không thể xóa vai trò này.";
      toast.error(msg);
    },
  });

  // Handlers
  const handleEditPermsClick = (role: any) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions.map((p: any) => p.id));
    setIsPermDialogOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePerms = () => {
    if (!selectedRole) return;
    updatePermsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermIds,
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }
    createRoleMutation.mutate({
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
    });
  };

  const handleEditRoleClick = (role: any) => {
    setEditingRole(role);
    setEditingRoleName(role.name);
    setEditingRoleDesc(role.description || "");
    setIsEditOpen(true);
  };

  const handleSaveRole = () => {
    if (!editingRole) return;
    if (!editingRoleName.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }
    updateRoleMutation.mutate({
      roleId: editingRole.id,
      data: {
        name: editingRoleName.trim(),
        description: editingRoleDesc.trim(),
      },
    });
  };

  const handleDeleteRoleClick = (role: any) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate(deletingRole.id);
  };

  if (isLoadingRoles || isLoadingPerms) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-sm text-muted-foreground">Đang tải cấu hình vai trò...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-6 bg-background">
        <h1 className="text-[#1A1A18] text-sm font-semibold tracking-tight">Workspace Roles</h1>
        {isAdmin && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-8 text-xs gap-1.5 bg-[#534AB7] hover:bg-[#4840A0] text-white rounded-[8px]"
          >
            <Plus size={14} />
            Tạo vai trò mới
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto bg-[#F8F8F7] p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {roles.map((item: any) => {
            const { icon: Icon, color, bgColor } = getRoleIcon(item.name);
            const isSystemRole = ["ADMIN", "MANAGER", "SALES_REP"].includes(item.name);
            const summarizedPermissions = getGroupedPermissionsText(item.permissions);

            return (
              <div key={item.id} className="bg-background border border-border/70 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between" style={{ minHeight: 280 }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bgColor, color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-[#1A1A18] flex items-center gap-1.5">
                          {item.name}
                          {isSystemRole && (
                            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                              Hệ thống
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.description || `Vai trò ${item.name}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/50" />

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#868E96] uppercase tracking-wider block">
                      Quyền hạn ({item.permissions.length})
                    </span>
                    {item.name === "ADMIN" ? (
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-primary font-medium">
                        <li>Sở hữu quyền quản trị tối cao (manage:all)</li>
                        <li>Được phép truy cập mọi chức năng cấu hình hệ thống</li>
                      </ul>
                    ) : item.permissions.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic block">Chưa có quyền nào được gán</span>
                    ) : (
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-[#495057] leading-relaxed">
                        {summarizedPermissions.map((txt, idx) => (
                          <li key={idx}>
                            {txt.includes("manage:all") ? (
                              <strong className="text-primary">{txt}</strong>
                            ) : (
                              <span>{txt}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 flex gap-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs h-9 gap-1.5 text-[#534AB7] border-[#534AB7]/20 hover:bg-[#EEEDFE] hover:text-[#534AB7]"
                      onClick={() => handleEditPermsClick(item)}
                      disabled={item.name === "ADMIN"}
                    >
                      <Lock size={13} />
                      Phân quyền
                    </Button>

                    {!isSystemRole && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 shrink-0 text-[#6B6B67] hover:bg-[#EEEDFE] hover:text-[#534AB7] border-border/70"
                          onClick={() => handleEditRoleClick(item)}
                          title="Sửa vai trò"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 shrink-0 text-[#6B6B67] hover:bg-[#FEE2E2] hover:text-[#A32D2D] border-border/70"
                          onClick={() => handleDeleteRoleClick(item)}
                          title="Xóa vai trò"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Dialog: Chỉnh sửa các quyền hạn (Giao diện Ma trận Bảng tối giản) */}
      <Dialog open={isPermDialogOpen} onOpenChange={setIsPermDialogOpen}>
        <DialogContent className="md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col p-0 rounded-[10px] overflow-hidden bg-background">
          <DialogHeader className="p-6 border-b shrink-0 bg-background">
            <DialogTitle>Thiết lập quyền hạn: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Nhấp vào bất kỳ ô nào trên bảng để bật/tắt quyền tương ứng. Biểu tượng khóa (<span className="text-amber-600 font-semibold">🔒</span>) thể hiện quyền tự động áp dụng bộ lọc chỉ cho phép thao tác trên dữ liệu do chính thành viên đó sở hữu.
            </DialogDescription>
          </DialogHeader>

          {/* Body bọc scroll area ma trận quyền hạn */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[50vh]">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-background">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75">
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Tài nguyên</th>
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[15%]">Xem</th>
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[15%]">Thêm</th>
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[15%]">Sửa</th>
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[15%]">Xóa</th>
                    <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[15%]">Toàn quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((subj) => (
                    <tr key={subj} className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-slate-700 bg-slate-50/10 border-b border-slate-100">
                        {formatSubject(subj)}
                      </td>
                      {actions.map((act) => {
                        const perm = allPermissions.find(p => p.subject === subj && p.action === act);
                        if (!perm) {
                          return <td key={act} className="p-4 text-center text-slate-300 text-xs font-semibold border-b border-slate-100">—</td>;
                        }
                        const isChecked = selectedPermIds.includes(perm.id);
                        const isABAC = selectedRole?.name === 'SALES_REP' && 
                          (subj === 'Contact' || subj === 'Deal' || subj === 'Activity' || subj === 'Task') && 
                          (act === 'read' || act === 'update' || act === 'delete');

                        return (
                          <td
                            key={act}
                            className="p-4 text-center align-middle border-b border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors"
                            onClick={() => handleTogglePermission(perm.id)}
                          >
                            <div className="flex items-center justify-center gap-1.5 pointer-events-none">
                              <Checkbox
                                checked={isChecked}
                                readOnly
                              />
                              {isABAC && isChecked && (
                                <span className="text-amber-500 text-xs shrink-0 select-none" title="Chỉ áp dụng đối với dữ liệu sở hữu">
                                  🔒
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-6 border-t shrink-0 flex items-center justify-end gap-2 bg-[#F8F8F7]">
            <Button variant="ghost" onClick={() => setIsPermDialogOpen(false)} disabled={updatePermsMutation.isPending}>
              Hủy bỏ
            </Button>
            <Button onClick={handleSavePerms} disabled={updatePermsMutation.isPending} className="gap-1.5 bg-[#534AB7] hover:bg-[#4840A0] text-white">
              {updatePermsMutation.isPending && <Loader2 className="animate-spin" size={14} />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tạo vai trò mới */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 rounded-[10px] overflow-hidden" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E7E2]">
            <DialogTitle className="text-[#1A1A18]" style={{ fontSize: 16, fontWeight: 600 }}>
              Tạo vai trò mới
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Tên vai trò (Viết liền, không dấu, in hoa)</Label>
              <Input
                type="text"
                placeholder="Ví dụ: SUPPORT, TELEMARKETER"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
                style={{ fontSize: 13 }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Mô tả vai trò</Label>
              <Input
                type="text"
                placeholder="Nhập mô tả nhiệm vụ của vai trò..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 rounded-[10px] border-[#E8E7E2] text-[#6B6B67] hover:bg-[#F8F8F7]" style={{ fontSize: 13 }}>Hủy</Button>
            <Button
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
              className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white"
              style={{ fontSize: 13 }}
            >
              {createRoleMutation.isPending ? "Đang tạo..." : "Xác nhận tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Sửa thông tin vai trò (Tên/Mô tả) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 rounded-[10px] overflow-hidden" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E7E2]">
            <DialogTitle className="text-[#1A1A18]" style={{ fontSize: 16, fontWeight: 600 }}>
              Chỉnh sửa vai trò
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Tên vai trò (Viết liền, không dấu, in hoa)</Label>
              <Input
                type="text"
                value={editingRoleName}
                onChange={(e) => setEditingRoleName(e.target.value)}
                className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
                style={{ fontSize: 13 }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Mô tả vai trò</Label>
              <Input
                type="text"
                value={editingRoleDesc}
                onChange={(e) => setEditingRoleDesc(e.target.value)}
                className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 rounded-[10px] border-[#E8E7E2] text-[#6B6B67] hover:bg-[#F8F8F7]" style={{ fontSize: 13 }}>Hủy</Button>
            <Button
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending}
              className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white"
              style={{ fontSize: 13 }}
            >
              {updateRoleMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Xác nhận Xóa vai trò */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A18]" style={{ fontSize: 15, fontWeight: 600 }}>
              Xóa vai trò: {deletingRole?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-[#6B6B67]" style={{ fontSize: 13 }}>
              Bạn có chắc chắn muốn xóa vai trò này? Mọi liên kết quyền hạn của vai trò sẽ bị hủy bỏ vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 rounded-[10px] border-[#E8E7E2] text-[#6B6B67] hover:bg-[#F8F8F7]" style={{ fontSize: 13 }}>Hủy bỏ</Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteRoleMutation.isPending}
              className="h-9 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white"
              style={{ fontSize: 13 }}
            >
              {deleteRoleMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
