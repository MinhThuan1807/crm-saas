// Re-export từ deals.schema để dùng chung trong pipeline components
export { DealStage } from "@/lib/validations/deals.schema";
import type { DealCard, DealDetail, DealStage } from "@/lib/validations/deals.schema";

// Alias để các component dùng Stage thay vì DealStage (backward compat)
export type Stage = DealStage;

export type Deal = DealCard;
export type { DealDetail };

export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; badgeBg: string; badgeColor: string; dot: string }
> = {
  PROSPECT: {
    label: "Prospect",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    dot: "#3b82f6",
  },
  QUALIFIED: {
    label: "Qualified",
    badgeBg: "#f3e8ff",
    badgeColor: "#7e22ce",
    dot: "#a855f7",
  },
  PROPOSAL: {
    label: "Proposal",
    badgeBg: "#ffedd5",
    badgeColor: "#c2410c",
    dot: "#f97316",
  },
  CLOSED_WON: {
    label: "Closed Won",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    dot: "#22c55e",
  },
  CLOSED_LOST: {
    label: "Closed Lost",
    badgeBg: "#fee2e2",
    badgeColor: "#b91c1c",
    dot: "#ef4444",
  },
};

export const STAGES: DealStage[] = [
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
  createdAt: Date;
};
