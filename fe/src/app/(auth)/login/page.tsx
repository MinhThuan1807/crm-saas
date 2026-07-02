"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { LoginBodySchema, LoginBodyType } from "@/lib/validations/auth.schema";
import { useLogin } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SalesFlowLogo } from "@/components/SalesFlowLogo";

const LoginPage = () => {
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [ssoStep, setSsoStep] = useState<"none" | "email" | "loading">("none");
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoError, setSsoError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBodyType>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(LoginBodySchema),
  });

  function onSubmit(values: LoginBodyType) {
    login(values);
  }
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleSsoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssoEmail) {
      setSsoError("Vui lòng nhập địa chỉ email doanh nghiệp.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ssoEmail)) {
      setSsoError("Địa chỉ email không hợp lệ.");
      return;
    }
    setSsoError("");
    setSsoStep("loading");

    setTimeout(() => {
      toast.info(
        `[Mock SSO] Phát hiện tên miền "${
          ssoEmail.split("@")[1]
        }". Đang kết nối tới Okta...`
      );
      setTimeout(() => {
        toast.success("Đăng nhập SSO thành công! (Đây là luồng giao diện mẫu)");
        setSsoStep("none");
        setSsoEmail("");
      }, 2000);
    }, 1500);
  };

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center px-4 py-16"
      style={{
        background: "#F8F8F7",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Card ── */}
      <div className="w-full" style={{ maxWidth: 400 }}>
        {/* Brand header — outside card, like Linear / Attio */}
        <div className="flex flex-col items-center gap-5 mb-8 text-center">
          <SalesFlowLogo />
          <div className="space-y-1">
            <h1
              className="tracking-[-0.03em] text-foreground"
              style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}
            >
              {ssoStep === "none" ? "Đăng nhập vào workspace" : "Đăng nhập với SSO"}
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 14 }}>
              {ssoStep === "none"
                ? "Chào mừng bạn trở lại SalesFlow"
                : ssoStep === "email"
                ? "Sử dụng tài khoản Identity Provider (IdP) của công ty"
                : "Đang xác thực thông tin cấu hình SSO..."}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-white border border-[#E8E7E2] rounded-xl overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {ssoStep === "none" && (
            <>
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="p-6 space-y-4"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[#6B6B67]"
                    style={{ fontSize: 12, fontWeight: 500 }}
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ten@congty.vn"
                    autoComplete="email"
                    autoFocus
                    className="h-9"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-destructive" style={{ fontSize: 12 }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-[#6B6B67]"
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      Mật khẩu
                    </Label>
                    <button
                      type="button"
                      className="text-primary hover:underline underline-offset-2 transition-colors"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-9 pr-10"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive" style={{ fontSize: 12 }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  className="w-full h-9 hover:bg-primary/90 transition-colors cursor-pointer"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative px-6 pb-1">
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-px bg-[#E8E7E2]" />
                <div className="relative flex justify-center">
                  <span
                    className="bg-white px-3 text-[#9B9B96]"
                    style={{ fontSize: 12 }}
                  >
                    hoặc
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <div className="px-6 pt-4 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 flex items-center justify-center gap-2 cursor-pointer border-[#E8E7E2] hover:bg-[#F8F8F7] hover:text-foreground transition-colors"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.091 14.982 0 12 0 7.354 0 3.307 2.68 1.34 6.582l3.926 3.183z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.275c0-.825-.075-1.613-.21-2.383H12v4.567h6.46c-.28 1.48-1.11 2.73-2.37 3.573l3.68 2.855c2.15-1.98 3.72-4.88 3.72-8.612z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 14.235A7.098 7.098 0 0 1 4.91 12c0-.79.13-1.556.356-2.235L1.34 6.582A11.968 11.968 0 0 0 0 12c0 1.92.45 3.737 1.25 5.373l4.016-3.138z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.075 7.96-2.925l-3.68-2.855c-1.025.688-2.337 1.1-4.28 1.1-3.275 0-6.046-2.212-7.034-5.182L.95 17.275C2.918 21.32 7.127 24 12 24z"
                    />
                  </svg>
                  <span>Tiếp tục với Google</span>
                </Button>
              </div>

              {/* Sign-up link */}
              <div className="px-6 py-5 text-center">
                <p className="text-[#6B6B67]" style={{ fontSize: 13 }}>
                  Chưa có tài khoản?{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline underline-offset-2 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Tạo workspace mới
                  </Link>
                </p>
              </div>
            </>
          )}

          {ssoStep === "email" && (
            <form onSubmit={handleSsoSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="sso-email"
                  className="text-[#6B6B67]"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  Email công ty
                </Label>
                <Input
                  id="sso-email"
                  type="email"
                  placeholder="nhanvien@samsung.com"
                  value={ssoEmail}
                  onChange={(e) => setSsoEmail(e.target.value)}
                  autoFocus
                  className="h-9"
                  aria-invalid={!!ssoError}
                />
                {ssoError && (
                  <p className="text-destructive" style={{ fontSize: 12 }}>
                    {ssoError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-9 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Tiếp tục với SSO
              </Button>

              <button
                type="button"
                className="w-full text-center text-primary hover:underline underline-offset-2 transition-colors mt-2"
                style={{ fontSize: 13, fontWeight: 500 }}
                onClick={() => {
                  setSsoStep("none");
                  setSsoError("");
                }}
              >
                Quay lại đăng nhập thường
              </button>
            </form>
          )}

          {ssoStep === "loading" && (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground text-sm">
                  Đang kiểm tra miền doanh nghiệp...
                </p>
                <p className="text-xs text-muted-foreground">
                  Domain: {ssoEmail.split("@")[1]}
                </p>
              </div>
            </div>
          )}
        </div>

        {ssoStep === "none" && (
          <p className="mt-4 text-center text-[#9B9B96]" style={{ fontSize: 12 }}>
            Tổ chức của bạn dùng SSO?{" "}
            <button
              type="button"
              className="text-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
              style={{ fontWeight: 400 }}
              onClick={() => setSsoStep("email")}
            >
              Đăng nhập với SSO
            </button>
          </p>
        )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-[#9B9B96]" style={{ fontSize: 12 }}>
        © 2025 SalesFlow · All rights reserved.
      </p>
    </div>
  );
};
export default LoginPage;
