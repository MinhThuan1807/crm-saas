import React from "react";

export function SalesFlowLogo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl bg-primary shrink-0"
        style={{ width: 28, height: 28 }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 12C3 12 3 9 6.5 9C10 9 11 6.5 11 4.5C11 2.5 9 1.5 7 1.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 8.5C7 8.5 7 11.5 10 11.5C13 11.5 14 13.5 14 14.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <circle cx="14" cy="14.5" r="1.5" fill="white" fillOpacity="0.5" />
        </svg>
      </div>
      <span
        className="tracking-[-0.025em] text-foreground"
        style={{ fontSize: 17, fontWeight: 700 }}
      >
        SalesFlow
      </span>
    </div>
  );
}
