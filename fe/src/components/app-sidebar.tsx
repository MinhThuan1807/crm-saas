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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: GitBranch, label: "Pipeline", path: "/pipeline" },
  { icon: Users, label: "Contacts", path: "/contacts" },
  { icon: CalendarCheck, label: "Activities", path: "/activities" },
  { icon: BarChart2, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar() {
  const { mutate: logout } = useLogout();
  const { data: me } = useMe();
  const pathName = usePathname();

  const handleLogout = () => {
    logout();
  };
  const isActive = (path: string) => {
    if (path === "/") return pathName === "/";
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
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="flex-1 p-2 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <Link
                      href={item.path}
                      style={{ textDecoration: "none", fontSize: 13, fontWeight: active ? 500 : 400 }}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-colors",
                        active
                          ? "bg-secondary text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
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
