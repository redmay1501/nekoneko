'use client';

import { useEffect, type RefObject } from 'react';

/** Đưa nút tiếp tục vừa xuất hiện vào giữa vùng nhìn thấy sau khi trả lời, trên mọi thiết bị. */
export function useScrollToAnswerFeedback<T extends HTMLElement>(ref: RefObject<T | null>, trigger: unknown) {
  useEffect(() => {
    if (trigger === null || trigger === undefined || typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const target = ref.current;
      if (!target) return;
      const headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
      const targetTop = window.scrollY + target.getBoundingClientRect().top - headerBottom - 16;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ref, trigger]);
}
