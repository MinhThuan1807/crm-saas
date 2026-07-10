"use client";

import { useState } from "react";
import {
  Building2, Users, Mail, User, Lock, CreditCard, FileText, Bell, Puzzle, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { WorkspaceInfo } from "./_components/WorkspaceInfo";
import { MembersRoles }  from "./_components/MembersRoles";
import { InvitationsList } from "./_components/InvitationsList";

// ── Nav structure ─────────────────────────────────────────────────────────────
type SettingsTab =
  | "workspace-info" | "members" | "invitations"
  | "profile" | "password"
  | "billing" | "invoices"
  | "notifications" | "integrations";

const NAV_GROUPS: {
  label: string;
  items: { id: SettingsTab; label: string; Icon: typeof Building2 }[];
}[] = [
  {
    label: "WORKSPACE",
    items: [
      { id: "workspace-info", label: "Workspace Info",  Icon: Building2 },
      { id: "members",        label: "Members & Roles", Icon: Users      },
      { id: "invitations",    label: "Invitations",     Icon: Mail       },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { id: "profile",  label: "Profile của tôi", Icon: User },
      { id: "password", label: "Đổi mật khẩu",   Icon: Lock },
    ],
  },
  {
    label: "BILLING",
    items: [
      { id: "billing",  label: "Gói & Thanh toán",  Icon: CreditCard },
      { id: "invoices", label: "Lịch sử hóa đơn",   Icon: FileText   },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "notifications", label: "Thông báo",   Icon: Bell   },
      { id: "integrations",  label: "Integrations", Icon: Puzzle },
    ],
  },
];

// ── Placeholder for unbuilt tabs ───────────────────────────────────────────────
function ComingSoonContent({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 420 }}>
      <div className="size-14 rounded-full flex items-center justify-center mb-4 bg-[#EEEDFE] dark:bg-secondary">
        <BarChart2 size={24} className="text-[#534AB7] dark:text-primary" />
      </div>
      <p className="text-[#1A1A18] dark:text-foreground mb-1.5" style={{ fontSize: 15, fontWeight: 600 }}>{label}</p>
      <p className="text-[#6B6B67] dark:text-muted-foreground" style={{ fontSize: 13 }}>Tính năng này đang được phát triển</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace-info");

  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ?? "";

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 border-b border-[#E8E7E2] dark:border-border bg-white dark:bg-card flex items-center px-6 gap-3"
        style={{ height: 56 }}
      >
        <h1 className="text-[#1A1A18] dark:text-foreground tracking-tight" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>
          Settings
        </h1>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden bg-[#F8F8F7] dark:bg-background">

        {/* ── Settings sub-nav ────────────────────────────────────────────────── */}
        <aside
          className="shrink-0 overflow-y-auto border-r border-[#E8E7E2] dark:border-border bg-white dark:bg-card"
          style={{ width: 220 }}
        >
          <div className="p-4">
            <p className="text-[#1A1A18] dark:text-foreground mb-4" style={{ fontSize: 16, fontWeight: 500 }}>Settings</p>

            <div className="flex flex-col gap-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  {/* Group label */}
                  <p
                    className="text-[#6B6B67] dark:text-muted-foreground mb-1.5 tracking-wider"
                    style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}
                  >
                    {group.label}
                  </p>

                  {/* Items */}
                  <div className="flex flex-col gap-0.5">
                    {group.items.map(({ id, label, Icon }) => {
                      const active = activeTab === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setActiveTab(id)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2.5 py-2 rounded-lg transition-colors text-left cursor-pointer",
                            active
                              ? "bg-[#EEEDFE] dark:bg-secondary text-[#534AB7] dark:text-primary"
                              : "text-[#6B6B67] dark:text-muted-foreground hover:bg-[#F8F8F7] dark:hover:bg-muted hover:text-[#1A1A18] dark:hover:text-foreground"
                          )}
                          style={{ fontSize: 13, fontWeight: active ? 500 : 400, border: "none" }}
                        >
                          <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Settings content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {activeTab === "workspace-info" && <WorkspaceInfo />}
          {activeTab === "members"        && <MembersRoles />}
          {activeTab === "invitations"    && <InvitationsList />}
          {activeTab !== "workspace-info" && activeTab !== "members" && activeTab !== "invitations" && (
            <ComingSoonContent label={activeLabel} />
          )}
        </main>

      </div>
    </div>
  );
}
