const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Số ngày trọn vẹn từ `from` tới `to` (làm tròn xuống, không âm). */
export function wholeDaysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

/** yyyy-mm-dd theo UTC — định dạng của cột kiểu `date` trong PostgreSQL. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
