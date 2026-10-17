'use client';

import { useEffect, useRef, useState } from 'react';

/** Animation mèo nhảy (Lottie) — public/animations/dance-cat.json. */
const ANIMATION_URL = '/animations/dance-cat.json';
/** Hiện ít nhất chừng này để kịp thấy mèo, rồi mới ẩn khi trang đã sẵn sàng. */
const MIN_VISIBLE_MS = 900;
/** Chậm nhất chừng này là ẩn, kể cả khi trang còn tải ảnh — không bắt người học chờ. */
const MAX_VISIBLE_MS = 4000;
const FADE_MS = 350;

/**
 * Màn loading toàn trang khi MỚI VÀO web (hoặc tải lại trang): mèo nhảy ở giữa trên nền hồng nhạt.
 *  - Nằm trong layout gốc nên có ngay trong HTML đầu tiên (không nháy trang bên dưới); chuyển trang trong app không hiện lại.
 *  - lottie-web (bản light, chỉ SVG) tải động — chỉ cho màn này.
 *  - "Giảm chuyển động" → mèo đứng yên. JavaScript lỗi → CSS tự ẩn màn này sau vài giây (.splash trong globals.css).
 */
export function SplashScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const startedAt = performance.now();
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
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (isCancelled) return;
        setPhase('fading');
        window.setTimeout(() => { if (!isCancelled) setPhase('gone'); }, FADE_MS);
      }, wait);
    };
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide, { once: true });
    const fallback = window.setTimeout(hide, MAX_VISIBLE_MS);

    return () => {
      isCancelled = true;
      window.removeEventListener('load', hide);
      window.clearTimeout(fallback);
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
