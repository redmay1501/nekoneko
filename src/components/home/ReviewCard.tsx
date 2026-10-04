import Link from 'next/link';
import Image from 'next/image';

interface ReviewCardProps {
  /** Kiến thức đang mờ dần (ra-đa sắp quên). */
  atRiskCount: number;
  learnedCount: number;
}

/** "Gặp lại kiến thức" — lối tắt ôn những gì sắp quên. Chưa học gì thì chỉ hứa hẹn, không có nút bấm rỗng. */
export function ReviewCard({ atRiskCount, learnedCount }: ReviewCardProps) {
  const hasLearned = learnedCount > 0;
  const subtitle = atRiskCount > 0 ? `${atRiskCount} mục đang chờ` : hasLearned ? 'Chưa có gì sắp quên 🌸' : 'Học bài đầu tiên để mở';
  const content = (
    <>
      <span className="dash-cta-play blue" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 8v4l2.5 2" />
        </svg>
      </span>
      <span className="dash-cta-text"><b>Ôn ngay</b><span>{subtitle}</span></span>
    </>
  );
  return (
    <section className="dash-card dash-review" aria-labelledby="dash-review-title">
      <div className="dash-review-body">
        <h2 id="dash-review-title">Gặp lại kiến thức</h2>
        <p className="dash-meta">Những gì sắp bị quên</p>
        {hasLearned ? (
          <Link href="/hoc/recall" className="dash-cta-blue">{content}</Link>
        ) : (
          <div className="dash-cta-blue is-locked" aria-disabled="true">{content}</div>
        )}
      </div>
      <Image src="/illustrations/home-study2.webp" alt="" width={420} height={366} className="dash-review-mascot" />
    </section>
  );
}
