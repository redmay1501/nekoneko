'use client';

import { type CSSProperties, useState } from 'react';

interface GuessOptionProps {
  label: string;
  isCorrect: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Một lựa chọn trong bài luyện nhanh (nghe, đọc, kiểm tra kana).
 * Chỉ phản hồi tại chỗ ✓ / ✕ — đây là luyện tập tự do, không ghi vào trí nhớ (giống prototype).
 * Có chữ ✓/✕ kèm màu để không chỉ dựa vào màu sắc.
 */
export function GuessOption({ label, isCorrect, className = 'tab', style }: GuessOptionProps) {
  const [isChosen, setIsChosen] = useState(false);
  const chosenStyle: CSSProperties = isChosen
    ? { background: isCorrect ? '#F1FAF3' : '#FFF4F5', borderColor: isCorrect ? 'var(--sage)' : '#FFBCC6' }
    : {};
  return (
    <button type="button" className={className} style={{ ...style, ...chosenStyle }} disabled={isChosen}
      onClick={() => setIsChosen(true)} aria-pressed={isChosen}>
      {label}
      {isChosen ? (isCorrect ? ' ✓' : ' ✕') : null}
    </button>
  );
}
