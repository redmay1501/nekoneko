/**
 * Ngày ôn & chuỗi ngày — tính từ danh sách NGÀY (yyyy-mm-dd, giờ Việt Nam) mà người học có ít nhất một lần nhớ lại đúng.
 *
 *  - recallDays     : số ngày có ôn trong 30 ngày gần nhất ("Đã ôn N ngày" trên thanh trên cùng).
 *  - currentStreak  : số ngày LIÊN TIẾP tới hôm nay; hôm nay chưa ôn thì tính tới hôm qua (chưa đứt chuỗi).
 *  - longestStreak  : chuỗi dài nhất từng có — thành tích "Chuỗi 7 ngày" dựa vào đây nên đạt rồi không mất.
 */

/** Ngày học theo giờ Việt Nam: 23h ôn bài là "hôm nay", không bị tính sang ngày mai như giờ UTC. */
export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const RECALL_DAYS_WINDOW = 30;

const DATE_KEY_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** yyyy-mm-dd của thời điểm này theo giờ Việt Nam. */
export function appDateKey(date: Date): string {
  return DATE_KEY_FORMAT.format(date);
}

/** Lùi/tiến một số ngày trên lịch (không phụ thuộc giờ). */
function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface RecallStreak {
  recallDays: number;
  currentStreak: number;
  longestStreak: number;
}

export function summarizeRecallDates(dateKeys: readonly string[], now: Date): RecallStreak {
  const days = [...new Set(dateKeys)].sort();
  const today = appDateKey(now);
  const windowStart = shiftDateKey(today, -(RECALL_DAYS_WINDOW - 1));
  const recallDays = days.filter((day) => day >= windowStart && day <= today).length;

  let longestStreak = 0;
  let run = 0;
  for (let index = 0; index < days.length; index++) {
    run = index > 0 && shiftDateKey(days[index - 1], 1) === days[index] ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  const present = new Set(days);
  let cursor = present.has(today) ? today : shiftDateKey(today, -1);
  let currentStreak = 0;
  while (present.has(cursor)) {
    currentStreak++;
    cursor = shiftDateKey(cursor, -1);
  }
  return { recallDays, currentStreak, longestStreak };
}
