"use client";

import { useState, useEffect } from "react";
import {
  Plus, MailOpen, Search, Clock, RefreshCw, X, Pencil, Trash2,
  Crown, BarChart2 as ChartIcon, Info,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button }                  from "@/components/ui/button";
import { Input }                   from "@/components/ui/input";
import { Label }                   from "@/components/ui/label";
import { Textarea }                from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

import { useGetUsers, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { useGetInvitations, useCreateInvitation } from "@/hooks/useInvitations";
import { useQuery } from "@tanstack/react-query";
import { usersService, RoleDto } from "@/services/users.service";

import { cn } from "@/lib/utils";

// ── Types & data ──────────────────────────────────────────────────────────────
type MemberRole   = string;
type MemberStatus = "active" | "pending";

const formatRoleDisplayName = (name: string) => {
  if (name === "ADMIN") return "Admin";
  if (name === "MANAGER") return "Manager";
  if (name === "SALES_REP") return "Sales Rep";
  return name;
};

interface Member {
  id: string;
  initials: string; bg: string; color: string;
  name: string; email: string;
  role: MemberRole; status: MemberStatus;
  joinedAt: string; lastSeen: string;
  isYou?: boolean;
}

function RoleBadge({ role, status }: { role: MemberRole; status: MemberStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAEEDA] dark:bg-amber-950/20 text-[#854F0B] dark:text-amber-400 font-semibold" style={{ fontSize: 11 }}>
        <Clock size={10} />
        Mời chờ
      </span>
    );
  }
  return role === "ADMIN" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EEEDFE] dark:bg-secondary text-[#534AB7] dark:text-primary font-semibold" style={{ fontSize: 11 }}>
      Admin
    </span>
  ) : role === "SALES_REP" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E6F1FB] dark:bg-blue-950/20 text-[#185FA5] dark:text-blue-400 font-semibold" style={{ fontSize: 11 }}>
      Sales Rep
    </span>
  ) : role === "MANAGER" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFF5EE] dark:bg-amber-950/20 text-[#854F0B] dark:text-amber-400 font-semibold" style={{ fontSize: 11 }}>
      Manager
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EBFDF5] dark:bg-green-950/20 text-[#107C41] dark:text-green-400 font-semibold" style={{ fontSize: 11 }}>
      {role}
    </span>
  );
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState<string>("SALES_REP");
  const [message, setMessage] = useState("");

  const createMutation = useCreateInvitation();

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: usersService.getRoles,
  });

  useEffect(() => {
    if (roles.length > 0 && !roles.some((r: RoleDto) => r.name === role)) {
      const defaultRole = roles.find((r: RoleDto) => r.name === "SALES_REP") || roles[0];
      setRole(defaultRole.name);
    }
  }, [roles, role]);

  const handleSend = async () => {
    if (!email.trim()) return;
    try {
      await createMutation.mutateAsync({ email, role });
      setEmail("");
      onClose();
    } catch {
      // Managed by query hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-[10px] overflow-hidden bg-white dark:bg-card border dark:border-border" aria-describedby={undefined}>

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E7E2] dark:border-border">
          <DialogTitle className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 16, fontWeight: 600 }}>
            Mời thành viên mới
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Địa chỉ email</Label>
            <Input
              type="email"
              placeholder="email@congtyabc.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Role radio cards */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Vai trò</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v)}
              className="gap-2"
            >
              {roles.map((r: RoleDto) => {
                const isSelected = role === r.name;
                const Icon = r.name === "ADMIN" ? Crown : r.name === "MANAGER" ? ChartIcon : Info;
                return (
                  <label
                    key={r.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-[10px] border cursor-pointer transition-all",
                      isSelected
                        ? "border-[#534AB7] dark:border-primary bg-[#EEEDFE] dark:bg-secondary text-[#534AB7] dark:text-primary"
                        : "border-[#E8E7E2] dark:border-border bg-white dark:bg-muted text-[#1A1A18] dark:text-foreground"
                    )}
                  >
                    <RadioGroupItem value={r.name} className="mt-0.5 shrink-0 border-[#534AB7] text-[#534AB7]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon size={14} className={isSelected ? "text-[#534AB7] dark:text-primary" : "text-[#6B6B67] dark:text-muted-foreground"} />
                        <p className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>
                          {formatRoleDisplayName(r.name)}
                        </p>
                      </div>
                      <p className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>
                        {r.description || `Vai trò ${r.name} trong hệ thống.`}
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>
              Tin nhắn{" "}
              <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontWeight: 400 }}>(tùy chọn)</span>
            </Label>
            <Textarea
              placeholder="Nhắn gửi thêm..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7] resize-none"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 flex-row items-center justify-between gap-0">
          <p className="flex items-center gap-1.5 text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>
            <Info size={12} />
            Lời mời có hiệu lực trong 7 ngày.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#6B6B67] dark:text-muted-foreground hover:bg-[#F8F8F7] dark:hover:bg-muted hover:text-[#1A1A18] dark:hover:text-foreground"
              style={{ fontSize: 13 }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSend}
              disabled={createMutation.isPending}
              className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white"
              style={{ fontSize: 13 }}
            >
              {createMutation.isPending ? "Đang gửi..." : "Gửi lời mời"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function MembersRoles() {
  const [showInvite, setShowInvite] = useState(false);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useGetUsers();
  const { data: invitations } = useGetInvitations();

  const activeUsers = users || [];
  const pendingInvitations = (invitations || []).filter((i) => i.status === "PENDING");

  const membersList: Member[] = activeUsers.map((u, index) => {
    const roleMapped = u.role;
    const initials = u.name
      ? u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";
    
    const colorPalette = [
      { bg: "#EEEDFE", color: "#534AB7" },
      { bg: "#D4E8F5", color: "#1A5C7A" },
      { bg: "#F5D4D4", color: "#7A1A1A" },
      { bg: "#F5E8D4", color: "#7A4A1A" },
      { bg: "#D4F5E0", color: "#1A7A3C" },
      { bg: "#EDD4F5", color: "#5A1A7A" },
    ];
    const hash = u.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colorStyle = colorPalette[hash % colorPalette.length];

    return {
      id: u.id,
      initials,
      bg: colorStyle.bg,
      color: colorStyle.color,
      name: u.name,
      email: u.email,
      role: roleMapped,
      status: "active" as const,
      joinedAt: "Đang hoạt động",
      lastSeen: "Vừa mới đây",
    };
  });

  const filtered = membersList.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchRole   =
      roleFilter === "all"       ? true :
      roleFilter === "admin"     ? m.role === "Admin" :
      roleFilter === "manager"    ? m.role === "Manager" :
      roleFilter === "salesrep"  ? m.role === "Sales Rep" : true;
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* Content header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>
              Members &amp; Roles
            </h1>
            <p className="text-[#6B6B67] dark:text-muted-foreground mt-1.5" style={{ fontSize: 13 }}>
              Quản lý thành viên và phân quyền trong workspace
            </p>
          </div>
          <Button
            onClick={() => setShowInvite(true)}
            className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white gap-1.5 shrink-0"
            style={{ fontSize: 13 }}
          >
            <Plus size={14} />
            Mời thành viên
          </Button>
        </div>

        {/* Pending invite amber banner */}
        {pendingInvitations.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-900"
          >
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[#FEF3C7] dark:bg-amber-900/30">
              <MailOpen size={15} className="text-[#D97706] dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <Clock size={13} className="text-[#D97706] dark:text-amber-400" />
              <p className="text-[#92400E] dark:text-amber-300" style={{ fontSize: 13 }}>
                <strong style={{ fontWeight: 600 }}>{pendingInvitations.length} lời mời đang chờ phản hồi</strong>
              </p>
            </div>
            <span className="text-xs text-[#D97706] dark:text-amber-400 font-medium mr-2">
              Xem ở tab Lời mời
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Tổng thành viên", value: `${membersList.length} / 10`, note: "Free plan limit"   },
            { label: "Admin",           value: `${membersList.filter(m => m.role === "Admin").length}`, note: "Quản lý workspace" },
            { label: "Manager",         value: `${membersList.filter(m => m.role === "Manager").length}`, note: "Quản lý đội sales" },
            { label: "Sales Rep",       value: `${membersList.filter(m => m.role === "Sales Rep").length}`, note: "Thành viên sales"  },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border px-5 py-4">
              <p className="text-[#6B6B67] dark:text-muted-foreground mb-1.5" style={{ fontSize: 12 }}>{s.label}</p>
              <p className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
              <p className="text-[#6B6B67] dark:text-muted-foreground mt-1.5" style={{ fontSize: 11 }}>{s.note}</p>
            </div>
          ))}
        </div>

        {/* Members table card */}
        <div className="bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E7E2] dark:border-border">
            {/* Search */}
            <div className="relative flex-1 max-w-[280px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B67] dark:text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thành viên..."
                className="pl-8 h-9 rounded-[10px] border-[#E8E7E2] dark:border-border bg-[#F8F8F7] dark:bg-muted text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Role filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger
                className="h-9 w-[160px] rounded-[10px] border-[#E8E7E2] dark:border-border bg-white dark:bg-card text-[#6B6B67] dark:text-muted-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]"
                style={{ fontSize: 13 }}
              >
                <SelectValue placeholder="Tất cả role" />
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                <SelectItem value="all"     style={{ fontSize: 13 }}>Tất cả role</SelectItem>
                <SelectItem value="admin"   style={{ fontSize: 13 }}>Admin</SelectItem>
                <SelectItem value="manager"   style={{ fontSize: 13 }}>Manager</SelectItem>
                <SelectItem value="salesrep" style={{ fontSize: 13 }}>Sales Rep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {usersLoading ? (
            <div className="flex flex-col items-center justify-center p-10 text-[#6B6B67]" style={{ fontSize: 13, minHeight: 200 }}>
              <RefreshCw size={20} className="animate-spin text-[#534AB7] mb-2" />
              Đang tải danh sách thành viên...
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Thành viên", "Role", "Trạng thái", "Ngày tham gia", "Hoạt động gần nhất", "Hành động"].map((col) => (
                    <th
                      key={col}
                      className="text-left text-[#6B6B67] dark:text-muted-foreground px-5 py-3"
                      style={{ fontSize: 11, fontWeight: 500 }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr
                    key={m.id}
                    className="group hover:bg-[#F8F8F7] dark:hover:bg-muted/50 transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    {/* Member */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback
                            style={{ background: m.bg, color: m.color, fontSize: 10, fontWeight: 700 }}
                            className="border-0"
                          >
                            {m.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#1A1A18] dark:text-foreground truncate" style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</p>
                            {m.isYou && (
                              <span className="px-1.5 py-0.5 rounded shrink-0 text-[#6B6B67] dark:text-muted-foreground bg-[#F1EFE8] dark:bg-muted" style={{ fontSize: 10 }}>
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="text-[#6B6B67] dark:text-muted-foreground truncate" style={{ fontSize: 11 }}>{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3">
                      <RoleBadge role={m.role} status={m.status} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      {m.status === "active" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full shrink-0" style={{ background: "#1D9E75" }} />
                          <span className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 12 }}>Hoạt động</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full shrink-0 border-2" style={{ borderColor: "#D97706" }} />
                          <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>Chưa tham gia</span>
                        </div>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3">
                      <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>{m.joinedAt}</span>
                    </td>

                    {/* Last seen */}
                    <td className="px-5 py-3">
                      <span className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 12 }}>{m.lastSeen}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3" style={{ width: 140 }}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.isYou ? null : m.status === "pending" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.success(`Đã gửi lại lời mời cho ${m.name}`)}
                              className="h-7 px-2 rounded-lg text-[#534AB7] dark:text-primary hover:bg-[#EEEDFE] dark:hover:bg-muted hover:text-[#534AB7] dark:hover:text-primary"
                              style={{ fontSize: 12 }}
                            >
                              <RefreshCw size={11} className="mr-1" />
                              Gửi lại
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.info("Đã hủy lời mời")}
                              className="h-7 px-2 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-destructive/20 text-[#A32D2D] dark:text-destructive"
                              style={{ fontSize: 12 }}
                            >
                              <X size={11} className="mr-1" />
                              Hủy
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingMember(m)}
                              className="size-7 rounded-lg text-[#6B6B67] dark:text-muted-foreground hover:bg-[#EEEDFE] dark:hover:bg-muted hover:text-[#534AB7] dark:hover:text-primary"
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingMemberId(m.id)}
                              className="size-7 rounded-lg text-[#6B6B67] dark:text-muted-foreground hover:bg-[#FEE2E2] dark:hover:bg-destructive/20 hover:text-[#A32D2D] dark:hover:text-destructive"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite modal */}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />

      {/* Edit active member modal */}
      <EditMemberDialog member={editingMember} onClose={() => setEditingMember(null)} />

      {/* Delete active member modal */}
      <DeleteMemberDialog memberId={deletingMemberId} onClose={() => setDeletingMemberId(null)} />
    </>
  );
}

// ── Edit Member Dialog Component ──────────────────────────────────────────────
function EditMemberDialog({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateUser();
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("SALES_REP");

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: usersService.getRoles,
  });

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;
    if (!name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        name: name.trim(),
        role,
      });
      onClose();
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 rounded-[10px] overflow-hidden bg-background" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E7E2] dark:border-border">
          <DialogTitle className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 16, fontWeight: 600 }}>
            Chỉnh sửa thành viên
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Địa chỉ email</Label>
            <Input type="email" value={member?.email || ""} disabled className="bg-[#F8F8F7] dark:bg-muted text-[#9A9A95] dark:text-muted-foreground border-[#E8E7E2] dark:border-border" style={{ fontSize: 13 }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Họ và tên</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
              style={{ fontSize: 13 }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13 }}>Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#1A1A18] dark:text-foreground focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-[#E8E7E2] dark:border-border bg-background">
                {roles.map((r: RoleDto) => (
                  <SelectItem key={r.id} value={r.name} style={{ fontSize: 13 }}>
                    {formatRoleDisplayName(r.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#6B6B67] dark:text-muted-foreground hover:bg-[#F8F8F7] dark:hover:bg-muted" style={{ fontSize: 13 }}>Hủy</Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-9 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white"
            style={{ fontSize: 13 }}
          >
            {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Member Dialog Component ────────────────────────────────────────────
function DeleteMemberDialog({
  memberId,
  onClose,
}: {
  memberId: string | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteUser();

  const handleDelete = async () => {
    if (!memberId) return;
    try {
      await deleteMutation.mutateAsync(memberId);
      onClose();
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={!!memberId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-[10px] bg-background" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 15, fontWeight: 600 }}>
            Xóa thành viên khỏi Workspace
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 13 }}>
            Bạn có chắc chắn muốn xóa thành viên này khỏi workspace? Mọi quyền truy cập của họ sẽ bị thu hồi ngay lập tức.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-[10px] border-[#E8E7E2] dark:border-border text-[#6B6B67] dark:text-muted-foreground hover:bg-[#F8F8F7] dark:hover:bg-muted" style={{ fontSize: 13 }}>Hủy bỏ</Button>
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-9 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            style={{ fontSize: 13 }}
          >
            {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
