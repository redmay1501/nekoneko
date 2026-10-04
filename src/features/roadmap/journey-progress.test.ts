import { describe, expect, it } from 'vitest';
import { buildKnowledgeCatalog, itemsScheduledOn } from '@/features/learning/knowledge-catalog';
import type { ContentKey } from '@/features/learning/knowledge-types';
import { toMemoryView, createInitialMemoryRecord } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { loadSeedContent } from '@/lib/data/seed-content';
import {
  completedDayCount,
  getDayCompletionProgress,
  relationToCurrentDay,
  isDayReadyToComplete,
} from './journey-progress';

const NOW = new Date('2026-10-04T08:00:00Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());

/** Trí nhớ của người học mới: kiến thức tới ngày `day` đã được gieo nhưng CHƯA gặp lần nào. */
function freshViews(day: number, metKeys: ContentKey[] = []): Map<ContentKey, MemoryView> {
  return new Map(catalog.items.map((item) => {
    const isSeeded = item.day !== null && item.day <= day;
    const record = isSeeded ? { ...createInitialMemoryRecord(item.type, item.id, NOW), encounterCount: metKeys.includes(item.key) ? 1 : 0 } : null;
    return [item.key, toMemoryView(item.key, item.type, record, NOW)];
  }));
}

describe('getDayCompletionProgress', () => {
  const dayOneKeys = itemsScheduledOn(catalog, 1).map((item) => item.key);

  it('tài khoản mới ở ngày 1: có 10 chữ Hiragana (Katakana học từ ngày 8), chưa gặp cái nào', () => {
    expect(getDayCompletionProgress(catalog, freshViews(1), 1)).toEqual({
      metCount: 0, totalCount: 10, hasNewKnowledge: true, isAllKnowledgeMet: false,
    });
  });

  it('gặp gần hết vẫn chưa xong ngày', () => {
    const progress = getDayCompletionProgress(catalog, freshViews(1, dayOneKeys.slice(0, 9)), 1);
    expect(progress.metCount).toBe(9);
    expect(progress.isAllKnowledgeMet).toBe(false);
  });

  it('gặp hết kiến thức của ngày → xong ngày', () => {
    expect(getDayCompletionProgress(catalog, freshViews(1, dayOneKeys), 1).isAllKnowledgeMet).toBe(true);
  });

  it('ngày ôn tập (không có kiến thức mới) không bao giờ tự xong — phải tự bấm', () => {
    const reviewDay = Array.from({ length: 90 }, (_, index) => index + 1).find((day) => itemsScheduledOn(catalog, day).length === 0);
    expect(reviewDay).toBeDefined();
    const progress = getDayCompletionProgress(catalog, freshViews(reviewDay ?? 1), reviewDay ?? 1);
    expect(progress.hasNewKnowledge).toBe(false);
    expect(progress.isAllKnowledgeMet).toBe(false);
  });
});

describe('isDayReadyToComplete', () => {
  const allMet = { metCount: 3, totalCount: 3, hasNewKnowledge: true, isAllKnowledgeMet: true };
  it('gặp hết thì mời hoàn thành ngày (không tự chuyển)', () => {
    expect(isDayReadyToComplete({ currentDay: 5, isJourneyComplete: false }, allMet)).toBe(true);
  });
  it('chưa gặp hết thì chưa mời', () => {
    expect(isDayReadyToComplete({ currentDay: 5, isJourneyComplete: false }, { ...allMet, metCount: 2, isAllKnowledgeMet: false })).toBe(false);
  });
  it('đã xong cả lộ trình thì không mời nữa', () => {
    expect(isDayReadyToComplete({ currentDay: 90, isJourneyComplete: true }, allMet)).toBe(false);
  });
});

describe('completedDayCount & relationToCurrentDay', () => {
  it('đang ở ngày 1 nghĩa là chưa xong ngày nào', () => {
    expect(completedDayCount({ currentDay: 1, isJourneyComplete: false })).toBe(0);
  });
  it('xong ngày 90 là xong cả 90 ngày', () => {
    expect(completedDayCount({ currentDay: 90, isJourneyComplete: true })).toBe(90);
  });
  it('phân loại ngày đã xong / đang học / chưa tới', () => {
    const position = { currentDay: 23, isJourneyComplete: false };
    expect([22, 23, 24].map((day) => relationToCurrentDay(day, position))).toEqual(['done', 'current', 'upcoming']);
    expect(relationToCurrentDay(90, { currentDay: 90, isJourneyComplete: true })).toBe('done');
  });
});

describe('dữ liệu demo', () => {
  it('kiến thức của ngày đang học chưa được gặp — phải học mới xong ngày', async () => {
    const { generateDemoMemoryRecords } = await import('@/features/memory/demo-memory-seed');
    const records = generateDemoMemoryRecords(catalog.items, 23, NOW);
    const views = new Map(catalog.items.map((item) => {
      const record = records.find((candidate) => candidate.contentType === item.type && candidate.contentId === item.id) ?? null;
      return [item.key, toMemoryView(item.key, item.type, record, NOW)];
    }));
    const progress = getDayCompletionProgress(catalog, views, 23);
    expect(progress.metCount).toBe(0);
    expect(getDayCompletionProgress(catalog, views, 22).isAllKnowledgeMet).toBe(true);
  });
});

describe('estimateMinutesToFinishDay', () => {
  it('còn 13 kiến thức → khoảng 15 phút; xong rồi → 0', async () => {
    const { estimateMinutesToFinishDay } = await import('./journey-progress');
    expect(estimateMinutesToFinishDay({ metCount: 0, totalCount: 13, hasNewKnowledge: true, isAllKnowledgeMet: false })).toBe(15);
    expect(estimateMinutesToFinishDay({ metCount: 13, totalCount: 13, hasNewKnowledge: true, isAllKnowledgeMet: true })).toBe(0);
  });
});
