import { LottieAnimation } from '@/components/common/LottieAnimation';
import { NekoButton } from '@/components/common/NekoButton';

interface ReviewCardProps {
  /** Kiến thức đang mờ dần (ra-đa sắp quên). */
  atRiskCount: number;
  learnedCount: number;
}

const ReviewIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 8v4l2.5 2" />
  </svg>
);

/** "Gặp lại kiến thức" — lối tắt ôn những gì sắp quên. Chưa học gì thì nút khoá (không có nút bấm rỗng). */
export function ReviewCard({ atRiskCount, learnedCount }: ReviewCardProps) {
  const hasLearned = learnedCount > 0;
  const subtitle = atRiskCount > 0 ? `${atRiskCount} mục đang chờ bạn` : hasLearned ? 'Chưa có gì sắp quên 🌸' : 'Học bài đầu tiên để mở';
  return (
    <section className="dash-card dash-review" aria-labelledby="dash-review-title">
      {/* Mèo ma xách bí ngô (Lottie go.json) — trang trí. */}
      <LottieAnimation src="/animations/review-ghost-cat.json" className="dash-review-mascot dash-review-cat" stillFrame={28} />
      <div className="dash-review-body">
        <h2 id="dash-review-title">Gặp lại kiến thức</h2>
        <p className="dash-meta">{subtitle}</p>
        <div className="dash-actions">
          <NekoButton href="/hoc/recall" variant="review" catPose="none" leftIcon={ReviewIcon} disabled={!hasLearned}>Ôn ngay</NekoButton>
        </div>
      </div>
    </section>
  );
}
