// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtTr(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")} tỷ`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}tr`;
  return `${v}`;
}

// ── Revenue by month (bar + line combo) ──────────────────────────────────────
export const revenueByMonth = [
  { month: "T1", actual: 120000, target: 160000 },
  { month: "T2", actual: 145000, target: 160000 },
  { month: "T3", actual: 138000, target: 160000 },
  { month: "T4", actual: 162000, target: 160000 },
  { month: "T5", actual: 160000, target: 160000 },
];

// ── Forecast vs actual (cumulative) ──────────────────────────────────────────
export const forecastData = [
  { month: "T1", cumActual: 140000, cumForecast: 130000 },
  { month: "T2", cumActual: 295000, cumForecast: 275000 },
  { month: "T3", cumActual: 453000, cumForecast: 432000 },
  { month: "T4", cumActual: 620000, cumForecast: 592000 },
  { month: "T5", cumActual: 820000, cumForecast: 750000 },
];

// ── Deals by source ──────────────────────────────────────────────────────────
export const dealsBySourceData = [
  { source: "Referral", deals: 32, value: 620000 },
  { source: "Web",      deals: 28, value: 480000 },
  { source: "Event",    deals: 18, value: 310000 },
  { source: "Partner",  deals: 14, value: 260000 },
  { source: "Other",    deals:  9, value: 180000 },
];

// ── Win/Loss by stage ─────────────────────────────────────────────────────────
export const winLossData = [
  { stage: "Prospect",  win: 68, loss: 32 },
  { stage: "Qualified", win: 65, loss: 35 },
  { stage: "Proposal",  win: 55, loss: 45 },
  { stage: "Closed",    win: 82, loss: 18 },
];

// ── Revenue by industry (donut) ───────────────────────────────────────────────
export const industryData = [
  { name: "Tech",       value: 35, color: "#534AB7" },
  { name: "Finance",    value: 22, color: "#7F77DD" },
  { name: "Retail",     value: 18, color: "#AFA9EC" },
  { name: "Healthcare", value: 15, color: "#1D9E75" },
  { name: "Other",      value: 10, color: "#D1CFED" },
];

// ── Top closed deals ──────────────────────────────────────────────────────────
export const topDeals = [
  {
    id: 1, name: "Security Audit Platform",
    company: "Ngân hàng JKL",
    ownerI: "TH", ownerBg: "#D4E8F5", ownerC: "#1A5C7A", owner: "Trần Thị Hương",
    value: "480tr", closedAt: "26/05/2026", source: "Referral", stage: "CLOSED_WON",
  },
  {
    id: 2, name: "ERP Implementation",
    company: "Tập đoàn MNO",
    ownerI: "NQ", ownerBg: "#EDD4F5", ownerC: "#5A1A7A", owner: "Nguyễn Quang",
    value: "420tr", closedAt: "22/05/2026", source: "Web", stage: "CLOSED_WON",
  },
  {
    id: 3, name: "Cloud Migration Project",
    company: "Công ty PQR",
    ownerI: "PL", ownerBg: "#D4F5E0", ownerC: "#1A7A3C", owner: "Phạm Thị Lan",
    value: "380tr", closedAt: "18/05/2026", source: "Event", stage: "CLOSED_WON",
  },
  {
    id: 4, name: "HR Management System",
    company: "Tập đoàn STU",
    ownerI: "VM", ownerBg: "#F5E8D4", ownerC: "#7A4A1A", owner: "Vũ Đức Minh",
    value: "320tr", closedAt: "15/05/2026", source: "Referral", stage: "CLOSED_WON",
  },
  {
    id: 5, name: "Data Analytics Dashboard",
    company: "Cty TNHH VWX",
    ownerI: "LT", ownerBg: "#F5D4D4", ownerC: "#7A1A1A", owner: "Lê Thị Thu",
    value: "280tr", closedAt: "10/05/2026", source: "Partner", stage: "CLOSED_WON",
  },
  {
    id: 6, name: "Payment Gateway Integration",
    company: "Ngân hàng XYZ",
    ownerI: "TH", ownerBg: "#D4E8F5", ownerC: "#1A5C7A", owner: "Trần Thị Hương",
    value: "240tr", closedAt: "05/05/2026", source: "Referral", stage: "CLOSED_WON",
  },
];

// ── Team Performance data ───────────────────────────────────────────────────
export const teamPerformanceData = [
  { name: "Trần Thị Hương", initials: "TH", bg: "#D4E8F5", text: "#1A5C7A", actual: 820000, target: 800000, winRate: 38.5, activities: 245, avgDaysToClose: 18 },
  { name: "Nguyễn Quang", initials: "NQ", bg: "#EDD4F5", text: "#5A1A7A", actual: 640000, target: 750000, winRate: 31.2, activities: 198, avgDaysToClose: 24 },
  { name: "Phạm Thị Lan", initials: "PL", bg: "#D4F5E0", text: "#1A7A3C", actual: 580000, target: 500000, winRate: 35.0, activities: 210, avgDaysToClose: 21 },
  { name: "Vũ Đức Minh", initials: "VM", bg: "#F5E8D4", text: "#7A4A1A", actual: 520000, target: 500000, winRate: 29.4, activities: 185, avgDaysToClose: 26 },
  { name: "Lê Thị Thu", initials: "LT", bg: "#F5D4D4", text: "#7A1A1A", actual: 480000, target: 600000, winRate: 27.8, activities: 160, avgDaysToClose: 28 },
];

// ── Conversion Funnel data ───────────────────────────────────────────────────
export const conversionFunnelData = [
  { stage: "1. Lead", count: 120, value: 3600000, percentage: 100, color: "#534AB7" },
  { stage: "2. Contacted", count: 84, value: 2520000, percentage: 70, color: "#6C63D3" },
  { stage: "3. Qualified", count: 54, value: 1620000, percentage: 45, color: "#877EF2" },
  { stage: "4. Proposal", count: 32, value: 960000, percentage: 26, color: "#A39BFB" },
  { stage: "5. Won", count: 18, value: 540000, percentage: 15, color: "#1D9E75" },
];

// ── Weighted Forecast data (cumulative) ──────────────────────────────────────
export const weightedForecastData = [
  { month: "T1", actual: 120000, forecast: 110000, target: 150000 },
  { month: "T2", actual: 265000, forecast: 250000, target: 300000 },
  { month: "T3", actual: 403000, forecast: 390000, target: 450000 },
  { month: "T4", actual: 565000, forecast: 550000, target: 600000 },
  { month: "T5", actual: 725000, forecast: 710000, target: 750000 },
  { month: "T6", forecast: 880000, target: 900000 },
  { month: "T7", forecast: 1050000, target: 1050000 },
];

// ── Activity Trend data ──────────────────────────────────────────────────────
export const activityTrendData = [
  { name: "T1", Calls: 240, Emails: 380, Meetings: 45, Tasks: 120 },
  { name: "T2", Calls: 280, Emails: 410, Meetings: 52, Tasks: 140 },
  { name: "T3", Calls: 260, Emails: 390, Meetings: 48, Tasks: 135 },
  { name: "T4", Calls: 310, Emails: 450, Meetings: 60, Tasks: 160 },
  { name: "T5", Calls: 350, Emails: 480, Meetings: 68, Tasks: 180 },
];

// ── Activity Status distribution ─────────────────────────────────────────────
export const activityStatusData = [
  { name: "Đã xong", value: 78, color: "#1D9E75" },
  { name: "Quá hạn", value: 14, color: "#D85A30" },
  { name: "Đang chờ", value: 8, color: "#FBBF24" },
];

