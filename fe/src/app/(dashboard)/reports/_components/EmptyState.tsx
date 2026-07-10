import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  height?: number | string;
}

export function EmptyState({ icon: Icon, title, description, height = 190 }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E8E7E2] dark:border-border rounded-lg bg-[#FAF9F5]/40 dark:bg-muted/10"
      style={{ height }}
    >
      {Icon && (
        <div className="size-10 rounded-full bg-[#EEEDFE] dark:bg-secondary text-[#534AB7] dark:text-primary-foreground flex items-center justify-center mb-3">
          <Icon size={18} />
        </div>
      )}
      <p className="text-[#1A1A18] dark:text-foreground font-semibold text-xs mb-1" style={{ fontSize: 13 }}>
        {title}
      </p>
      <p className="text-[#6B6B67] dark:text-muted-foreground max-w-[280px] leading-relaxed" style={{ fontSize: 11 }}>
        {description}
      </p>
    </div>
  );
}
