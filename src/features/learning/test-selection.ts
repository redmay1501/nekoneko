import { MAX_FOCUS_ITEMS } from './session-modes';

/** Số câu mỗi lần kiểm tra (mỗi câu một mục); ALL = mọi mục đã chọn (tối đa MAX_FOCUS_ITEMS). */
export const QUESTION_COUNTS = [5, 10, 20, 30, 50] as const;
export const ALL_QUESTIONS = 0;

/** Số câu thực sự sẽ có: đúng số đã chọn, hoặc ít hơn khi phạm vi không đủ mục (giao diện báo rõ). */
export function questionCountFor(requested: number, available: number): number {
  const limit = Math.min(available, MAX_FOCUS_ITEMS);
  return requested === ALL_QUESTIONS ? limit : Math.min(requested, limit);
}

/** Lấy ngẫu nhiên `count` mục KHÁC NHAU (Fisher–Yates) — bài kiểm tra có đúng chừng đó câu. */
export function pickTestKeys<T>(keys: readonly T[], count: number, random: () => number = Math.random): T[] {
  const unique = [...new Set(keys)];
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [unique[index], unique[other]] = [unique[other], unique[index]];
  }
  return unique.slice(0, Math.max(0, count));
}
