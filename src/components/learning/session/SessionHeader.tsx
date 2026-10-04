import Link from 'next/link';
import { SESSION_MODE_CONFIG, type SessionMode } from '@/features/learning/session-modes';
import { EmojiIcon } from '@/components/common/EmojiIcon';

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
