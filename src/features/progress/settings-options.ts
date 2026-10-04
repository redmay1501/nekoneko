/** Lựa chọn mục tiêu mỗi ngày — "mức tối thiểu được dẫn dắt" (prototype màn Cài đặt). 0 = không giới hạn. */
export const DAILY_GOAL_OPTIONS = [
  { minutes: 5, label: '5 phút' },
  { minutes: 8, label: '8 phút' },
  { minutes: 15, label: '15 phút' },
  { minutes: 0, label: 'Không giới hạn' },
] as const;

export const DEFAULT_REMINDER_TIME = '20:30';

/** Số phút hiển thị ở Trang chủ. "Không giới hạn" vẫn gợi ý mức tối thiểu của phiên hôm nay. */
export function displayedDailyMinutes(dailyMinutes: number, defaultMinutes: number): number {
  return dailyMinutes > 0 ? dailyMinutes : defaultMinutes;
}
