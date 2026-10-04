import Link from 'next/link';
import { ProgressBar } from '@/components/common/ProgressBar';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import type { ProgressRow } from '@/features/progress/progress-summary';
import { JOURNEY_TOTAL_DAYS, journeyProgressPercent, stageOfDay } from '@/features/roadmap/journey';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** Thẻ "Lộ trình JLPT N5" đầy đủ (prototype n5Card) — dùng ở Hồ sơ. */
export function N5JourneyCard({ journeyDay, rows }: { journeyDay: number; rows: ProgressRow[] }) {
  const percent = journeyProgressPercent(journeyDay);
  const stage = stageOfDay(journeyDay);
  return (
    <div className="card mt-3.5">
      <div className="between">
        <div className="row" style={{ gap: 8 }}><SpriteIcon name="sakura" size={20} /><h3>Lộ trình JLPT N5</h3></div>
        <span className="chip pink">Ngày {journeyDay} / {JOURNEY_TOTAL_DAYS}</span>
      </div>
      <ProgressBar percent={percent} label="Tiến độ lộ trình N5" className="my-3" />
      <div className="between">
        <span className="sm muted"><EmojiIcon emoji={stage.emoji} size={16} style={{ verticalAlign: '-3px' }} /> {stage.name} · {stage.subtitle}</span>
        <b className="sm" style={{ color: 'var(--sakura-deep)' }}>{percent}%</b>
      </div>
      <div className="row wrap mt-3" style={{ gap: 7 }}>
        {rows.map((row) => <span key={row.label} className="chip">{row.label} {row.done}/{row.total}</span>)}
      </div>
      <Link className="btn ghost sm mt-3.5" href="/lo-trinh">Xem lộ trình 90 ngày</Link>
    </div>
  );
}
