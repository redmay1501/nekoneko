import { LottieAnimation } from '@/components/common/LottieAnimation';

/**
 * Nền động của trang Lộ trình: bãi biển pastel (trời, mây, sóng vỗ, cát — Lottie) đứng yên sau lưng, nội dung cuộn trên nó;
 * cây dừa và cây xanh đứng trên cát ở hai góc dưới. Hoàn toàn trang trí (aria-hidden, không nhận bấm).
 */
export function RoadmapBackdrop() {
  return (
    <div className="roadmap-backdrop" aria-hidden="true">
      <LottieAnimation src="/animations/roadmap-beach.json" className="roadmap-backdrop-scene" fit="cover" stillFrame={0} />
      <span className="roadmap-backdrop-wash" />
      <LottieAnimation src="/animations/garden-palm.json" className="roadmap-tree roadmap-tree-palm" stillFrame={30} />
      <LottieAnimation src="/animations/garden-wind-tree.json" className="roadmap-tree roadmap-tree-wind" stillFrame={120} />
    </div>
  );
}
