'use client';

import { ALL_QUESTIONS, questionCountOptions, resolveQuestionCount } from '@/features/learning/question-count';

/**
 * Chọn số câu cho một lượt (Luyện nghe, Nghe – gõ). Hiện số câu khả dụng của phạm vi đang chọn;
 * lựa chọn lớn hơn số câu có thật thì không hiện (không lặp câu cho đủ số).
 */
export function QuestionCountPicker({ available, value, onChange, unit = 'câu', availableLabel }: {
  available: number;
  /** Số câu đã chọn (0 = tất cả). */
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Mô tả số khả dụng thay cho "có N câu khả dụng" (vd. "có 40 từ · 12 câu"). */
  availableLabel?: string;
}) {
  const options = questionCountOptions(available);
  if (!options.length) return null;
  const actual = resolveQuestionCount(value, available);
  const selected = options.some((option) => option.value === value) ? value : ALL_QUESTIONS;
  return (
    <div className="question-count" role="group" aria-label="Số câu mỗi lượt">
      <span className="tiny muted">Số câu mỗi lượt · {availableLabel ?? `có ${available} ${unit} khả dụng`}</span>
      <div className="row wrap mt-1" style={{ gap: 6 }}>
        {options.map((option) => (
          <button key={option.value} type="button" className={`chip ${selected === option.value ? 'pink' : ''}`} aria-pressed={selected === option.value}
            onClick={() => onChange(option.value)}>{option.label}</button>
        ))}
      </div>
      {value !== ALL_QUESTIONS && value > available ? <p className="tiny muted mt-1">Phạm vi này chỉ có {available} {unit} — lượt này làm {actual} {unit}.</p> : null}
    </div>
  );
}
