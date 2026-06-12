"use client";
import { LoginBodyType, RegisterBodyType } from "@/lib/validations/auth.schema";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/types/error.type";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginBodyType) => {
      return authService.login(data);
    },

    onSuccess: () => {
      toast.success("Đăng nhập thành công");
      router.push("/");
    },

    onError: (error: ApiError) => {
      const message = error.response?.data.message || "Đăng nhập thất bại";
      // let message = "Đăng nhập thất bại";

      // if (typeof data?.message === "string") {
      //   message = data.message;
      // } else if (Array.isArray(data?.message) && data.message.length > 0) {
      //   // Lấy message từ phần tử đầu tiên trong array
      //   message = data.message[0]?.message || "Đăng nhập thất bại";
      // }
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: () => {
      return authService.logout();
    },
    onSuccess: () => {
      toast.success("Đăng xuất thành công");
      router.push("/login");
    },
  });
};

export const useRegister = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: RegisterBodyType) => {
      return authService.register(data);
    },
    onSuccess: () => {
      toast.success("Đăng ký thành công. Vui lòng đăng nhập.");
      router.push("/login");
    },
    onError: (error: ApiError) => {
      const message = error?.response?.data?.message || "Đăng ký thất bại";
      toast.error(message);
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
};
