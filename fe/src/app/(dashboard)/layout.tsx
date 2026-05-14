import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 min-w-0 flex-col h-svh overflow-hidden">
          {/* <SidebarTrigger variant="ghost" className="absolute left-3 top-3"/> */}
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
