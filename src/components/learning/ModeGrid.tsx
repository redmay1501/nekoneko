import Link from 'next/link';
import { PICKABLE_MODES, SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { EmojiIcon } from '@/components/common/EmojiIcon';

interface ModeGridProps {
  /** Khay "Học ngay" thêm ô Luyện tập ở cuối (prototype modesGrid(true)). */
  includePracticeLink?: boolean;
  onNavigate?: () => void;
}

/** Lưới các kiểu học — mọi ô đều dẫn tới cùng một phiên học /hoc/[mode]. */
export function ModeGrid({ includePracticeLink = false, onNavigate }: ModeGridProps) {
  return (
    <div className="modes">
      {PICKABLE_MODES.map((mode) => {
        const config = SESSION_MODE_CONFIG[mode];
        return (
          <Link key={mode} href={`/hoc/${mode}`} className="mode" style={{ background: config.cardBackground }} onClick={onNavigate}>
            <span className="e"><EmojiIcon emoji={config.emoji} size={34} /></span>
            <b>{config.label}</b>
            <span>{config.description}</span>
          </Link>
        );
      })}
      {includePracticeLink ? (
        <Link href="/luyen-tap" className="mode" style={{ background: '#FFF9F2' }} onClick={onNavigate}>
          <span className="e" aria-hidden="true">🎧</span>
          <b>Luyện tập</b>
          <span>Nghe · nói · đọc · viết.</span>
        </Link>
      ) : null}
    </div>
  );
}
