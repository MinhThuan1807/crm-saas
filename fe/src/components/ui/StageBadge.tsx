import { cn } from "@/lib/utils";

// ── Canonical stage type ────────────────────────────────────────────────────
import { DealStage } from "@/lib/validations/deals.schema";

export const STAGE_COLORS: Record<
  DealStage,
  { label: string; badgeClass: string; dot: string; bg: string; text: string }
> = {
  PROSPECT:    {
    label:      "Prospect",
    badgeClass: "bg-blue-100 text-blue-700",
    dot:        "#3b82f6",
    bg:         "#dbeafe",
    text:       "#1d4ed8",
  },
  QUALIFIED:   {
    label:      "Qualified",
    badgeClass: "bg-purple-100 text-purple-700",
    dot:        "#a855f7",
    bg:         "#f3e8ff",
    text:       "#7e22ce",
  },
  PROPOSAL:    {
    label:      "Proposal",
    badgeClass: "bg-orange-100 text-orange-700",
    dot:        "#f97316",
    bg:         "#ffedd5",
    text:       "#c2410c",
  },
  CLOSED_WON:  {
    label:      "Closed Won",
    badgeClass: "bg-green-100 text-green-700",
    dot:        "#22c55e",
    bg:         "#dcfce7",
    text:       "#15803d",
  },
  CLOSED_LOST: {
    label:      "Closed Lost",
    badgeClass: "bg-gray-100 text-gray-500",
    dot:        "#6b7280",
    bg:         "#f3f4f6",
    text:       "#6b7280",
  },
};


// ── Helper: normalise a loose stage string → DealStage key ─────────────────
// Accepts both "prospect" and "Prospect" and "Closed Won" etc.
export function normalizeStageName(raw: string): DealStage {
  const map: Record<string, DealStage> = {
    PROSPECT:    "PROSPECT",
    QUALIFIED:   "QUALIFIED",
    PROPOSAL:    "PROPOSAL",
    CLOSED_WON:  "CLOSED_WON",
    CLOSEDWON:   "CLOSED_WON",
    "CLOSED WON":"CLOSED_WON",
    CLOSED_LOST: "CLOSED_LOST",
    CLOSEDLOST:  "CLOSED_LOST",
    "CLOSED LOST":"CLOSED_LOST",
  };
  return map[raw.toLowerCase().replace(/ /g, "_")] ?? "PROSPECT";
}

// ── The reusable badge ──────────────────────────────────────────────────────
interface StageBadgeProps {
  /** Accepts a DealStage key ("prospect") or a loose display string ("Closed Won") */
  stage: DealStage | string;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const key = normalizeStageName(stage as string);
  const meta = STAGE_COLORS[key];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 whitespace-nowrap font-medium",
        meta.badgeClass,
        className
      )}
      style={{ fontSize: 12 }}
    >
      {meta.label}
    </span>
  );
}
