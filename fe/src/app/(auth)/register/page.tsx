"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, Building2, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RegisterBodyType } from "@/lib/validations/auth.schema";
import { useRouter} from "next/navigation";
import { RegisterBodySchema } from '@/lib/validations/auth.schema';
import { zodResolver } from "@hookform/resolvers/zod";
import { SalesFlowLogo } from "../login/page";
import { useRegister } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3;

interface StrengthResult {
  level: StrengthLevel;
  label: string;
  color: string;
  criteria: { label: string; met: boolean }[];
}

function getPasswordStrength(pw: string): StrengthResult {
  const criteria = [
    { label: "Ít nhất 8 ký tự", met: pw.length >= 8 },
    { label: "Chứa chữ số",     met: /\d/.test(pw) },
    { label: "Chứa chữ hoa",    met: /[A-Z]/.test(pw) },
  ];
  const metCount = criteria.filter((c) => c.met).length as 0 | 1 | 2 | 3;
  const levels: { label: string; color: string }[] = [
    { label: "",          color: "#E8E7E2" },
    { label: "Yếu",       color: "#E05D5D" },
    { label: "Trung bình", color: "#F0A429" },
    { label: "Mạnh",      color: "#3B8A3B" },
  ];
  return { level: metCount, ...levels[metCount], criteria };
}


// ─── Password Input ───────────────────────────────────────────────────────────

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// ─── Strength Meter ───────────────────────────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { level, label, color, criteria } = getPasswordStrength(password);
  return (
    <div className="space-y-2 pt-0.5">
      {/* Bar */}
      <div className="flex gap-1">
        {([1, 2, 3] as const).map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= level ? color : "#F1EFE8" }}
          />
        ))}
      </div>
      {/* Criteria + label */}
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {criteria.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-1"
                style={{ fontSize: 11, color: c.met ? "#3B8A3B" : "#9B9B96" }}
              >
                <Check
                  className={cn("size-3 transition-opacity", c.met ? "opacity-100" : "opacity-30")}
                  strokeWidth={2.5}
                />
                {c.label}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color }}>{label}</span>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { mutate: authRegister, isPending, } = useRegister();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterBodyType>({
    defaultValues: { companyName: "", name: "", email: "", password: "", confirmPassword: "" },
    resolver: zodResolver(RegisterBodySchema)
  });

  const passwordValue = watch("password");

  async function onSubmit(values: RegisterBodyType) {
    authRegister(values);
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-16 bg-[#F8F8F7]">
      <div className="w-full max-w-[420px]">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-5 mb-8 text-center">
          <SalesFlowLogo />
          <div className="space-y-1">
            <h1
              className="text-foreground tracking-tight"
              style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}
            >
              Tạo workspace của bạn
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 14 }}>
              Dùng thử miễn phí 14 ngày · Không cần thẻ tín dụng
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
            {/* Company name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                Tên công ty
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-3.5" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Công ty ABC"
                  autoComplete="organization"
                  autoFocus
                  className={cn("h-9 pl-9", errors.companyName && "border-destructive focus-visible:ring-destructive/20")}
                  aria-invalid={!!errors.companyName}
                  {...register("companyName")}
                />
              </div>
              {errors.companyName && (
                <p className="text-destructive" style={{ fontSize: 12 }}>{errors.companyName.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                Họ và tên
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-3.5" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Họ và tên"
                  autoComplete="name"
                  autoFocus
                  className={cn("h-9 pl-9", errors.name && "border-destructive focus-visible:ring-destructive/20")}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-destructive" style={{ fontSize: 12 }}>{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                Email công việc
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ten@congty.vn"
                autoComplete="email"
                className={cn("h-9", errors.email && "border-destructive focus-visible:ring-destructive/20")}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive" style={{ fontSize: 12 }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                Mật khẩu
              </Label>
              <PasswordInput
                id="password"
                {...register("password")}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                className={cn("h-9", errors.password && "border-destructive focus-visible:ring-destructive/20")}
                aria-invalid={!!errors.password}
              />
              <PasswordStrengthMeter password={passwordValue} />
              {errors.password && (
                <p className="text-destructive" style={{ fontSize: 12 }}>{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
                Xác nhận mật khẩu
              </Label>
              <PasswordInput
                id="confirmPassword"
                {...register("confirmPassword")}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                className={cn("h-9", errors.confirmPassword && "border-destructive focus-visible:ring-destructive/20")}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-destructive" style={{ fontSize: 12 }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms hint */}
            <p className="text-muted-foreground pt-0.5" style={{ fontSize: 12 }}>
              Bằng cách tạo tài khoản, bạn đồng ý với{" "}
              <button type="button" className="text-primary hover:underline underline-offset-2 bg-transparent border-0 cursor-pointer" style={{ fontWeight: 500 }}>
                Điều khoản dịch vụ
              </button>{" "}
              và{" "}
              <button type="button" className="text-primary hover:underline underline-offset-2 bg-transparent border-0 cursor-pointer" style={{ fontWeight: 500 }}>
                Chính sách bảo mật
              </button>.
            </p>

            <Button type="submit" className="w-full h-9 mt-1" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative px-6 pb-1">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-muted-foreground" style={{ fontSize: 12 }}>
                hoặc
              </span>
            </div>
          </div>

          {/* Sign-in link */}
          <div className="px-6 py-5 text-center">
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline underline-offset-2 transition-colors"
                style={{ fontWeight: 500, textDecoration: "none" }}
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* SSO hint */}
        <p className="mt-4 text-center text-muted-foreground" style={{ fontSize: 12 }}>
          Tổ chức của bạn dùng SSO?{" "}
          <button
            type="button"
            className="text-primary hover:underline underline-offset-2 transition-colors bg-transparent border-0 cursor-pointer"
          >
            Đăng ký với SSO
          </button>
        </p>
      </div>

      <p className="mt-12 text-muted-foreground" style={{ fontSize: 12 }}>
        © 2025 SalesFlow · All rights reserved.
      </p>
    </div>
  );
}
