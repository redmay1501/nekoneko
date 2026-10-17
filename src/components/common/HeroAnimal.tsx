'use client';

import { useLayoutEffect, useRef } from 'react';
import { LottieAnimation } from './LottieAnimation';

const MAX_PX = 140;
const MAX_PX_NARROW = 86;
const NARROW_QUERY = '(max-width: 560px)';
const TOPBAR_GAP = 6;
const MIN_PX = 56;

/**
 * Con vật Lottie trang trí ở góc phải phần đầu trang (.page-hero-cat). Nổi tuyệt đối → không đẩy giãn bố cục.
 * Chân con vật nằm ở đáy phần đầu trang; cỡ TỰ CO theo chỗ trống thật phía trên (tới thanh trên cùng), tối đa 140px
 * (điện thoại 86px) — không bị thanh trên che, không đè nội dung bên dưới. Chữ chừa lề phải đúng bằng cỡ con vật.
 */
export function HeroAnimal({ src, stillFrame }: { src: string; stillFrame?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const art = ref.current;
    const hero = art?.closest<HTMLElement>('.page-hero-cat');
    if (!art || !hero) return;
    const fit = () => {
      const max = window.matchMedia(NARROW_QUERY).matches ? MAX_PX_NARROW : MAX_PX;
      const heroRect = hero.getBoundingClientRect();
      // Đo khi trang ở đầu (thanh trên cùng dính ở đỉnh): chỗ trống = đáy phần đầu trang − đáy thanh trên cùng.
      const topbar = document.querySelector('.topbar');
      const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom + window.scrollY : 0;
      const room = heroRect.bottom + window.scrollY + 4 - (topbarBottom + TOPBAR_GAP);
      const size = Math.round(Math.max(MIN_PX, Math.min(max, room)));
      hero.style.setProperty('--hero-cat-size', `${size}px`);
      hero.style.setProperty('--hero-cat-room', `${size + 10}px`);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(hero);
    window.addEventListener('resize', fit);
    return () => { observer.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  return (
    <div ref={ref} className="page-hero-cat-art">
      <LottieAnimation src={src} className="page-hero-cat-art-inner" stillFrame={stillFrame} />
    </div>
  );
}
