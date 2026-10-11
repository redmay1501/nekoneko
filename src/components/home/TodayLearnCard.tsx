import Link from 'next/link';
import { NekoButton } from '@/components/common/NekoButton';
import Image from 'next/image';
import { CompleteDayButton } from '@/components/roadmap/CompleteDayButton';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import type { SessionPlanPreview } from '@/features/learning/session-engine';
import { SESSION_PHASES, SESSION_PHASE_INFO, type SessionPhase } from '@/features/learning/session-types';
import type { ReactNode } from 'react';

interface TodayLearnCardProps {
  journeyDay: number;
  dayTitle: string;
  dailyMinutes: number;
  /** Kiến thức mới còn chờ của ngày, đếm theo loại: [{ label: 'từ vựng', count: 22 }, …]. */
  newByType: Array<{ label: string; count: number }>;
  hasNewKnowledge: boolean;
  /** Đã học hết kiến thức của ngày → mời người học tự xác nhận hoàn thành (app không tự chuyển ngày). */
  isReadyToComplete: boolean;
  /** Phiên "Bắt đầu học" kế tiếp gồm gì: Gặp lại → Học bù → Mới → Dùng thử (đếm kiến thức thật). */
  plan: SessionPlanPreview;
}

/** Nhãn kế hoạch — nói rõ mỗi con số là gì (số KIẾN THỨC, không phải số câu hỏi). */
const PLAN_TEXT: Record<SessionPhase, (count: number) => ReactNode> = {
  review: (count) => <>Ôn <b>{count}</b> thứ đã học</>,
  backlog: (count) => <>Học bù <b>{count}</b> thứ ngày trước</>,
  new: (count) => <><b>{count}</b> thứ mới hôm nay</>,
  use: (count) => <>Dùng thử <b>{count}</b> câu</>,
};

/** Thẻ chính của Trang chủ: hôm nay học gì + MỘT nút lớn để bắt đầu. */
export function TodayLearnCard(props: TodayLearnCardProps) {
  const { journeyDay, dayTitle, dailyMinutes, newByType, hasNewKnowledge, isReadyToComplete, plan } = props;
  const planParts = SESSION_PHASES.filter((phase) => plan[phase] > 0);
  return (
    <section className="dash-card dash-today" aria-labelledby="dash-today-title">
      <Image src="/illustrations/home-study.webp" alt="" width={420} height={350} sizes="(max-width: 767px) 88px, 94px" className="dash-today-mascot" />
      <div className="dash-today-body">
        <h2 id="dash-today-title">{isReadyToComplete ? `Đã học hết ngày ${journeyDay} 🎉` : 'Học hôm nay'}</h2>
        <p className="dash-meta">Ngày {journeyDay} · {hasNewKnowledge ? dayTitle : 'Ngày ôn tập'}</p>
        {planParts.length && !isReadyToComplete ? (
          <ul className="dash-plan" aria-label="Phiên học kế tiếp gồm">
            {planParts.map((phase) => (
              <li key={phase}>
                <EmojiIcon emoji={SESSION_PHASE_INFO[phase].emoji} size={16} />{' '}
                {/* Phần mới: nói gọn theo loại ("2 Kanji · 22 từ vựng") thay vì liệt kê từng chữ. */}
                {phase === 'new' && newByType.length
                  ? newByType.map((part, index) => <span key={part.label}>{index ? ' · ' : ''}<b>{part.count}</b> {part.label}</span>)
                  : PLAN_TEXT[phase](plan[phase])}
              </li>
            ))}
          </ul>
        ) : null}

        {isReadyToComplete ? (
          <>
            <div className="dash-actions">
              <CompleteDayButton day={journeyDay} isPrimary />
              <Link href="/hoc/daily" className="dash-action-secondary">Ôn lại · {dailyMinutes} phút</Link>
            </div>
          </>
        ) : (
          <div className="dash-actions">
            <NekoButton href="/hoc/daily" prefetch variant={hasNewKnowledge ? 'primary' : 'review'} className="dash-neko-cta"
              leftIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>}>
              {hasNewKnowledge ? 'Bắt đầu học' : 'Ôn ngay'}
            </NekoButton>
          </div>
        )}
        {/* Ngày ôn tập không có kiến thức mới để "học hết" → ôn xong thì tự hoàn thành. */}
        {hasNewKnowledge ? null : <CompleteDayButton day={journeyDay} />}
      </div>
    </section>
  );
}
