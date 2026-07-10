import { ReactNode } from "react";
import { Info, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  noPad?: boolean;
}

export function ChartCard({ title, subtitle, children, className, action, noPad }: Props) {
  return (
    <div className={cn("bg-white dark:bg-card rounded-[10px] border border-[#E8E7E2] dark:border-border", className)}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[#1A1A18] dark:text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>{title}</h3>
          {subtitle && (
            <p className="text-[#6B6B67] dark:text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {action}
          <button className="size-6 flex items-center justify-center rounded transition-colors" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
          >
            <Info size={12} />
          </button>
          <button className="size-6 flex items-center justify-center rounded transition-colors" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
          >
            <Download size={12} />
          </button>
        </div>
      </div>
      <div className={cn(!noPad && "px-4 pb-4")}>
        {children}
      </div>
    </div>
  );
}
