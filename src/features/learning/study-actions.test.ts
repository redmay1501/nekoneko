import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { MAX_FOCUS_ITEMS, focusSessionHref } from './session-modes';
import { buildStudyParts } from './study-actions';

const NOW = new Date('2026-10-03T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
function viewsAtDay(day: number): Map<ContentKey, MemoryView> {
  const records = generateDemoMemoryRecords(catalog.items, day, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));
}

describe('Học tập — chọn phạm vi để học / ôn', () => {
  const kanji = itemsOfType(catalog, 'kanji');
  const vocabulary = itemsOfType(catalog, 'vocabulary');

  it('người mới: "Tất cả" bắt đầu từ đầu kho theo thứ tự, không có "Cần ôn"; có từng phần', () => {
    const { parts } = buildStudyParts('kanji', kanji, new Map());
    expect(parts[0].id).toBe('tat-ca');
    expect(parts[0].keys).toHaveLength(30);
    expect(parts[0].newCount).toBe(30);
    expect(parts.some((part) => part.id === 'can-on')).toBe(false);
    expect(parts.filter((part) => part.id.startsWith('nhom-'))).toHaveLength(Math.ceil(kanji.length / 10));
  });

  it('đã học xong cả kho: "Tất cả" ôn mục lâu chưa gặp nhất trước, toàn bộ là ôn lại', () => {
    const views = viewsAtDay(90);
    const { parts, learned, total } = buildStudyParts('kanji', kanji, views);
    expect(learned).toBe(total);
    const all = parts[0];
    expect(all.newCount).toBe(0);
    const days = all.keys.map((key) => views.get(key)?.daysSinceSeen ?? 0);
    expect(days).toEqual([...days].sort((a, b) => b - a));
  });

  it('từ vựng chia theo bài: mỗi bài là một phần, gói trọn cả bài', () => {
    const { parts } = buildStudyParts('vocabulary', vocabulary, new Map());
    const lesson8 = parts.find((part) => part.label === 'Bài 8')!;
    expect(lesson8.keys.length).toBe(vocabulary.filter((item) => item.type === 'vocabulary' && /BÀI 8\b|Bài 8\b/i.test(item.content.lesson)).length);
    expect(Math.max(...parts.map((part) => part.keys.length))).toBeLessThanOrEqual(MAX_FOCUS_ITEMS);
    expect(parts.filter((part) => part.label.startsWith('Bài')).slice(0, 3).map((part) => part.label)).toEqual(['Bài 1', 'Bài 2', 'Bài 3']);
  });

  it('"Cần ôn" chỉ gồm mục đã học đang yếu / sắp quên / đến hạn', () => {
    const views = viewsAtDay(30);
    const review = buildStudyParts('vocabulary', vocabulary, views).parts.find((part) => part.id === 'can-on');
    expect(review?.keys.every((key) => views.get(key)?.isLearned)).toBe(true);
  });

  it('đường dẫn phiên chọn riêng giới hạn số mục', () => {
    const keys = vocabulary.slice(0, 80).map((item) => item.key);
    expect(focusSessionHref(keys).split('k=')[1].split(',')).toHaveLength(MAX_FOCUS_ITEMS);
  });
});
