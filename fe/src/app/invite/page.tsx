"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationsService } from "@/services/invitations.service";
import { toast } from "sonner";
import { SalesFlowLogo } from "@/components/SalesFlowLogo";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [inviteData, setInviteData] = useState<{
    email: string;
    role: string;
    companyName: string;
    token: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifyError("Link mời không hợp lệ. Vui lòng kiểm tra lại token.");
      setVerifying(false);
      return;
    }

    const checkToken = async () => {
      try {
        const data = await invitationsService.verify(token);
        setInviteData(data);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        const msg = error.response?.data?.message || "Lời mời không hợp lệ hoặc đã hết hạn.";
        setVerifyError(msg);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (form.password.length < 6) {
      setFormError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFormError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setSubmitting(true);

    try {
      await invitationsService.accept({
        token: token!,
        name: form.name,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      toast.success("Kích hoạt tài khoản thành công! Đang chuyển hướng...");
      router.push("/");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setFormError(msg);
      setSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === "ADMIN") return "Admin";
    if (role === "MANAGER") return "Manager";
    return "Sales Rep";
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: 320 }}>
        <Loader2 size={32} className="animate-spin text-[#534AB7] mb-4" />
        <p className="text-[#1A1A18] font-medium" style={{ fontSize: 15 }}>Đang xác thực liên kết mời...</p>
        <p className="text-[#6B6B67] mt-1" style={{ fontSize: 13 }}>Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  if (verifyError || !inviteData) {
    return (
      <div className="p-6 text-center">
        <div className="size-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEE2E2" }}>
          <AlertCircle size={22} className="text-[#DC2626]" />
        </div>
        <h2 className="text-[#1A1A18] mb-2" style={{ fontSize: 16, fontWeight: 600 }}>Liên kết không khả dụng</h2>
        <p className="text-[#6B6B67] mb-6 max-w-[320px] mx-auto" style={{ fontSize: 13, lineHeight: 1.5 }}>
          {verifyError || "Lời mời đã bị thu hồi hoặc đã hết hiệu lực kích hoạt."}
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="w-full h-10 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white"
          style={{ fontSize: 13 }}
        >
          Quay lại trang Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Premium Header/Branding inside the form card */}
      <div className="p-6 pb-4 border-b border-[#E8E7E2]" style={{ background: "linear-gradient(180deg, #F9F8FD 0%, #FFFFFF 100%)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 w-fit" style={{ background: "#EEEDFE", border: "1px solid #D1CFED" }}>
          <Sparkles size={11} className="text-[#534AB7]" />
          <span className="text-[#534AB7] font-semibold" style={{ fontSize: 10 }}>THAM GIA WORKSPACE</span>
        </div>
        <h2 className="text-[#1A1A18] tracking-tight" style={{ fontSize: 18, fontWeight: 600 }}>
          Gia nhập {inviteData.companyName}
        </h2>
        <p className="text-[#6B6B67] mt-1" style={{ fontSize: 13, lineHeight: 1.4 }}>
          Bạn được mời làm <span className="font-semibold text-[#534AB7]">{getRoleLabel(inviteData.role)}</span>. Thiết lập mật khẩu để tham gia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {formError && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm text-[#A32D2D]" style={{ background: "#FEE2E2", border: "1px solid #FECACA" }}>
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span style={{ fontSize: 12 }}>{formError}</span>
          </div>
        )}

        {/* Email - Prefilled & Disabled */}
        <div className="space-y-1.5">
          <Label className="text-[#6B6B67]" style={{ fontSize: 12, fontWeight: 500 }}>Địa chỉ Email của bạn</Label>
          <Input
            type="email"
            value={inviteData.email}
            disabled
            className="bg-[#F8F8F7] text-[#9A9A95] border-[#E8E7E2] select-none"
            style={{ fontSize: 13 }}
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[#6B6B67]" style={{ fontSize: 12, fontWeight: 500 }}>Họ và tên</Label>
          <Input
            id="name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
            style={{ fontSize: 13 }}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#6B6B67]" style={{ fontSize: 12, fontWeight: 500 }}>Mật khẩu mới</Label>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-10 pr-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
              style={{ fontSize: 13 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[#6B6B67] hover:text-[#1A1A18] p-1 bg-transparent border-0 cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[#6B6B67]" style={{ fontSize: 12, fontWeight: 500 }}>Nhập lại mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="h-10 rounded-[10px] border-[#E8E7E2] text-[#1A1A18] focus-visible:ring-[#534AB7]/30 focus-visible:border-[#534AB7]"
            style={{ fontSize: 13 }}
            required
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-10 rounded-[10px] bg-[#534AB7] hover:bg-[#4840A0] text-white transition-colors cursor-pointer mt-2"
          style={{ fontSize: 13 }}
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              Đang thiết lập...
            </>
          ) : (
            "Kích hoạt tài khoản & Đăng nhập"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center px-4 py-16 bg-[#F8F8F7]"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <SalesFlowLogo />
        </div>

        {/* Main form card */}
        <div
          className="bg-white border border-[#E8E7E2] rounded-xl overflow-hidden shadow-sm"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: 320 }}>
                <Loader2 size={32} className="animate-spin text-[#534AB7] mb-4" />
                <p style={{ fontSize: 14, color: "#6B6B67" }}>Đang tải...</p>
              </div>
            }
          >
            <InviteContent />
          </Suspense>
        </div>
      </div>

      <p className="mt-12 text-[#9B9B96]" style={{ fontSize: 12 }}>
        © 2025 SalesFlow · All rights reserved.
      </p>
    </div>
  );
}
