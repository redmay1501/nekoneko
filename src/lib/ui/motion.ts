/**
 * Chuyển động dùng chung. Cuộn trang dùng cuộn GỐC của trình duyệt — đã thử cuộn giả lập có quán tính (Lenis) nhưng trên
 * bàn di Mac (vốn đã có quán tính) trang trôi chậm hơn ngón tay → cảm giác lag; nên bỏ.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Về đầu trang NGAY (giữa các bước học, chuyển chặng) — không trượt chậm. */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}
