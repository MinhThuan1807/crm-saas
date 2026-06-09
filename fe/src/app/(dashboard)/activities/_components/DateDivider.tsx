"use client";

export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span
        className="px-3 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap"
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
