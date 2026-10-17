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
  /** Lặp lại (mặc định có). Không lặp: chạy một lần rồi giữ khung cuối. */
  loop?: boolean;
  /** Cắt khung: 'x y rộng cao' theo toạ độ của tệp — cho tệp có nhân vật nhỏ trong khung lớn. */
  viewBox?: string;
  /** Chạy từ đầu tới khung này rồi dừng (ví dụ: số sao của mèo chấm điểm). Bỏ trống = chạy cả animation. */
  playTo?: number;
  /** Chỉ lặp đúng đoạn [từ, tới] (vd. mèo ngồi trên thùng, không lặp tới đoạn chui vào thùng). */
  loopSegment?: [number, number];
  /** contain (mặc định): vừa khung · cover: phủ kín khung, cắt bớt mép (dùng làm nền). */
  fit?: 'contain' | 'cover';
}

type LottiePlayer = { destroy: () => void; play: () => void; pause: () => void; goToAndStop: (frame: number, isFrame?: boolean) => void };

/**
 * Animation Lottie trang trí (luôn aria-hidden — chữ bên cạnh đã nói đủ nghĩa).
 *  - lottie-web bản light (chỉ SVG) tải động — không vào gói JS chung của app.
 *  - Ra khỏi màn hình thì tạm dừng (IntersectionObserver) cho đỡ tốn pin; vào lại thì chạy tiếp.
 *  - "Giảm chuyển động" → đứng yên ở `stillFrame`. Tải lỗi → để trống, không ảnh hưởng trang.
 */
export function LottieAnimation({ src, className = '', hideLayers, stillFrame = 0, player: playerKind = 'light', loop = true, viewBox, playTo, loopSegment, fit = 'contain' }: LottieAnimationProps) {
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
        const isOnce = !loop || playTo !== undefined;
        player = lottie.loadAnimation({
          container, renderer: 'svg', loop: !isOnce, autoplay: !reduceMotion && playTo === undefined && !loopSegment, animationData: data,
          rendererSettings: { preserveAspectRatio: fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet', ...(viewBox ? { viewBoxSize: viewBox } : {}) },
        }) as LottiePlayer;
        if (reduceMotion) { player.goToAndStop(playTo ?? stillFrame, true); return; }
        if (loopSegment) { (player as LottiePlayer & { playSegments: (segment: [number, number], force: boolean) => void }).playSegments(loopSegment, true); return; }
        if (playTo !== undefined) { (player as LottiePlayer & { playSegments: (segment: [number, number], force: boolean) => void }).playSegments([0, playTo], true); return; }
        if (isOnce) return;
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
  }, [src, hidden, stillFrame, playerKind, loop, viewBox, playTo, fit, loopSegment?.[0], loopSegment?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps -- so sánh theo giá trị đoạn

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
