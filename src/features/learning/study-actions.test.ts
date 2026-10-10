import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { DAY_CHUNK_SIZE, MAX_FOCUS_ITEMS, focusSessionHref } from './session-modes';
import { buildStudyActions } from './study-actions';

const NOW = new Date('2026-10-03T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
function viewsAtDay(day: number): Map<ContentKey, MemoryView> {
  const records = generateDemoMemoryRecords(catalog.items, day, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));
}

describe('hành động học ở trang Học tập', () => {
  const kanji = itemsOfType(catalog, 'kanji');

  it('người mới (chưa học gì): "Bắt đầu học" 5 chữ đầu theo lộ trình, không có Ôn / Kiểm tra', () => {
    const actions = buildStudyActions(kanji, new Map(), 'seed');
    expect(actions.isFirstStart).toBe(true);
    expect(actions.next).toHaveLength(DAY_CHUNK_SIZE);
    expect(actions.next[0]).toBe([...kanji].sort((a, b) => (a.day ?? 999) - (b.day ?? 999) || a.id - b.id)[0].key);
    expect(actions.review).toEqual([]);
    expect(actions.test).toEqual([]);
  });

  it('đang học: "Học tiếp" chỉ lấy thứ chưa gặp; Kiểm tra chỉ lấy thứ đã học', () => {
    const views = viewsAtDay(30);
    const actions = buildStudyActions(kanji, views, 'seed');
    expect(actions.isFirstStart).toBe(false);
    expect(actions.next.every((key) => (views.get(key)?.encounterCount ?? 0) === 0)).toBe(true);
    expect(actions.test.length).toBeGreaterThan(0);
    expect(actions.test.every((key) => views.get(key)?.isLearned)).toBe(true);
    expect(actions.review.every((key) => views.get(key)?.isLearned)).toBe(true);
  });

  it('đường dẫn phiên chọn riêng giới hạn số mục', () => {
    const keys = kanji.slice(0, 30).map((item) => item.key);
    expect(focusSessionHref(keys).split('k=')[1].split(',')).toHaveLength(MAX_FOCUS_ITEMS);
  });
});
