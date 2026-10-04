import { type KnowledgeCatalog, itemsScheduledOn } from '@/features/learning/knowledge-catalog';
import type { ContentKey } from '@/features/learning/knowledge-types';
import type { MemoryView } from '@/features/memory/memory-types';
import { JOURNEY_TOTAL_DAYS } from './journey';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  TIẾN ĐỘ LỘ TRÌNH — "ngày X/90" tính theo NGÀY HỌC THẬT (đã chốt Q-05)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  - Tài khoản mới bắt đầu ở ngày 1.
 *  - Ngày hiện tại chỉ tăng khi người học TỰ XÁC NHẬN xong nó: bấm "Hoàn thành ngày X" rồi xác nhận lại.
 *    Không bao giờ tự chuyển ngày — gặp một lần chưa phải là thuộc; người học quyết định khi nào sẵn sàng.
 *  - Gặp hết kiến thức của ngày (isDayReadyToComplete) → app MỜI hoàn thành ở Trang chủ và Khoảnh khắc tiến bộ.
 *  - Xác nhận xong là mở ngày kế tiếp NGAY, học tiếp được luôn.
 *  - Nghỉ bao lâu cũng không bị đẩy lên trước — quay lại đúng ngày đang dở.
 *
 *  Lưu ý: trí nhớ vẫn phai theo THỜI GIAN THẬT (Memory Engine), độc lập với tiến độ lộ trình.
 *  Tài liệu: docs/architecture.md (mục 6) · docs/database.md
 */

export const JOURNEY_COMPLETION_METHODS = {
  /** Cách cũ (tự chuyển khi gặp hết kiến thức) — đã bỏ; giữ để đọc được bản ghi cũ. */
  AUTO: 'auto',
  MANUAL: 'manual',
} as const;

export type JourneyCompletionMethod = (typeof JOURNEY_COMPLETION_METHODS)[keyof typeof JOURNEY_COMPLETION_METHODS];

/** Một kiến thức được tính là "đã gặp" khi đã xuất hiện trong phiên học ít nhất chừng này lần. */
export const MIN_ENCOUNTERS_TO_COUNT_AS_MET = 1;

export interface JourneyPosition {
  /** Ngày đang học, 1…90. Xong cả lộ trình thì vẫn là 90. */
  currentDay: number;
  isJourneyComplete: boolean;
}

export interface JourneyAdvanceResult extends JourneyPosition {
  /** false khi ngày gửi lên không phải ngày đang học (bấm hai lần, ngày đã qua…). */
  hasAdvanced: boolean;
}

export interface DayCompletionProgress {
  metCount: number;
  totalCount: number;
  /** Ngày ôn tập không có kiến thức mới → chỉ hoàn thành được bằng cách tự bấm. */
  hasNewKnowledge: boolean;
  isAllKnowledgeMet: boolean;
}

/** Đã gặp bao nhiêu kiến thức của ngày `day`. */
export function getDayCompletionProgress(
  catalog: KnowledgeCatalog,
  views: ReadonlyMap<ContentKey, MemoryView>,
  day: number,
): DayCompletionProgress {
  const items = itemsScheduledOn(catalog, day);
  const metCount = items.filter((item) => (views.get(item.key)?.encounterCount ?? 0) >= MIN_ENCOUNTERS_TO_COUNT_AS_MET).length;
  return {
    metCount,
    totalCount: items.length,
    hasNewKnowledge: items.length > 0,
    isAllKnowledgeMet: items.length > 0 && metCount === items.length,
  };
}

/** Đã gặp hết kiến thức của ngày đang học → mời người học xác nhận hoàn thành ngày (không tự chuyển). */
export function isDayReadyToComplete(position: JourneyPosition, progress: DayCompletionProgress): boolean {
  return !position.isJourneyComplete && progress.isAllKnowledgeMet;
}

/** Số ngày đã hoàn thành — dùng cho Tiến độ và Thành tích. */
export function completedDayCount(position: JourneyPosition): number {
  return position.isJourneyComplete ? JOURNEY_TOTAL_DAYS : position.currentDay - 1;
}

/** Quan hệ của một ngày với vị trí hiện tại trên lộ trình. */
export function relationToCurrentDay(day: number, position: JourneyPosition): 'done' | 'current' | 'upcoming' {
  if (day < position.currentDay || position.isJourneyComplete) return 'done';
  return day === position.currentDay ? 'current' : 'upcoming';
}

/**
 * Ước lượng thời gian HỌC TRONG APP để đi hết phần còn lại của ngày — nói thật với người học
 * thay vì để họ nghĩ "8 phút là xong một ngày".
 * (Chưa gồm việc ngoài app trong lộ trình như viết tay, đọc giáo trình — xem màn Một ngày học.)
 */
export const MINUTES_PER_NEW_KNOWLEDGE = 1;
export const DAY_LESSON_PRACTICE_MINUTES = 2;

export function remainingKnowledgeCount(progress: DayCompletionProgress): number {
  return progress.totalCount - progress.metCount;
}

export function estimateMinutesToFinishDay(progress: DayCompletionProgress): number {
  const remaining = remainingKnowledgeCount(progress);
  return remaining > 0 ? Math.ceil(remaining * MINUTES_PER_NEW_KNOWLEDGE) + DAY_LESSON_PRACTICE_MINUTES : 0;
}
