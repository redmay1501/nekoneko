'use client';

import { useEffect } from 'react';

/** Cuộn tới một vùng nội dung khi giá trị điều khiển thay đổi (ví dụ vừa chọn bài luyện tập). */
export function ScrollToElementOnChange({ targetId, trigger }: { targetId: string; trigger: string }) {
  useEffect(() => {
    if (!trigger) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
      const targetTop = window.scrollY + target.getBoundingClientRect().top - headerBottom - 16;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [targetId, trigger]);

  return null;
}
