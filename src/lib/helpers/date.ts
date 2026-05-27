const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dayName = DAY_NAMES[d.getDay()];
  const dateStr = d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${dayName}, ${dateStr}`;
}

export function formatTime(value: string | null): string {
  if (!value) return "--:--";
  // SQL returns "HH:mm:ss" directly via CONVERT(VARCHAR(8), ..., 108)
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  // Fallback for ISO datetime strings
  const d = new Date(value);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const day = now.getDate();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (day <= 20) {
    return {
      fromDate: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 21)),
      toDate: fmt(new Date(now.getFullYear(), now.getMonth(), 20)),
    };
  }
  return {
    fromDate: fmt(new Date(now.getFullYear(), now.getMonth(), 21)),
    toDate: fmt(now),
  };
}
