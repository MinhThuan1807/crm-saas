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