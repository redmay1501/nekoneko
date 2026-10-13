'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';

interface FlashcardsProps<T extends { key: string }> {
  cards: readonly T[];
  /** "từ", "mẫu", "chữ" — trong "5/20 từ". */
  unit: string;
  front: (card: T) => ReactNode;
  back: (card: T) => ReactNode;
  audioText?: (card: T) => string;
  /** Hành động riêng của thẻ, đặt dưới thẻ (ví dụ: xem nét viết). */
  footer?: (card: T) => ReactNode;
  marked: ReadonlySet<string>;
  onToggleMark: (key: string) => void;
}

/**
 * Thẻ lật: mặt trước (chữ / từ / mẫu) → chạm để lật xem nghĩa, cách đọc, ví dụ. Trước / Sau, phím ← → và Space.
 * XEM thẻ không ghi trí nhớ (chỉ trả lời quiz mới ghi) — "Đánh dấu ôn" đưa mục vào bước Ôn tập.
 */
export function Flashcards<T extends { key: string }>({ cards, unit, front, back, audioText, footer, marked, onToggleMark }: FlashcardsProps<T>) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const card = cards[Math.min(index, cards.length - 1)];

  function go(step: number) {
    setIndex((current) => Math.min(Math.max(current + step, 0), cards.length - 1));
    setIsFlipped(false);
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]') || document.querySelector('.sheet.on')) return;
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === ' ' && !target?.closest('button, a[href]')) {
        event.preventDefault();
        setIsFlipped((current) => !current);
      } else return;
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!card) return null;
  const isMarked = marked.has(card.key);
  return (
    <section className="flashcards" aria-label="Thẻ học">
      <div className="between">
        <span className="sm"><b>{index + 1}</b>/{cards.length} {unit}</span>
        <div className="row" style={{ gap: 6 }}>
          {audioText ? <AudioButton text={audioText(card)} showText /> : null}
          <button type="button" className={`btn sm ${isMarked ? 'review' : 'ghost'}`} aria-pressed={isMarked} onClick={() => onToggleMark(card.key)}>
            {isMarked ? '★ Đã đánh dấu' : '☆ Đánh dấu ôn'}
          </button>
        </div>
      </div>
      <div className="study-progress mt-2" aria-hidden="true"><span style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div>
      <div role="button" tabIndex={0} className={`flashcard ${isFlipped ? 'is-flipped' : ''}`} title={isFlipped ? 'Xem mặt trước' : 'Lật thẻ xem nghĩa'}
        onClick={() => setIsFlipped((current) => !current)}
        onKeyDown={(event) => { if (event.key === 'Enter') setIsFlipped((current) => !current); }}>
        {isFlipped ? <div className="flashcard-back">{back(card)}</div> : <div className="flashcard-front">{front(card)}<span className="tiny muted flashcard-hint">Chạm để lật</span></div>}
      </div>
      {footer ? footer(card) : null}
      <div className="flashcard-nav">
        <button type="button" className="btn ghost" onClick={() => go(-1)} disabled={index === 0}>← Trước</button>
        <button type="button" className="btn" onClick={() => go(1)} disabled={index >= cards.length - 1}>Sau →</button>
      </div>
    </section>
  );
}
