'use client';

import { useEffect, useRef } from 'react';

interface LottieAnimationProps {
  /** Đường dẫn tệp Lottie trong public/ (ví dụ /animations/loader-cat.json). */
  src: string;
  className?: string;
  /** Tên lớp (layer) trong tệp cần ẩn — ví dụ bóng đổ dưới đất khi mèo ngồi trên mép thẻ. */
  hideLayers?: readonly string[];
  /** Khung hình hiện khi máy bật "giảm chuyển động". */
  stillFrame?: number;
  /** 'light' (mặc định, nhẹ — chỉ hình vẽ) hoặc 'svg' (đầy đủ hơn, vẽ được lớp chữ — ví dụ chữ Z của mèo ngủ ở trang 404). */
  player?: 'light' | 'svg';
}

type LottiePlayer = { destroy: () => void; play: () => void; pause: () => void; goToAndStop: (frame: number, isFrame?: boolean) => void };

/**
 * Animation Lottie trang trí (luôn aria-hidden — chữ bên cạnh đã nói đủ nghĩa).
 *  - lottie-web bản light (chỉ SVG) tải động — không vào gói JS chung của app.
 *  - Ra khỏi màn hình thì tạm dừng (IntersectionObserver) cho đỡ tốn pin; vào lại thì chạy tiếp.
 *  - "Giảm chuyển động" → đứng yên ở `stillFrame`. Tải lỗi → để trống, không ảnh hưởng trang.
 */
export function LottieAnimation({ src, className = '', hideLayers, stillFrame = 0, player: playerKind = 'light' }: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hidden = hideLayers?.join('|') ?? '';

  useEffect(() => {
    let isCancelled = false;
    let player: LottiePlayer | null = null;
    let observer: IntersectionObserver | null = null;
    (async () => {
      try {
        const [{ default: lottie }, data] = await Promise.all([
          playerKind === 'svg' ? import('lottie-web/build/player/lottie_svg') : import('lottie-web/build/player/lottie_light'),
          fetch(src).then((response) => (response.ok ? response.json() : null)),
        ]);
        const container = containerRef.current;
        if (isCancelled || !data || !container) return;
        const hiddenNames = new Set(hidden ? hidden.split('|') : []);
        for (const layer of data.layers ?? []) if (hiddenNames.has(layer.nm)) layer.hd = true;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        player = lottie.loadAnimation({
          container, renderer: 'svg', loop: true, autoplay: !reduceMotion, animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        }) as LottiePlayer;
        if (reduceMotion) { player.goToAndStop(stillFrame, true); return; }
        observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) player?.play(); else player?.pause(); });
        observer.observe(container);
      } catch {
        // Không tải được animation → để trống.
      }
    })();
    return () => {
      isCancelled = true;
      observer?.disconnect();
      player?.destroy();
    };
  }, [src, hidden, stillFrame, playerKind]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
