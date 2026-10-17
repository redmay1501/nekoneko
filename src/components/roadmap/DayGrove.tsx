import { LottieAnimation } from '@/components/common/LottieAnimation';

/** Cụm cây nhỏ ở góc dưới bên phải thẻ "Ngày N" (trang chi tiết ngày) — trang trí, không chiếm chỗ (nổi tuyệt đối). */
export function DayGrove() {
  return (
    <div className="day-grove" aria-hidden="true">
      <LottieAnimation src="/animations/garden-palm.json" className="day-grove-tree day-grove-palm" stillFrame={30} />
      <LottieAnimation src="/animations/garden-autumn.json" className="day-grove-tree day-grove-autumn" stillFrame={120} />
      <LottieAnimation src="/animations/garden-wind-tree.json" className="day-grove-tree day-grove-wind" stillFrame={120} />
    </div>
  );
}
