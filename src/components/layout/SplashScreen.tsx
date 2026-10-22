'use client';

import { useEffect, useRef, useState } from 'react';

/** Animation mèo nhảy (Lottie) — public/animations/dance-cat.json. */
const ANIMATION_URL = '/animations/dance-cat.json';
/** Ẩn ngay sau frame đầu tiên để màn chờ không giữ người học lại. */
const FADE_MS = 160;

/**
 * Màn loading toàn trang khi MỚI VÀO web (hoặc tải lại trang): mèo nhảy ở giữa trên nền hồng nhạt.
 *  - Nằm trong layout gốc nên có ngay trong HTML đầu tiên; chuyển trang trong app không hiện lại.
 *  - lottie-web (bản light, chỉ SVG) tải động — chỉ cho màn này.
 *  - "Giảm chuyển động" → mèo đứng yên. CSS tự ẩn màn này nếu JavaScript không chạy.
 */
export function SplashScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    let isCancelled = false;
    let animation: { destroy: () => void } | null = null;

    (async () => {
      try {
        const [{ default: lottie }, data] = await Promise.all([
          import('lottie-web/build/player/lottie_light'),
          fetch(ANIMATION_URL).then((response) => (response.ok ? response.json() : null)),
        ]);
        if (isCancelled || !data || !containerRef.current) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const instance = lottie.loadAnimation({
          container: containerRef.current, renderer: 'svg', loop: !reduceMotion, autoplay: !reduceMotion, animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        });
        if (reduceMotion) instance.goToAndStop(0, true);
        animation = instance;
      } catch {
        // Không tải được animation → chỉ còn nền hồng, màn loading vẫn tự ẩn như bình thường.
      }
    })();

    const hide = () => {
      if (isCancelled) return;
      setPhase('fading');
      window.setTimeout(() => { if (!isCancelled) setPhase('gone'); }, FADE_MS);
    };
    const firstFrame = window.requestAnimationFrame(hide);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(firstFrame);
      animation?.destroy();
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div className={`splash ${phase === 'fading' ? 'is-fading' : ''}`} role="status" aria-live="polite" aria-label="Đang tải Neko Neko">
      <div ref={containerRef} className="splash-cat" aria-hidden="true" />
    </div>
  );
}
