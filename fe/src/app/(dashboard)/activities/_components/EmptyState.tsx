"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="mb-5 opacity-40"
      >
        <rect x="18" y="8" width="44" height="56" rx="6" fill="#E8E7E2" />
        <rect x="24" y="20" width="22" height="3" rx="1.5" fill="#B8B5AA" />
        <rect x="24" y="28" width="32" height="3" rx="1.5" fill="#B8B5AA" />
        <rect x="24" y="36" width="28" height="3" rx="1.5" fill="#B8B5AA" />
        <rect x="24" y="44" width="18" height="3" rx="1.5" fill="#B8B5AA" />
        <circle cx="56" cy="56" r="16" fill="#EEEDFE" />
        <path
          d="M50 56h12M56 50v12"
          stroke="#534AB7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <p
        className="text-foreground mb-1.5"
        style={{ fontSize: 15, fontWeight: 500 }}
      >
        Chưa có hoạt động nào
      </p>
      <p className="text-muted-foreground mb-5" style={{ fontSize: 13 }}>
        Bắt đầu log hoạt động đầu tiên với khách hàng của bạn
      </p>
      <Button size="sm" className="gap-1.5" style={{ fontSize: 13 }}>
        <Plus size={13} />
        Thêm hoạt động
      </Button>
    </div>
  );
}
