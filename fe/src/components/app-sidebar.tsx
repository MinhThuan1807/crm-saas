"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  CalendarCheck,
  BarChart2,
  Settings,
  LogOut,
  FileText,
  Shield,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { useLogout, useMe } from "@/hooks/useAuth";

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : '';
}

const navGroups = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Sales",
    items: [
      { icon: GitBranch, label: "Pipeline", path: "/pipeline" },
      { icon: Users, label: "Contacts", path: "/contacts" },
    ],
  },
  {
    label: "Activities",
    path: "/activities",
    icon: CalendarCheck,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart2,
  },
  {
    label: "Administration",
    roles: ["ADMIN", "MANAGER"],
    items: [
      // { icon: Users, label: "Users", path: "/users" },
      { icon: Shield, label: "Roles", path: "/roles" },
      { icon: FileText, label: "Audit Logs", path: "/audit-logs" },
    ],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];
export function AppSidebar() {
  const { mutate: logout } = useLogout();
  const { data: me } = useMe();
  const pathName = usePathname();

  const handleLogout = () => {
    logout();
  };
  const isActive = (path: string) => {
    if (path === "/dashboard") return pathName === "/dashboard";
    return pathName.startsWith(path);
  };
  return (
    // className="w-50 min-w-50 bg-background border-r border-border flex flex-col h-screen shrink-0"
    <Sidebar className="bg-background border-r border-border flex flex-col h-screen shrink-0">
        <SidebarHeader>
          {/* Brand */}
          <div className="px-4 pt-5 pb-4 border-b border-border shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 mb-1 no-underline"
              style={{ textDecoration: "none" }}
            >
              <div className="size-6 bg-primary rounded-[6px] flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 10L6.5 3L11 10H2Z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <span
                className="text-foreground"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                SalesFlow
              </span>
            </Link>
            <div className="flex items-center gap-1.5 pl-8">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                Công ty ABC
              </span>
              <Badge
                variant="secondary"
                className="h-[18px] px-1.5 text-primary bg-secondary rounded-full border-0"
                style={{ fontSize: 10 }}
              >
                Free
              </Badge>
            </div>
          </div>
        </SidebarHeader>
          <SidebarContent className="p-3 overflow-y-auto flex-1 space-y-0.5">
          {navGroups.map((group, gIdx) => {
            // Check role restrictions
            if (group.roles && (!me?.role || !group.roles.includes(me.role))) {
              return null;
            }
            // Case 1: Group is a direct clickable link
            if (group.path) {
              const active = isActive(group.path);
              const Icon = group.icon!;
              return (
                <div key={gIdx} className="px-1">
                  <Link
                    href={group.path}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all no-underline font-medium",
                      active
                        ? "bg-[#EEEDFE] text-[#534AB7]"
                        : "text-[#495057] hover:bg-[#E9ECEF] hover:text-[#212529]"
                    )}
                  >
                    <Icon size={16} />
                    <span>{group.label}</span>
                  </Link>
                </div>
              );
            }
            // Case 2: Group is a header with indented children
            return (
              <div key={gIdx} className="space-y-1">
                <span className="text-xs font-semibold text-[#868E96] uppercase tracking-wider px-4 block">
                  {group.label}
                </span>
                <div className="space-y-0.5 pl-3">
                  {group.items?.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-sm transition-all no-underline font-normal",
                          active
                            ? "bg-[#EEEDFE] text-[#534AB7] font-medium"
                            : "text-[#495057] hover:bg-[#E9ECEF] hover:text-[#212529]"
                        )}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </SidebarContent>
        <SidebarFooter>
          {/* User section */}
          <div className="flex items-center gap-2 p-3 border-t border-border shrink-0">
            <Avatar className="size-[30px] shrink-0">
              <AvatarFallback
                className="border-0"
                style={{
                  background: "#D4E8F5",
                  color: "#1A5C7A",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {getInitials(me?.name) || "NM"}
              </AvatarFallback>
            </Avatar>
  
            <div className="flex-1 min-w-0">
              <p
                className="text-foreground truncate"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {me?.name || "Nguyễn Minh"}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                {me?.role ? (me.role.charAt(0) + me.role.slice(1).toLowerCase().replace('_', ' ')) : "Manager"}
              </p>
            </div>
  
            <Button
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 flex items-center bg-transparent border-0 cursor-pointer"
              title="Đăng xuất"
              onClick={handleLogout}
            >
              <LogOut size={13} />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
  );
}
