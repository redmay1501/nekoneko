'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';
import { prefersReducedMotion } from '@/lib/ui/motion';

/**
 * Chuyển động theo cuộn — CHỈ ở những phần được chọn (không gắn cho mọi thứ):
 *
 *  data-reveal[="light"]      Hiện một lần khi cuộn tới: trượt lên + thu nhỏ nhẹ → rõ dần ("light": quãng ngắn hơn).
 *  data-reveal-stagger        Các con trực tiếp hiện nối đuôi nhau.
 *  data-scene="enter"         Theo cuộn: --p chạy 0 → 1 khi khối đi từ mép dưới tới ~55% màn hình (kéo lên thì chạy ngược).
 *  data-scene="exit"          Theo cuộn: --p 0 → 1 khi khối đầu trang cuộn đi khỏi màn hình (phần đầu trang chủ).
 *
 * Class riêng `motion-reveal` / `motion-in` — KHÔNG dùng tên `reveal`: tên đó đã là ô hiện đáp án (có margin + padding),
 * trùng tên làm khối phình ra khi đang hiện rồi co lại → trang đổi chiều cao → vị trí cuộn bị kéo ngược (giật).
 * Hiệu năng: chỉ đổi transform / opacity qua biến CSS; chỉ tính cảnh đang trong tầm nhìn; tối đa một lần mỗi khung hình;
 * lắng nghe cuộn dạng passive. "Giảm chuyển động" → mọi thứ hiện ngay, cảnh ở trạng thái cuối (--p = 1).
 */
const REVEAL_SELECTOR = '[data-reveal], [data-reveal-stagger] > *';
/**
 * Tự động cho MỌI trang: các khối quen thuộc (thẻ, dòng danh sách, tiêu đề mục, ngày, ô cây…) hiện lên khi cuộn tới —
 * không phải gắn tay từng trang. Chỉ khối ngoài cùng (thẻ nằm trong thẻ thì hiện theo thẻ cha).
 */
const AUTO_SELECTOR = [
  '.card', '.list-row', '.kcard', '.radical-x', '.sec-h', '.dayhero', '.daystrip', '.tl', '.plot', '.garden-legend',
  '.map-wrap', '.mode', '.noko-row', '.kana-lesson', '.pill-tabs', '.radar-i', '.grid > *', '.stack > *',
].join(', ');
/** Không hiện dần: màn đang học, khay, hộp thoại, form / ô nhập liệu, phần đã gắn tay, phần tự loại trừ. */
const AUTO_EXCLUDED = '.session, .sheet, .welcome, form, [data-no-reveal], [data-reveal], [data-reveal-stagger]';
const AUTO_EXCLUDED_PATHS = ['/cai-dat'];
const HAS_FORM_CONTROL = 'input, select, textarea';
const SCENE_SELECTOR = '[data-scene]';
const STAGGER_MS = 80;
const MAX_STAGGER_STEPS = 6;
const REVEAL_DURATION_MS = 900;
const ENTER_DISTANCE = 0.45;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function sceneProgress(element: HTMLElement, viewport: number): number {
  const rect = element.getBoundingClientRect();
  switch (element.dataset.scene) {
    case 'exit':
      return clamp(-rect.top / Math.max(rect.height, 1));
    default:
      return clamp((viewport - rect.top) / (viewport * ENTER_DISTANCE));
  }
}

export function ScrollScenes() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion() || !('IntersectionObserver' in window);

    // ── Hiện một lần ─────────────────────────────────────────────
    const finish = (element: HTMLElement) => {
      element.classList.remove('motion-reveal', 'motion-in');
      element.style.removeProperty('--reveal-delay');
    };
    const revealObserver = new IntersectionObserver((entries) => {
      const entering = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target as HTMLElement);
      entering.forEach((element, index) => {
        revealObserver.unobserve(element);
        const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS;
        element.style.setProperty('--reveal-delay', `${delay}ms`);
        element.classList.add('motion-in');
        window.setTimeout(() => finish(element), delay + REVEAL_DURATION_MS);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    // ── Cảnh theo cuộn ───────────────────────────────────────────
    const visibleScenes = new Set<HTMLElement>();
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      for (const scene of visibleScenes) {
        const progress = sceneProgress(scene, viewport);
        if (Math.abs(progress - Number(scene.dataset.progress ?? -1)) > 0.001) {
          scene.dataset.progress = String(progress);
          scene.style.setProperty('--p', progress.toFixed(4));
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const sceneObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleScenes.add(entry.target as HTMLElement);
        else visibleScenes.delete(entry.target as HTMLElement);
      }
      schedule();
    }, { rootMargin: '25% 0px 25% 0px' });

    const prepare = (scope: ParentNode) => {
      const within = (selector: string) => [
        ...(scope instanceof Element && scope.matches(selector) ? [scope] : []), ...scope.querySelectorAll(selector),
      ] as HTMLElement[];
      for (const element of within(REVEAL_SELECTOR)) {
        if (element.dataset.revealPrepared) continue;
        element.dataset.revealPrepared = '1';
        if (reduced) continue;
        element.classList.add('motion-reveal');
        if (element.parentElement?.hasAttribute('data-reveal-stagger') && element.parentElement.dataset.reveal === 'light') element.dataset.reveal = 'light';
        revealObserver.observe(element);
      }
      for (const scene of within(SCENE_SELECTOR)) {
        if (scene.dataset.scenePrepared) continue;
        scene.dataset.scenePrepared = '1';
        if (reduced) { scene.style.setProperty('--p', '1'); continue; }
        scene.style.setProperty('--p', sceneProgress(scene, window.innerHeight).toFixed(4));
        sceneObserver.observe(scene);
      }
    };

    const autoRoot = AUTO_EXCLUDED_PATHS.some((path) => pathname.startsWith(path)) ? null : document.getElementById('noi-dung');
    const isAutoTarget = (element: HTMLElement) => {
      if (!autoRoot?.contains(element) || element.closest(AUTO_EXCLUDED) || element.querySelector(HAS_FORM_CONTROL)) return false;
      const parentTarget = element.parentElement?.closest(AUTO_SELECTOR);
      return !parentTarget || !autoRoot.contains(parentTarget);
    };
    const prepareAuto = (scope: ParentNode) => {
      if (!autoRoot || reduced) return;
      const candidates = [...(scope instanceof Element && scope.matches(AUTO_SELECTOR) ? [scope] : []), ...scope.querySelectorAll(AUTO_SELECTOR)] as HTMLElement[];
      for (const element of candidates) {
        if (element.dataset.revealPrepared || !isAutoTarget(element)) continue;
        element.dataset.revealPrepared = '1';
        element.dataset.reveal = 'light';
        element.classList.add('motion-reveal');
        revealObserver.observe(element);
      }
    };

    prepare(document.body);
    prepareAuto(document.body);
    const mutations = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) { prepare(node); prepareAuto(node); }
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      mutations.disconnect();
      revealObserver.disconnect();
      sceneObserver.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      document.querySelectorAll<HTMLElement>('.motion-reveal').forEach(finish);
    };
  }, [pathname]);

  return null;
}
