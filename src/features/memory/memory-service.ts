import 'server-only';
import type { LearningDataSource } from '@/lib/data/data-source';
import { type KnowledgeCatalog, itemsScheduledUpTo } from '@/features/learning/knowledge-catalog';
import { type ContentKey, type KnowledgeItem, toContentKey } from '@/features/learning/knowledge-types';
import { calculateMemoryUpdate, createInitialMemoryRecord, toMemoryView } from './memory-engine';
import type { MemoryRecord, MemoryView, ReviewEventType } from './memory-types';
import type { StoredStepResult } from '@/lib/data/data-source';

/**
 * MEMORY SERVICE — nối Memory Engine (thuần) với nơi lưu trữ.
 *
 *   UI → Route Handler → memory-service → memory-engine → data-source → database
 *
 * Đây là nơi DUY NHẤT gọi calculateMemoryUpdate rồi lưu kết quả.
 */

/**
 * Trí nhớ của người học (đã đọc sẵn — `existing`); đồng thời "gieo" những kiến thức lộ trình đã tới ngày
 * nhưng chưa có bản ghi (tới ngày nào thì kiến thức ngày đó bắt đầu được theo dõi).
 * Nhận bản ghi đã đọc thay vì tự đọc để nơi gọi đọc song song với hồ sơ — bớt một lượt chờ database.
 */
export async function seedScheduledMemory(
  source: LearningDataSource,
  userId: string,
  existing: readonly MemoryRecord[],
  catalog: KnowledgeCatalog,
  journeyDay: number,
  now: Date,
): Promise<Map<ContentKey, MemoryRecord>> {
  const records = new Map(existing.map((record) => [toContentKey(record.contentType, record.contentId), record]));

  const missing = itemsScheduledUpTo(catalog, journeyDay)
    .filter((item) => !records.has(item.key))
    .map((item) => createInitialMemoryRecord(item.type, item.id, now));
  if (missing.length) {
    await source.insertMissingMemoryRecords(userId, missing);
    for (const record of missing) records.set(toContentKey(record.contentType, record.contentId), record);
  }
  return records;
}

export function buildMemoryViews(
  catalog: KnowledgeCatalog,
  records: ReadonlyMap<ContentKey, MemoryRecord>,
  now: Date,
): Map<ContentKey, MemoryView> {
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, records.get(item.key) ?? null, now)]));
}

export interface RecordMemoryEventInput {
  source: LearningDataSource;
  userId: string;
  item: KnowledgeItem;
  existingRecord: MemoryRecord | null;
  eventType: ReviewEventType;
  answer: string | null;
  isCorrect: boolean | null;
  requestId: string;
  now: Date;
  session?: { sessionId: string; stepIndex: number };
}

export interface RecordedMemoryEvent {
  isDuplicate: boolean;
  scoreBefore: number;
  scoreAfter: number;
  daysSinceSeenBefore: number | null;
  view: MemoryView;
}

/** Tính (Memory Engine) rồi lưu (atomic) một lần gặp lại. */
export async function recordMemoryEvent(input: RecordMemoryEventInput): Promise<RecordedMemoryEvent> {
  const { item, now } = input;
  const update = calculateMemoryUpdate({
    record: input.existingRecord, contentType: item.type, contentId: item.id,
    eventType: input.eventType, isCorrect: input.isCorrect, now,
  });
  // Cứu kiến thức luôn được tính như nhớ đúng (sheet 5, mục B).
  const isCorrect = input.eventType === 'rescue' ? true : input.isCorrect;
  const stepResult: StoredStepResult | null = input.session
    ? { answer: input.answer ?? '', isCorrect, face: item.face, daysSinceSeenBefore: update.daysSinceSeenBefore }
    : null;

  const { isDuplicate } = await input.source.applyMemoryUpdate({
    userId: input.userId,
    requestId: input.requestId,
    contentType: item.type,
    contentId: item.id,
    eventType: input.eventType,
    answer: input.answer,
    isCorrect,
    scoreBefore: update.scoreBefore,
    scoreAfter: update.scoreAfter,
    nextRecord: update.nextRecord,
    session: input.session && stepResult ? { ...input.session, stepResult } : null,
  });

  // Gửi trùng: trạng thái không đổi, trả về như trước khi bấm.
  const effectiveRecord = isDuplicate ? input.existingRecord : update.nextRecord;
  return {
    isDuplicate,
    scoreBefore: update.scoreBefore,
    scoreAfter: isDuplicate ? update.scoreBefore : update.scoreAfter,
    daysSinceSeenBefore: update.daysSinceSeenBefore,
    view: toMemoryView(item.key, item.type, effectiveRecord, now),
  };
}
