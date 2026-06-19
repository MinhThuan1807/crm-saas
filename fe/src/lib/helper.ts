export function relativeTime(dateStr: string | Date): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "1 ngày trước";
  if (diff < 7) return `${diff} ngày trước`;
  if (diff < 14) return "1 tuần trước";
  if (diff < 21) return "2 tuần trước";
  if (diff < 28) return "3 tuần trước";
  if (diff < 60) return "1 tháng trước";
  if (diff < 90) return "2 tháng trước";
  return `${Math.floor(diff / 30)} tháng trước`;
}

export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function getInitials(name: string): string {
  // Tách tên thành các phần bằng khoảng trắng
  const parts = name.trim().split(/\s+/);
  // Nếu chỉ có 1 từ, lấy 2 ký tự đầu: "NGUYỄN" → "NG"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  
  // Lấy ký tự đầu của 2 từ cuối: "NGUYỄN MINH THUẬN" → "M" + "T" = "MT"
  const second = parts[parts.length - 2];
  const last   = parts[parts.length - 1];
  return (second[0] + last[0]).toUpperCase();
}

export function formatCurrency(value: number, locale = "vi-VN", currency = "VND"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export const AVATAR_COLORS = [
  { bg: '#D4F5E4', color: '#1A5C38' }, // Greenish
  { bg: '#D4E8F5', color: '#1A4C6A' }, // Bluish
  { bg: '#F5D4D4', color: '#6A1A1A' }, // Reddish
  { bg: '#FFF0D4', color: '#6A400A' }, // Orangish
  { bg: '#EEE8FD', color: '#3D2D8A' }, // Purplish
];

export function getAvatarColors(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export const STAGE_COLORS = {
  PROSPECT: { funnel: '#C4C0F0', bg: '#EEEDFE', text: '#534AB7', label: 'Prospect' },
  QUALIFIED: { funnel: '#9B94E3', bg: '#E6F4D7', text: '#3B6D11', label: 'Qualified' },
  PROPOSAL: { funnel: '#7168CC', bg: '#FEF3E2', text: '#854F0B', label: 'Proposal' },
  CLOSED_WON: { funnel: '#534AB7', bg: '#DCFCE7', text: '#166534', label: 'Closed Won' },
  CLOSED_LOST: { funnel: '#E11D48', bg: '#FEE2E2', text: '#A32D2D', label: 'Closed Lost' },
} as const;

export const ACTIVITY_CONFIG = {
  CALL: { bg: '#E6F4D7', color: '#3B6D11', label: 'Call' },
  EMAIL: { bg: '#EEEDFE', color: '#534AB7', label: 'Email' },
  MEETING: { bg: '#FEF3E2', color: '#854F0B', label: 'Meeting' },
  NOTE: { bg: '#F1EFE8', color: '#6B6B67', label: 'Note' },
} as const;

export function formatVndShort(value: number): string {
  if (value >= 1e9) {
    const b = value / 1e9;
    return `${Number(b.toFixed(1))} tỷ`;
  }
  if (value >= 1e6) {
    const m = value / 1e6;
    return `${Number(m.toFixed(1))}tr`;
  }
  if (value >= 1e3) {
    const k = value / 1e3;
    return `${Number(k.toFixed(1))}k`;
  }
  return `${value}`;
}

export function formatDateVi(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Hôm nay ${timeStr}`;
  } else if (isTomorrow) {
    return `Ngày mai ${timeStr}`;
  } else {
    return `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`;
  }
}