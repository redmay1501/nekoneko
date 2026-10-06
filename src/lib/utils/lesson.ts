/**
 * Số bài (Minna) từ nhãn bài: "Bài 10" / "BÀI 10 · Tồn tại…" → 10. Không có số → vô cực (xếp cuối).
 * Khoá bài trong database là chữ ("Bài 1", "Bài 10"…) — sắp theo chữ thì Bài 10 đứng trước Bài 2. Luôn sắp bằng số này.
 */
export function lessonNumber(label: string): number {
  const match = /\d+/.exec(label);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

export function byLessonNumber<T>(labelOf: (item: T) => string) {
  return (left: T, right: T) => lessonNumber(labelOf(left)) - lessonNumber(labelOf(right));
}
