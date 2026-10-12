import Link from 'next/link';
import { NekoButton } from '@/components/common/NekoButton';
import { CompleteDayButton } from './CompleteDayButton';

interface DayActionsProps {
  day: number;
  relation: 'past' | 'today' | 'future';
  /** Kiến thức của ngày chưa gặp trong app. */
  remainingCount: number;
  hasNewKnowledge: boolean;
}

/**
 * Hành động chính của trang ngày, đặt ngay dưới phần giới thiệu:
 *  - hôm nay, còn kiến thức chưa học → "Học hết ngày N" (từng chặng 5 thứ); học hết rồi / ngày ôn → "Học ngày N" (phiên hằng ngày);
 *    kèm "Hoàn thành ngày" (nút phụ — hoàn thành ngày là người học tự xác nhận, không phải tự động khi học hết);
 *  - ngày đã qua → ôn lại thứ còn mờ; ngày chưa tới → không có gì để bấm.
 */
export function DayActions({ day, relation, remainingCount, hasNewKnowledge }: DayActionsProps) {
  if (relation === 'past') {
    return <div className="day-actions"><Link className="btn ghost" href="/hoc/rescue">🔁 Ôn lại những gì còn mờ</Link></div>;
  }
  if (relation !== 'today') return null;
  const isUnfinished = hasNewKnowledge && remainingCount > 0;
  return (
    <div className="day-actions">
      <NekoButton href={isUnfinished ? '/hoc/day' : '/hoc/daily'} prefetch variant={isUnfinished ? 'primary' : 'review'}
        leftIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>}>
        {isUnfinished ? `Học hết ngày ${day}` : hasNewKnowledge ? `Ôn lại ngày ${day}` : `Ôn tập ngày ${day}`}
      </NekoButton>
      <div className="day-actions-complete"><CompleteDayButton day={day} remainingCount={remainingCount} /></div>
    </div>
  );
}
