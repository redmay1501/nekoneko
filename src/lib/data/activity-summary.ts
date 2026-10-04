import { REVIEW_EVENT_TYPES, type ReviewEventType } from '@/features/memory/memory-types';
import type { ActivitySummary } from './data-source';

/** Gom danh sách loại sự kiện thành hai con số cho màn Nghỉ ngơi. Dùng chung cho cả hai nguồn dữ liệu. */
export function summarizeEventTypes(eventTypes: readonly ReviewEventType[]): ActivitySummary {
  return {
    revisitedCount: eventTypes.filter((type) =>
      type === REVIEW_EVENT_TYPES.SURPRISE || type === REVIEW_EVENT_TYPES.RECALL || type === REVIEW_EVENT_TYPES.RESCUE).length,
    discoveredCount: eventTypes.filter((type) => type === REVIEW_EVENT_TYPES.DISCOVER).length,
  };
}
