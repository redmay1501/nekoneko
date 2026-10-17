'use client';

import { useEffect } from 'react';

const BUTTON_SELECTOR = 'button, a.btn, .btn, .neko-btn, [role="button"], [role="tab"], .chip';
/** Không in chân mèo ở vùng viết tay (ô vở), hộp chọn file… */
const EXCLUDED = '.nb-paper, .nb-cells, input, textarea, select, [data-no-paw]';
const EFFECT_PX = 64;
const EFFECT_MS = 1100;
const MAX_ACTIVE = 4;

type LottieModule = typeof import('lottie-web/build/player/lottie_light');
let assets: Promise<[LottieModule, unknown] | null> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    import('lottie-web/build/player/lottie_light'),
    fetch('/animations/paws.json').then((response) => (response.ok ? response.json() : null)),
  ]).then(([module, data]) => (data ? [module, data] as [LottieModule, unknown] : null)).catch(() => null);
  return assets;
}

/**
 * Bấm vào nút bất kỳ → in vết chân mèo (Lottie "Paws Animation") ngay chỗ bấm, rồi tự biến mất.
 * Gắn MỘT lần ở layout gốc, lắng nghe pointerdown toàn trang; không đổi bố cục (lớp nổi, pointer-events: none).
 * "Giảm chuyển động" → không hiện. Tệp animation và lottie-web chỉ tải ở lần bấm đầu.
 */
export function PawClickEffect() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let active = 0;
    async function onPointerDown(event: PointerEvent) {
      if (event.button > 0 || active >= MAX_ACTIVE) return;
      const target = event.target as Element | null;
      const button = target?.closest?.(BUTTON_SELECTOR);
      if (!button || target?.closest?.(EXCLUDED) || (button as HTMLButtonElement).disabled) return;
      const x = event.clientX;
      const y = event.clientY;
      active += 1;
      const loaded = await loadAssets();
      if (!loaded) { active -= 1; return; }
      const [{ default: lottie }, data] = loaded;
      const host = document.createElement('div');
      host.className = 'paw-click';
      host.setAttribute('aria-hidden', 'true');
      host.style.left = `${x - EFFECT_PX / 2}px`;
      host.style.top = `${y - EFFECT_PX / 2}px`;
      document.body.appendChild(host);
      const animation = lottie.loadAnimation({ container: host, renderer: 'svg', loop: false, autoplay: true, animationData: JSON.parse(JSON.stringify(data)) });
      window.setTimeout(() => { animation.destroy(); host.remove(); active -= 1; }, EFFECT_MS);
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);
  return null;
}
