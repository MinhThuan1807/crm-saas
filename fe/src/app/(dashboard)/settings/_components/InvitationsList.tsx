"use client";

import { useState, useEffect } from "react";
import { useGetInvitations, useRevokeInvitation, useUpdateInvitation } from "@/hooks/useInvitations";
import {
  Copy, Check, Clock, Trash2, Mail, ExternalLink, RefreshCw, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Invitation } from "@/services/invitations.service";

// ── Copy link button component ───────────────────────────────────────────────
function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    toast.success("Đã sao chép link mời");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 rounded-lg gap-1 border-[#E8E7E2] text-[#6B6B67] hover:bg-[#F1EFE8] hover:text-[#1A1A18]"
      style={{ fontSize: 11 }}
    >
      {copied ? (
        <>
          <Check size={11} className="text-[#1D9E75]" />
          <span>Đã chép</span>
        </>
      ) : (
        <>
          <Copy size={11} />
          <span>Chép link</span>
        </>
      )}
    </Button>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function InvitationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#FAEEDA", color: "#854F0B" }}>
          <Clock size={10} />
          Chờ kích hoạt
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#EBFDF5", color: "#107C41" }}>
          Đã tham gia
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#FEE2E2", color: "#A32D2D" }}>
          Hết hạn
        </span>
      );
    case "REVOKED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#F1EFE8", color: "#6B6B67" }}>
          Đã hủy
        </span>
      );
    default:
      return null;
  }
}

export function InvitationsList() {
  const { data: invitations, isLoading, refetch } = useGetInvitations();
  const revokeMutation = useRevokeInvitation();
  
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [editingInv, setEditingInv] = useState<Invitation | null>(null);

  const handleRevoke = async () => {
    if (!confirmRevokeId) return;
    await revokeMutation.mutateAsync(confirmRevokeId);
    setConfirmRevokeId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[10px] border border-[#E8E7E2]" style={{ minHeight: 300 }}>
        <RefreshCw size={24} className="animate-spin text-[#534AB7] mb-2" />
        <p className="text-[#6B6B67]" style={{ fontSize: 13 }}>Đang tải danh sách lời mời...</p>
      </div>
    );
  }

  const activeInvitations = invitations || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[#1A1A18]" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1 }}>Lời mời thành viên</h2>
          <p className="text-[#6B6B67] mt-1" style={{ fontSize: 13 }}>Theo dõi và quản lý các liên kết mời tham gia workspace</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="h-8 px-3 rounded-lg border-[#E8E7E2] hover:bg-[#F8F8F7] text-[#6B6B67] hover:text-[#1A1A18]"
          style={{ fontSize: 12 }}
        >
          <RefreshCw size={12} className="mr-1.5" />
          Làm mới
        </Button>
      </div>

      {activeInvitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 bg-white rounded-[10px] border border-[#E8E7E2]" style={{ minHeight: 300 }}>
          <div className="size-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#EEEDFE" }}>
            <Mail size={20} style={{ color: "#534AB7" }} />
          </div>
          <p className="text-[#1A1A18] mb-1" style={{ fontSize: 14, fontWeight: 600 }}>Chưa có lời mời nào</p>
          <p className="text-[#6B6B67] text-center max-w-[320px] mb-4" style={{ fontSize: 12 }}>
            Khi bạn mời một thành viên mới, link mời và trạng thái của họ sẽ được hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-[#E8E7E2] overflow-hidden">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E7E2" }}>
                {["Email người nhận", "Vai trò", "Trạng thái", "Ngày gửi", "Ngày hết hạn", "Liên kết mời", "Hành động"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-[#6B6B67] px-5 py-3"
                    style={{ fontSize: 11, fontWeight: 500 }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeInvitations.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className="group hover:bg-[#F8F8F7] transition-colors"
                  style={{ borderBottom: idx < activeInvitations.length - 1 ? "1px solid #E8E7E2" : "none" }}
                >
                  {/* Email */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#9A9A95]" />
                      <span className="text-[#1A1A18] font-medium" style={{ fontSize: 13 }}>{inv.email}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3">
                    <span className="text-[#1A1A18]" style={{ fontSize: 13 }}>
                      {inv.role === "ADMIN" ? "Admin" : inv.role === "MANAGER" ? "Manager" : "Sales Rep"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    <InvitationStatusBadge status={inv.status} />
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-3">
                    <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>{formatDate(inv.createdAt)}</span>
                  </td>

                  {/* Expires At */}
                  <td className="px-5 py-3">
                    <span className="text-[#6B6B67]" style={{ fontSize: 12 }}>{formatDate(inv.expiresAt)}</span>
                  </td>

                  {/* Invitation Link copy */}
                  <td className="px-5 py-3">
                    {inv.status === "PENDING" ? (
                      <CopyLinkButton token={inv.token} />
                    ) : (
                      <span className="text-[#9A9A95]" style={{ fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    {inv.status === "PENDING" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingInv(inv)}
                          className="size-7 rounded-lg text-[#6B6B67] hover:bg-[#EEEDFE] hover:text-[#534AB7]"
                          title="Chỉnh sửa lời mời"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmRevokeId(inv.id)}
                          className="size-7 rounded-lg text-[#6B6B67] hover:bg-[#FEE2E2] hover:text-[#A32D2D]"
                          title="Hủy lời mời"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Revoke Dialog */}
      <Dialog open={!!confirmRevokeId} onOpenChange={(v) => !v && setConfirmRevokeId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[10px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A18]" style={{ fontSize: 15, fontWeight: 600 }}>Hủy lời mời</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-[#6B6B67]" style={{ fontSize: 13 }}>
              Bạn có chắc chắn muốn hủy lời mời này? Người nhận sẽ không thể sử dụng link mời này để kích hoạt tài khoản được nữa.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmRevokeId(null)}
              className="h-9 rounded-[10px] border-[#E8E7E2]"
              style={{ fontSize: 13 }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="h-9 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white"
              style={{ fontSize: 13 }}
            >
              {revokeMutation.isPending ? "Đang hủy..." : "Đồng ý hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invitation Dialog */}
      <EditInvitationDialog
        invitation={editingInv}
        onClose={() => setEditingInv(null)}
      />
    </div>
  );
}

// ── Edit Invitation Dialog Component ──────────────────────────────────────────
function EditInvitationDialog({
  invitation,
  onClose
}: {
  invitation: Invitation | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateInvitation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "SALES_REP">("SALES_REP");

  useEffect(() => {
    if (invitation) {
      setEmail(invitation.email);
      setRole(invitation.role);
    }
  }, [invitation]);

  const handleSave = async () => {
    if (!invitation) return;
    if (!email.trim()) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: invitation.id,
        email: email.trim(),
        role,
      });
      onClose();
    } catch {
      // Handled by hook
    }
  };

  return (
    <Dialog open={!!invitation} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 rounded-[10px] overflow-hidden" aria-describedby={undefined}>
        
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E7E2]">
          <DialogTitle className="text-[#1A1A18]" style={{ fontSize: 16, fontWeight: 600 }}>
            Chỉnh sửa lời mời
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Địa chỉ email</Label>
            <Input
              type="email"
              placeholder="email@congtyabc.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#1A1A18]" style={{ fontSize: 13 }}>Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger className="h-10 rounded-[10px] border-[#E8E7E2] focus:ring-[#534AB7]/30 focus:border-[#534AB7]" style={{ fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-[#E8E7E2]">
                <SelectItem value="ADMIN" style={{ fontSize: 13 }}>Admin</SelectItem>
                <SelectItem value="MANAGER" style={{ fontSize: 13 }}>Manager</SelectItem>
                <SelectItem value="SALES_REP" style={{ fontSize: 13 }}>Sales Rep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-[#6B6B67] leading-relaxed" style={{ fontSize: 11 }}>
            * Lưu ý: Khi chỉnh sửa, hệ thống sẽ tự động tạo link token mới và vô hiệu hóa link cũ. Một email kích hoạt mới sẽ được tự động gửi đến địa chỉ email này.
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-[10px] border-[#E8E7E2] text-[#6B6B67] hover:bg-[#F8F8F7]"
            style={{ fontSize: 13 }}
          >
            Hủy
          </Button>
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
