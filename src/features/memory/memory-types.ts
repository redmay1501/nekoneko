import type { ContentKey, ContentType } from '@/features/learning/knowledge-types';

/** Sáu trạng thái trí nhớ — sheet "5. Memory Engine", mục A. */
export const MEMORY_STATUSES = {
  NEW: 'new',
  WEAK: 'weak',
  FADING: 'fading',
  LEARNING: 'learning',
  STRONG: 'strong',
  MASTERED: 'mastered',
} as const;

export type MemoryStatus = (typeof MEMORY_STATUSES)[keyof typeof MEMORY_STATUSES];

/** Các loại tương tác được ghi vào review_events. */
export const REVIEW_EVENT_TYPES = {
  SURPRISE: 'surprise',
  RECALL: 'recall',
  DISCOVER: 'discover',
  USE: 'use',
  RESCUE: 'rescue',
} as const;

export type ReviewEventType = (typeof REVIEW_EVENT_TYPES)[keyof typeof REVIEW_EVENT_TYPES];

/**
 * Bản ghi trí nhớ đã lưu — một dòng memory_items.
 * Đây là dữ liệu THÔ. UI không đọc trực tiếp mà đọc MemoryView.
 * Các mốc thời gian là chuỗi ISO để đi qua JSON/Server Component an toàn.
 */
export interface MemoryRecord {
  contentType: ContentType;
  contentId: number;
  /** Điểm tại thời điểm lastSeenAt. Điểm thực tế hôm nay = điểm này trừ phần trôi theo thời gian. */
  memoryScore: number;
  encounterCount: number;
  correctCount: number;
  wrongCount: number;
  rescuedCount: number;
  lastSeenAt: string | null;
  lastRecalledAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
}

/** Trạng thái trí nhớ đã tính sẵn, sẵn sàng để hiển thị. */
export interface MemoryView {
  contentKey: ContentKey;
  contentType: ContentType;
  isLearned: boolean;
  status: MemoryStatus;
  /** Điểm thực tế hôm nay (đã trừ phần trôi). */
  memoryScore: number;
  encounterCount: number;
  correctCount: number;
  wrongCount: number;
  daysSinceSeen: number | null;
  daysUntilReview: number | null;
  lastEncounterText: string;
  nextEncounterText: string;
  reason: string;
}

export interface MemoryUpdateInput {
  record: MemoryRecord | null;
  contentType: ContentType;
  contentId: number;
  eventType: ReviewEventType;
  /** null cho bước Khám phá — bước đó không có đúng/sai. */
  isCorrect: boolean | null;
  now: Date;
}

export interface MemoryUpdateResult {
  nextRecord: MemoryRecord;
  scoreBefore: number;
  scoreAfter: number;
  /** Số ngày kể từ lần gặp trước — dùng cho câu "Bạn vừa nhớ lại 日本 sau 6 ngày". */
  daysSinceSeenBefore: number | null;
}
