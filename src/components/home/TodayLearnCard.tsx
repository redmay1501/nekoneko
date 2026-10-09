import Link from 'next/link';
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
  /** Chữ sẽ gặp ở phiên "Bắt đầu học" kế tiếp. */
  nextFaces: string[];
  /** Kiến thức mới của ngày còn chờ học. */
  pendingCount: number;
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
  const { journeyDay, dayTitle, dailyMinutes, nextFaces, pendingCount, hasNewKnowledge, isReadyToComplete, plan } = props;
  const planParts = SESSION_PHASES.filter((phase) => plan[phase] > 0);
  return (
    <section className="dash-card dash-today" aria-labelledby="dash-today-title">
      <Image src="/illustrations/home-study.webp" alt="" width={420} height={350} sizes="(max-width: 767px) 88px, 94px" className="dash-today-mascot" />
      <div className="dash-today-body">
        <h2 id="dash-today-title">{isReadyToComplete ? `Đã học hết ngày ${journeyDay} 🎉` : 'Học hôm nay'}</h2>
        <p className="dash-meta">Ngày {journeyDay} · {hasNewKnowledge ? dayTitle : 'Ngày ôn tập'}</p>
        <p className="dash-meta">{dailyMinutes} phút · Nhẹ nhàng · Hiệu quả lâu dài</p>
        {planParts.length && !isReadyToComplete ? (
          <ul className="dash-plan" aria-label="Phiên học kế tiếp gồm">
            {planParts.map((phase) => (
              <li key={phase}>
                <EmojiIcon emoji={SESSION_PHASE_INFO[phase].emoji} size={16} /> {PLAN_TEXT[phase](plan[phase])}
              </li>
            ))}
          </ul>
        ) : null}
        {nextFaces.length && !isReadyToComplete ? (
          <ul className="dash-glyphs" aria-label="Chữ sẽ học ngay">
            {nextFaces.map((face) => <li key={face} className="jp">{face}</li>)}
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
            <Link href="/hoc/daily" className="btn dash-cta" prefetch>
              <span className="dash-cta-play" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
              </span>
              <span className="dash-cta-text">
                <b>{hasNewKnowledge ? 'Bắt đầu học' : 'Ôn ngay'}</b>
                <span>{pendingCount > 0 ? `Hôm nay có ${pendingCount} mục đang chờ bạn ✨` : `Giữ nhịp ${dailyMinutes} phút ✨`}</span>
              </span>
            </Link>
          </div>
        )}
        {/* Ngày ôn tập không có kiến thức mới để "học hết" → ôn xong thì tự hoàn thành. */}
        {hasNewKnowledge ? null : <CompleteDayButton day={journeyDay} />}
      </div>
    </section>
  );
}
