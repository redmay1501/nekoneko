import { REVIEW_EVENT_TYPES, type ReviewEventType } from '@/features/memory/memory-types';
import type { ActivitySummary } from './data-source';

export interface ActivityEvent {
  eventType: ReviewEventType;
  /** Kiến thức của sự kiện (memory_item_id hoặc contentKey) — để đếm KIẾN THỨC, không đếm lượt. */
  itemId: string;
}

/**
 * Gom sự kiện thành hai con số cho màn Nghỉ ngơi / Tiến độ. Dùng chung cho cả hai nguồn dữ liệu.
 *  - discovered: số kiến thức được khám phá trong khoảng thời gian.
 *  - revisited : số kiến thức CŨ được gặp lại — thứ vừa khám phá trong cùng khoảng thời gian (kể cả câu "Luyện ngay"
 *    ngay sau đó) không tính là "thứ cũ".
 */
export function summarizeActivityEvents(events: readonly ActivityEvent[]): ActivitySummary {
  const discovered = new Set(events.filter((event) => event.eventType === REVIEW_EVENT_TYPES.DISCOVER).map((event) => event.itemId));
  const revisited = new Set(events
    .filter((event) => event.eventType !== REVIEW_EVENT_TYPES.DISCOVER && !discovered.has(event.itemId))
    .map((event) => event.itemId));
  return { revisitedCount: revisited.size, discoveredCount: discovered.size };
}
