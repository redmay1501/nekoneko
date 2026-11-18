/**
 * Số câu cho một lượt luyện nghe / nghe – gõ: người học tự chọn, dựa trên số câu THỰC SỰ tạo được từ phạm vi đang chọn.
 * Không bao giờ hứa nhiều hơn số câu khả dụng (không lặp câu âm thầm): lựa chọn lớn hơn bị bỏ, luôn có "Tất cả (N)".
 */
export const QUESTION_COUNT_STEPS = [5, 10, 15, 20, 30, 50] as const;
/** Giá trị đặc biệt: làm hết mọi câu của phạm vi. */
export const ALL_QUESTIONS = 0;

export interface QuestionCountOption {
  value: number;
  label: string;
}

export function questionCountOptions(available: number): QuestionCountOption[] {
  if (available <= 0) return [];
  const steps = QUESTION_COUNT_STEPS.filter((count) => count < available).map((count) => ({ value: count, label: `${count} câu` }));
  return [...steps, { value: ALL_QUESTIONS, label: `Tất cả (${available})` }];
}

/** Số câu thật của lượt: lựa chọn (0 = tất cả), không vượt quá số câu khả dụng. */
export function resolveQuestionCount(requested: number, available: number): number {
  if (available <= 0) return 0;
  if (requested === ALL_QUESTIONS || !Number.isFinite(requested) || requested <= 0) return available;
  return Math.min(Math.floor(requested), available);
}
