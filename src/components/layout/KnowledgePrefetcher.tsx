'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { KnowledgeDetailView } from '@/features/learning/knowledge-detail';
import { preloadStrokeOrders } from '@/features/learning/stroke-order';
import { requestJson } from '@/lib/api/api-client';
import { QUERY_KEYS } from '@/lib/api/query-keys';

/** Thẻ đang hiện hoặc cách mép màn hình chừng này thì tải sẵn. */
const NEAR_VIEWPORT = '800px 0px';
const BATCH_DELAY_MS = 200;
const MAX_BATCH = 60;

/**
 * Bấm vào một chữ là mở NGAY, không phải chờ tải:
 *  - chi tiết của các chữ đang / sắp hiện trên màn hình được tải sẵn theo lô (một lần gọi /api/knowledge cho nhiều chữ);
 *  - khi trang rảnh: tải sẵn mã của khay chi tiết và tệp hình nét viết (một tệp cho mọi chữ).
 * Chữ nào bấm được đều có data-knowledge-key (KnowledgeChipButton). Không hiển thị gì.
 */
export function KnowledgePrefetcher() {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  useEffect(() => {
    // Phiên học / trò chơi không có thẻ để bấm xem chi tiết, lại đổi DOM liên tục (đồng hồ, câu hỏi) → không theo dõi.
    if (pathname.startsWith('/hoc/') || pathname.startsWith('/tro-choi/')) return;
    const pending = new Set<string>();
    let timer: number | undefined;
    const hasDetail = (key: string) => queryClient.getQueryData(QUERY_KEYS.knowledgeDetail(key)) !== undefined;

    function flush() {
      const keys = [...pending].filter((key) => !hasDetail(key));
      pending.clear();
      for (let start = 0; start < keys.length; start += MAX_BATCH) {
        const batch = keys.slice(start, start + MAX_BATCH);
        requestJson<{ details: Record<string, KnowledgeDetailView> }>(`/api/knowledge?keys=${batch.map(encodeURIComponent).join(',')}`)
          .then(({ details }) => {
            for (const [key, detail] of Object.entries(details)) {
              if (!hasDetail(key)) queryClient.setQueryData(QUERY_KEYS.knowledgeDetail(key), detail);
            }
          })
          .catch(() => undefined); // Tải sẵn hỏng thì lúc bấm khay tự tải như bình thường.
      }
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const key = entry.target.getAttribute('data-knowledge-key');
        if (key) pending.add(key);
        observer.unobserve(entry.target);
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, BATCH_DELAY_MS);
    }, { rootMargin: NEAR_VIEWPORT });

    const observeAll = () => document.querySelectorAll('[data-knowledge-key]').forEach((element) => observer.observe(element));
    observeAll();
    // Danh sách đổi (đổi tab bài, lọc…) → theo dõi thêm các thẻ mới.
    // Gộp các thay đổi DOM: quét lại tối đa ~4 lần mỗi giây (trước đây mỗi khung hình có thay đổi).
    let frame = 0;
    let lastScan = 0;
    const mutations = new MutationObserver(() => {
      if (frame) return;
      frame = window.setTimeout(() => { frame = 0; lastScan = performance.now(); observeAll(); }, Math.max(0, 250 - (performance.now() - lastScan)));
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1200));
    const idleHandle = idle(() => {
      void import('./SheetPanels');
      void preloadStrokeOrders();
    });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.clearTimeout(frame);
      window.clearTimeout(timer);
      if (window.cancelIdleCallback && typeof idleHandle === 'number') window.cancelIdleCallback(idleHandle);
    };
  }, [pathname, queryClient]);

  return null;
}
