'use client';

import Link from 'next/link';
import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';

/** Vuốt ngang tối thiểu để chuyển thẻ (px), hoặc búng nhanh (px/ms) qua quãng ngắn hơn. */
const SWIPE_DISTANCE = 56;
const SWIPE_FLICK_SPEED = 0.45;
const SWIPE_FLICK_MIN = 24;
/** Bắt đầu coi là vuốt ngang khi đã đi quá ngưỡng này VÀ ngang nhiều hơn dọc (dọc → để trang cuộn). */
const SWIPE_LOCK = 10;

function readSavedIndex(storageKey: string | undefined, count: number): number {
  if (!storageKey) return 0;
  try {
    const saved = Number(sessionStorage.getItem(storageKey));
    return Number.isInteger(saved) && saved >= 0 && saved < count ? saved : 0;
  } catch {
    return 0;
  }
}

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
  /** Ở thẻ CUỐI: nút đi tiếp (sang bài ôn của bước / bước sau) thay cho nút "Sau" bị mờ. */
  endActions?: ReactNode;
  /** "Luyện viết chữ này": trang luyện viết của đúng thẻ đang xem; null = thẻ chưa có nội dung luyện viết. */
  writingHref?: (card: T) => string | null;
  /** Nhớ thẻ đang xem trong phiên (sessionStorage) — đi luyện viết rồi quay lại vẫn đúng thẻ. */
  storageKey?: string;
}

/**
 * Thẻ lật: mặt trước (chữ / từ / mẫu) → chạm để lật xem nghĩa, cách đọc, ví dụ. Trước / Sau, phím ← → và Space,
 * vuốt ngang (trái = thẻ sau, phải = thẻ trước). Chạm = lật; vuốt = chuyển thẻ — cú chạm kết thúc một lần vuốt không lật thẻ.
 * XEM thẻ không ghi trí nhớ (chỉ trả lời quiz mới ghi) — "Đánh dấu ôn" đưa mục vào bước Ôn tập.
 */
export function Flashcards<T extends { key: string }>({
  cards, unit, front, back, audioText, footer, marked, onToggleMark, endActions, writingHref, storageKey,
}: FlashcardsProps<T>) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ id: number; x: number; y: number; t: number; dx: number; locked: boolean } | null>(null);
  const suppressClick = useRef(false);
  const card = cards[Math.min(index, cards.length - 1)];

  // Đọc thẻ đã xem sau khi mount (server không có sessionStorage) → không lệch hydration.
  useEffect(() => setIndex(readSavedIndex(storageKey, cards.length)), [storageKey, cards.length]);

  function go(step: number) {
    const next = Math.min(Math.max(index + step, 0), cards.length - 1);
    if (next === index) return;
    setIndex(next);
    setIsFlipped(false);
    playEnter(step > 0 ? 'next' : 'prev');
    if (storageKey) try { sessionStorage.setItem(storageKey, String(next)); } catch { /* chế độ riêng tư — chỉ nhớ trong trang */ }
  }

  // Hiệu ứng thẻ mới trượt vào: gỡ rồi gắn lại class trên cùng phần tử (không đổi key → không dựng lại DOM của thẻ).
  function playEnter(direction: 'next' | 'prev') {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove('enter-next', 'enter-prev');
    void el.offsetWidth;
    el.classList.add(`enter-${direction}`);
  }

  function setOffset(dx: number) {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = dx ? `translate3d(${dx}px,0,0) rotate(${dx / 40}deg)` : '';
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Đang bấm nút / link / chọn chữ bên trong thẻ → không phải vuốt.
    if ((event.target as HTMLElement).closest('button, a[href], input, textarea, select, [data-no-swipe]')) return;
    if (window.getSelection()?.toString()) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), dx: 0, locked: false };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = swipe.current;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.x, dy = event.clientY - state.y;
    if (!state.locked) {
      if (Math.abs(dy) > SWIPE_LOCK && Math.abs(dy) >= Math.abs(dx)) { swipe.current = null; return; } // cuộn dọc
      if (Math.abs(dx) < SWIPE_LOCK) return;
      state.locked = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    }
    // Hai đầu (thẻ đầu vuốt phải, thẻ cuối vuốt trái): kéo nặng tay, thả ra bật về.
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index >= cards.length - 1);
    state.dx = atEdge ? dx * 0.25 : dx;
    setOffset(state.dx);
  }

  function endSwipe(event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const state = swipe.current;
    if (!state || state.id !== event.pointerId) return;
    swipe.current = null;
    if (!state.locked) return;
    event.currentTarget.classList.remove('is-dragging');
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    const speed = Math.abs(state.dx) / Math.max(1, performance.now() - state.t);
    const passed = Math.abs(state.dx) >= SWIPE_DISTANCE || (speed >= SWIPE_FLICK_SPEED && Math.abs(state.dx) >= SWIPE_FLICK_MIN);
    setOffset(0);
    if (!cancelled && passed) go(state.dx < 0 ? 1 : -1);
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
      <div ref={cardRef} role="button" tabIndex={0} aria-roledescription="thẻ học — chạm để lật, vuốt ngang để chuyển thẻ"
        className={`flashcard ${isFlipped ? 'is-flipped' : ''}`} title={isFlipped ? 'Xem mặt trước' : 'Lật thẻ xem nghĩa'}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={(event) => endSwipe(event, false)} onPointerCancel={(event) => endSwipe(event, true)}
        onClick={() => { if (!suppressClick.current) setIsFlipped((current) => !current); }}
        onKeyDown={(event) => { if (event.key === 'Enter') setIsFlipped((current) => !current); }}>
        {isFlipped ? <div className="flashcard-back">{back(card)}</div> : <div className="flashcard-front">{front(card)}<span className="tiny muted flashcard-hint">Chạm để lật</span></div>}
      </div>
      {footer ? footer(card) : null}
      {writingHref ? (() => {
        const href = writingHref(card);
        const what = unit === 'từ' ? 'từ' : unit === 'bộ' ? 'bộ' : 'chữ';
        return href
          ? <Link className="btn ghost sm flashcard-write" href={href}>✍️ Luyện viết {what} này</Link>
          : <p className="tiny muted flashcard-write">Chưa có trang luyện viết cho {what} này.</p>;
      })() : null}
      <div className="flashcard-nav">
        <button type="button" className="btn ghost" onClick={() => go(-1)} disabled={index === 0}>← Trước</button>
        {index >= cards.length - 1 && endActions ? null : (
          <button type="button" className="btn" onClick={() => go(1)} disabled={index >= cards.length - 1}>Sau →</button>
        )}
      </div>
      {index >= cards.length - 1 && endActions ? <div className="flashcard-end">{endActions}</div> : null}
    </section>
  );
}
