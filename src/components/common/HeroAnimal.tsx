'use client';

import { useLayoutEffect, useRef } from 'react';
import { LottieAnimation } from './LottieAnimation';

const MAX_PX = 140;
const MAX_PX_NARROW = 86;
const NARROW_QUERY = '(max-width: 560px)';
const TOPBAR_GAP = 6;
const MIN_PX = 56;
/** Mèo ở các trang Học tập (Hiragana, Katakana, Từ vựng): to hơn — [máy tính, điện thoại]. */
export const STUDY_ANIMAL_SIZE = [150, 108] as const;

/**
 * Con vật Lottie trang trí ở góc phải phần đầu trang (.page-hero-cat). Nổi tuyệt đối → không đẩy giãn bố cục.
 * Chân con vật nằm ở đáy phần đầu trang; cỡ TỰ CO theo chỗ trống thật phía trên (tới thanh trên cùng), tối đa 140px
 * (điện thoại 86px) — không bị thanh trên che, không đè nội dung bên dưới. Chữ chừa lề phải đúng bằng cỡ con vật.
 */
export function HeroAnimal({ src, stillFrame, minSize }: {
  src: string;
  stillFrame?: number;
  /** Cỡ tối thiểu [máy tính, điện thoại]: chỗ trống không đủ thì nới phần đầu trang (padding-top) vừa đủ cho con vật. */
  minSize?: readonly [number, number];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const art = ref.current;
    const hero = art?.closest<HTMLElement>('.page-hero-cat');
    if (!art || !hero) return;
    const fit = () => {
      const isNarrow = window.matchMedia(NARROW_QUERY).matches;
      const max = isNarrow ? MAX_PX_NARROW : MAX_PX;
      const wanted = minSize ? minSize[isNarrow ? 1 : 0] : 0;
      hero.style.paddingTop = '';
      const heroRect = hero.getBoundingClientRect();
      // Đo khi trang ở đầu (thanh trên cùng dính ở đỉnh): chỗ trống = đáy phần đầu trang − đáy thanh trên cùng.
      const topbar = document.querySelector('.topbar');
      const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom + window.scrollY : 0;
      const room = heroRect.bottom + window.scrollY + 4 - (topbarBottom + TOPBAR_GAP);
      // Thiếu chỗ cho cỡ tối thiểu → nới phần đầu trang đúng phần thiếu (chỉ khi trang chủ động xin cỡ tối thiểu).
      if (wanted && room < wanted) hero.style.paddingTop = `${Math.ceil(wanted - room)}px`;
      const size = Math.round(Math.max(MIN_PX, Math.min(Math.max(max, wanted), Math.max(room, wanted))));
      hero.style.setProperty('--hero-cat-size', `${size}px`);
      hero.style.setProperty('--hero-cat-room', `${size + 10}px`);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(hero);
    window.addEventListener('resize', fit);
    return () => { observer.disconnect(); window.removeEventListener('resize', fit); };
  }, [minSize]);

  return (
    <div ref={ref} className="page-hero-cat-art">
      <LottieAnimation src={src} className="page-hero-cat-art-inner" stillFrame={stillFrame} />
    </div>
  );
}
