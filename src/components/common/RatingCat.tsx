'use client';

import { LottieAnimation } from './LottieAnimation';

/**
 * Mèo chấm điểm 1–5 sao (Lottie cat_rating): các sao sáng lần lượt từ trái sang phải, 5 sao có pháo giấy.
 * Chạy từ đầu tới khung hình mà sao thứ N vừa sáng xong rồi dừng — đo trên tệp gốc (60 khung / giây).
 */
export const RATING_STOP_FRAMES: Record<1 | 2 | 3 | 4 | 5, number | undefined> = { 1: 56, 2: 90, 3: 115, 4: 146, 5: undefined };

export function RatingCat({ stars, className = '' }: { stars: number; className?: string }) {
  const value = Math.min(5, Math.max(1, Math.round(stars))) as 1 | 2 | 3 | 4 | 5;
  const stopAt = RATING_STOP_FRAMES[value];
  return (
    <div className={`rating-cat ${className}`} role="img" aria-label={`${value}/5 sao`}>
      {/* 5 sao: chạy hết (có pháo giấy) rồi giữ khung cuối; ít sao hơn: dừng ở khung của sao thứ N. */}
      <LottieAnimation key={value} src="/animations/rating-cat.json" className="rating-cat-art" loop={false} playTo={stopAt} stillFrame={stopAt ?? 299} />
    </div>
  );
}
