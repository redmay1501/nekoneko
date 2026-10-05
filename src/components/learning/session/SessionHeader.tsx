import Link from 'next/link';
import { SESSION_MODE_CONFIG, type SessionMode } from '@/features/learning/session-modes';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { type PublicSessionStep, SESSION_PHASE_INFO, SESSION_PHASES, phaseOfStep } from '@/features/learning/session-types';

export function SessionHeader({ mode }: { mode: SessionMode }) {
  const config = SESSION_MODE_CONFIG[mode];
  return (
    <div className="between mb-3">
      <Link className="link" href="/">✕ Để sau</Link>
      <span className="chip"><EmojiIcon emoji={config.emoji} size={16} /> {config.label}</span>
    </div>
  );
}

export function SessionProgress({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <div className="s-prog" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={1} aria-valuemax={total} aria-valuenow={currentIndex + 1}>
      {Array.from({ length: total }, (_, index) => <i key={index} className={index <= currentIndex ? 'on' : ''} />)}
    </div>
  );
}

/**
 * Thanh chặng: Gặp lại → Học bù → Mới → Dùng thử — chỉ hiện các chặng phiên này có.
 * Chặng đang học hiện "đã làm / tổng", chặng đã xong có ✓ — người học luôn biết mình đang ở phần nào.
 */
export function SessionPhaseBar({ steps, currentIndex }: { steps: PublicSessionStep[]; currentIndex: number }) {
  const phases = SESSION_PHASES.filter((phase) => steps.some((step) => phaseOfStep(step) === phase));
  if (phases.length < 2) return null;
  const currentPhase = phaseOfStep(steps[currentIndex]);
  return (
    <ol className="s-phases" aria-label="Các chặng của phiên học">
      {phases.map((phase) => {
        const indexes = steps.flatMap((step, index) => (phaseOfStep(step) === phase ? [index] : []));
        const isCurrent = phase === currentPhase;
        const isDone = !isCurrent && indexes[indexes.length - 1] < currentIndex;
        // Đếm theo KIẾN THỨC (không theo bước): thẻ giới thiệu + câu luyện ngay cùng một chữ chỉ tính một — khớp màn chuyển chặng.
        const total = new Set(indexes.map((index) => steps[index].contentKey)).size;
        const position = new Set(indexes.filter((index) => index <= currentIndex).map((index) => steps[index].contentKey)).size;
        const info = SESSION_PHASE_INFO[phase];
        return (
          <li key={phase} className={`s-phase ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`} aria-current={isCurrent ? 'step' : undefined}>
            <EmojiIcon emoji={info.emoji} size={14} /> {info.label}
            {isCurrent ? <span className="s-phase-count">{position}/{total}</span> : null}
            {isDone ? <span aria-label="đã xong"> ✓</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
