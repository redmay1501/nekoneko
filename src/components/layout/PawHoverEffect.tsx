'use client';

import { useEffect } from 'react';

const BUTTON_SELECTOR = '.btn, .neko-btn';
/** Không hiện ở vùng viết tay (ô vở) hay nút tự tắt hiệu ứng. */
const EXCLUDED = '.nb-paper, .nb-cells, [data-no-paw]';

type LottieModule = typeof import('lottie-web/build/player/lottie_light');
type Animation = ReturnType<LottieModule['default']['loadAnimation']>;
let assets: Promise<[LottieModule, unknown] | null> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    import('lottie-web/build/player/lottie_light'),
    fetch('/animations/paws-white.json').then((response) => (response.ok ? response.json() : null)),
  ]).then(([module, data]) => (data ? [module, data] as [LottieModule, unknown] : null)).catch(() => null);
  return assets;
}

/**
 * Rê chuột vào nút → vết chân mèo trắng (Lottie "Paws Animation") hiện lên BÊN TRONG nút, nằm dưới chữ; rời chuột thì biến mất.
 * Gắn MỘT lần ở layout gốc, lắng nghe pointerover/pointerout toàn trang; không đổi bố cục (lớp tuyệt đối, pointer-events: none).
 * Chỉ với chuột (máy có hover) và khi không bật "giảm chuyển động". Tệp animation và lottie-web chỉ tải ở lần rê đầu.
 */
export function PawHoverEffect() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const active = new Map<Element, { host: HTMLElement; animation: Animation | null }>();

    function remove(button: Element) {
      const entry = active.get(button);
      if (!entry) return;
      active.delete(button);
      entry.animation?.destroy();
      entry.host.remove();
    }

    async function onPointerOver(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return;
      const target = event.target as Element | null;
      const button = target?.closest?.(BUTTON_SELECTOR);
      if (!button || active.has(button) || button.closest(EXCLUDED)) return;
      if ((button as HTMLButtonElement).disabled || button.getAttribute('aria-disabled') === 'true' || button.classList.contains('is-inactive')) return;
      const host = document.createElement('span');
      host.className = 'btn-paw';
      host.setAttribute('aria-hidden', 'true');
      const entry: { host: HTMLElement; animation: Animation | null } = { host, animation: null };
      active.set(button, entry);
      button.appendChild(host);
      const loaded = await loadAssets();
      if (!loaded || active.get(button) !== entry) return;
      const [{ default: lottie }, data] = loaded;
      entry.animation = lottie.loadAnimation({ container: host, renderer: 'svg', loop: false, autoplay: true, animationData: JSON.parse(JSON.stringify(data)) });
    }

    function onPointerOut(event: PointerEvent) {
      const button = (event.target as Element | null)?.closest?.(BUTTON_SELECTOR);
      if (!button || !active.has(button)) return;
      if (event.relatedTarget instanceof Node && button.contains(event.relatedTarget)) return;
      remove(button);
    }

    // Nút bị gỡ khỏi trang (đổi trang, đóng hộp thoại) khi chuột còn trên nó → dọn hiệu ứng mồ côi.
    const sweep = window.setInterval(() => { for (const button of active.keys()) if (!button.isConnected) remove(button); }, 2000);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    return () => {
      window.clearInterval(sweep);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      for (const button of [...active.keys()]) remove(button);
    };
  }, []);
  return null;
}
