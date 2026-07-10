// Import API types — source of truth from validation schema
import type { ActivityItem as ApiActivityItem } from "@/lib/validations/activities.scheme";

// Re-export ActivityItem from API schema to use in all activities components
export type { ActivityItem } from "@/lib/validations/activities.scheme";

// ActivityType uppercase theo API (CALL | EMAIL | MEETING | NOTE)
export type ActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";

// ActivityGroup — group activities by calendar day
export interface ActivityGroup {
  date: string; // "yyyy-MM-dd" — used for sorting and as key
  dateLabel: string; // "Today — June 8, 2026" — display
  items: ApiActivityItem[];
}

// TYPE_META — metadata for badge and icon according to uppercase API enum
export const TYPE_META: Record<
  ActivityType,
  {
    label: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  CALL: {
    label: "Cuộc gọi",
    iconBg: "#E1F5EE",
    iconColor: "#16A05B",
    badgeBg: "#E1F5EE",
    badgeText: "#16A05B",
  },
  EMAIL: {
    label: "Email",
    iconBg: "#EEEDFE",
    iconColor: "#534AB7",
    badgeBg: "#EEEDFE",
    badgeText: "#534AB7",
  },
  MEETING: {
    label: "Gặp mặt",
    iconBg: "#FAEEDA",
    iconColor: "#B45309",
    badgeBg: "#FAEEDA",
    badgeText: "#B45309",
  },
  NOTE: {
    label: "Ghi chú",
    iconBg: "#F1EFE8",
    iconColor: "#6B6B67",
    badgeBg: "#F1EFE8",
    badgeText: "#6B6B67",
  },
};

// TOP_STAFF was deleted — calculated dynamically in SummaryPanel
// from all unfiltered activities data