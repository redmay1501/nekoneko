import Link from 'next/link';
import { LottieAnimation } from '@/components/common/LottieAnimation';

interface GardenSceneProps {
  /** Tổng số thứ đã học (= số cây trong vườn). */
  planted: number;
  /** Đã thành thạo — gần như không quên nữa. */
  mastered: number;
  /** Đang phai — sắp quên, nên tưới lại. */
  fading: number;
}

/**
 * Phong cảnh đầu Vườn tri thức: trời, đồi cỏ và ba cây (Lottie) — mỗi cây kể một con số thật của vườn:
 *  🌴 dừa — số cây đã trồng · 🍂 cây phong mùa thu — số lá đang úa (bấm để tưới) · 🌳 cây trong gió — số cây đã vững.
 * Cây chỉ là hình trang trí (aria-hidden); con số nằm ở nhãn chữ bên dưới mỗi cây.
 */
export function GardenScene({ planted, mastered, fading }: GardenSceneProps) {
  return (
    <section className="garden-scene" aria-label="Phong cảnh vườn tri thức">
      <span className="garden-scene-sun" aria-hidden="true" />
      <span className="garden-scene-hill garden-scene-hill-back" aria-hidden="true" />
      <span className="garden-scene-hill garden-scene-hill-back-2" aria-hidden="true" />
      <span className="garden-scene-hill garden-scene-hill-front" aria-hidden="true" />
      <figure className="garden-tree garden-tree-palm">
        <LottieAnimation src="/animations/garden-palm.json" className="garden-tree-art" stillFrame={30} />
        <figcaption className="garden-tree-tag" title={`${planted} cây đã trồng`}>🌴 <b>{planted}</b><span className="tag-words"> cây đã trồng</span></figcaption>
      </figure>
      <Link className="garden-tree garden-tree-autumn" href="/tri-nho/sap-quen" aria-label={`${fading} lá đang úa — tưới vườn`}>
        <LottieAnimation src="/animations/garden-autumn.json" className="garden-tree-art" stillFrame={120} />
        <span className="garden-tree-tag">🍂 <b>{fading}</b><span className="tag-words"> lá đang úa{fading ? ' · tưới' : ''}</span></span>
      </Link>
      <figure className="garden-tree garden-tree-wind">
        <LottieAnimation src="/animations/garden-wind-tree.json" className="garden-tree-art" stillFrame={120} />
        <figcaption className="garden-tree-tag" title={`${mastered} cây đã vững`}>🌳 <b>{mastered}</b><span className="tag-words"> cây đã vững</span></figcaption>
      </figure>
    </section>
  );
}
