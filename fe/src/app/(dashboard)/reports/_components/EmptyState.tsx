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
      className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E8E7E2] rounded-lg bg-[#FAF9F5]/40"
      style={{ height }}
    >
      {Icon && (
        <div className="size-10 rounded-full bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center mb-3">
          <Icon size={18} />
        </div>
      )}
      <p className="text-[#1A1A18] font-semibold text-xs mb-1" style={{ fontSize: 13 }}>
        {title}
      </p>
      <p className="text-[#6B6B67] max-w-[280px] leading-relaxed" style={{ fontSize: 11 }}>
        {description}
      </p>
    </div>
  );
}
