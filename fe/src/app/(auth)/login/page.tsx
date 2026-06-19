"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { LoginFormValues } from "@/types/auth.type";
import { useLogin } from "@/hooks/useAuth";

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function SalesFlowLogo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl bg-primary shrink-0"
        style={{ width: 28, height: 28 }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 12C3 12 3 9 6.5 9C10 9 11 6.5 11 4.5C11 2.5 9 1.5 7 1.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 8.5C7 8.5 7 11.5 10 11.5C13 11.5 14 13.5 14 14.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <circle cx="14" cy="14.5" r="1.5" fill="white" fillOpacity="0.5" />
        </svg>
      </div>
      <span
        className="tracking-[-0.025em] text-foreground"
        style={{ fontSize: 17, fontWeight: 700 }}
      >
        SalesFlow
      </span>
    </div>
  );
}

const LoginPage = () => {
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    login(values);
  }

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
              Đăng nhập vào workspace
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 14 }}>
              Chào mừng bạn trở lại SalesFlow
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-white border border-[#E8E7E2] rounded-xl overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
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
                aria-invalid={!!errors.email}
                {...register("email", {
                  required: "Vui lòng nhập địa chỉ email.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Địa chỉ email không hợp lệ.",
                  },
                })}
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
              <div className="flex items-center justify-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive" style={{ fontSize: 12 }}>
                    {errors.password.message}
                  </p>
                )}
                {showPassword ? (
                  <EyeOff className="cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <Eye className="cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>
            </div>

            {/* Submit */}
        <Button
          className="w-full p-5 hover:bg-primary/90 transition-colors cursor-pointer" 
          disabled={isPending}>
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
        </div>

        {/* SSO hint
        <p className="mt-4 text-center text-[#9B9B96]" style={{ fontSize: 12 }}>
          Tổ chức của bạn dùng SSO?{" "}
          <button
            type="button"
            className="text-primary hover:underline underline-offset-2 transition-colors"
            style={{ fontWeight: 400 }}
          >
            Đăng nhập với SSO
          </button>
        </p> */}
        
      </div>

      {/* Footer */}
      <p className="mt-12 text-[#9B9B96]" style={{ fontSize: 12 }}>
        © 2025 SalesFlow · All rights reserved.
      </p>
    </div>
  );
};
export default LoginPage;
