import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { ALL_RANGE, LEARNED_RANGE, REVIEW_RANGE, ROADMAP_RANGE, buildListeningPools } from './skill-practice';
import { needsReview } from './study-actions';

const NOW = new Date('2026-10-03T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
const viewsAt = (day: number): Map<ContentKey, MemoryView> => {
  const records = generateDemoMemoryRecords(catalog.items, day, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));
};

describe('Luyện nghe — chọn nghe những gì đã học', () => {
  it('"Đã học" = đúng các từ đã gặp; "Cần ôn" = từ đã học đang mờ / đến hạn; có đủ từ thì mặc định nghe "Đã học"', () => {
    const views = viewsAt(30);
    const pools = buildListeningPools(catalog, 30, views);
    const learned = pools.ranges.find((range) => range.id === LEARNED_RANGE)!;
    expect(learned.group).toBe('Theo trí nhớ');
    expect(learned.keys.length).toBeGreaterThan(0);
    expect(learned.keys.every((key) => views.get(key as ContentKey)?.isLearned)).toBe(true);
    const expected = [...views.values()].filter((view) => view.contentType === 'vocabulary' && view.isLearned).length;
    expect(learned.keys).toHaveLength(expected);
    const review = pools.ranges.find((range) => range.id === REVIEW_RANGE);
    if (review) expect(review.keys.every((key) => needsReview(views.get(key as ContentKey)!))).toBe(true);
    expect(pools.defaultRange).toBe(LEARNED_RANGE);
    // Mọi khoá đều có từ để phát âm.
    for (const range of pools.ranges) for (const key of range.keys) expect(pools.words[key]).toBeTruthy();
  });

  it('chưa học từ nào → không có "Đã học" / "Cần ôn", vẫn nghe theo lộ trình hoặc từng bài như trước', () => {
    const fresh = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    const pools = buildListeningPools(catalog, 14, fresh);
    expect(pools.ranges.some((range) => range.id === LEARNED_RANGE || range.id === REVIEW_RANGE)).toBe(false);
    expect(pools.defaultRange).toBe(ROADMAP_RANGE);
    expect(pools.ranges.some((range) => range.id === ALL_RANGE)).toBe(true);
  });
});
