import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { FOCUS_REVIEW_BATCH_SIZE, MAX_FOCUS_ITEMS, focusReviewBatchHref, focusSessionHref } from './session-modes';
import { buildTestGroups } from './study-actions';

const NOW = new Date('2026-10-03T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
function viewsAtDay(day: number): Map<ContentKey, MemoryView> {
  const records = generateDemoMemoryRecords(catalog.items, day, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));
}

describe('Kiểm tra — nhóm để chọn', () => {
  const kanji = itemsOfType(catalog, 'kanji');
  const vocabulary = itemsOfType(catalog, 'vocabulary');

  it('Kanji: nhóm 10 chữ theo lộ trình, đủ cả 103 chữ', () => {
    const groups = buildTestGroups('kanji', kanji, new Map());
    expect(groups).toHaveLength(Math.ceil(kanji.length / 10));
    expect(groups.flatMap((group) => group.entries)).toHaveLength(kanji.length);
    // Theo thứ tự lộ trình: nhóm đầu là Kanji của bài 1 (học cùng từ), (NekoNeko v3: mọi Kanji đều có từ chứa nó trong bài)
    const dayOf = new Map(kanji.map((item) => [item.key, item.day ?? 0]));
    const days = groups.flatMap((group) => group.entries.map((entry) => dayOf.get(entry.key) ?? 0));
    expect(days).toEqual([...days].sort((left, right) => left - right));
    expect(days[0]).toBe(14);
  });

  it('Từ vựng: theo bài 1 → 25', () => {
    const labels = buildTestGroups('vocabulary', vocabulary, new Map()).map((group) => group.label);
    expect(labels.filter((label) => label.startsWith('Bài')).slice(0, 3)).toEqual(['Bài 1', 'Bài 2', 'Bài 3']);
  });

  it('Chữ cái: ba nhóm, chú thích là romaji', () => {
    const groups = buildTestGroups('hiragana', itemsOfType(catalog, 'hiragana'), new Map());
    expect(groups.map((group) => group.label)).toEqual(['Âm cơ bản', 'Âm đục & bán đục', 'Âm ghép']);
    expect(groups[0].entries[0]).toMatchObject({ face: 'あ', caption: 'a', isLearned: false });
  });

  it('đánh dấu chữ đã học (để chọn nhanh "chỉ chữ đã học")', () => {
    const views = viewsAtDay(30);
    const entries = buildTestGroups('kanji', kanji, views).flatMap((group) => group.entries);
    expect(entries.some((entry) => entry.isLearned)).toBe(true);
    expect(entries.filter((entry) => entry.isLearned).every((entry) => (views.get(entry.key)?.encounterCount ?? 0) > 0)).toBe(true);
  });

  it('một lần kiểm tra đủ cả 103 Kanji; đường dẫn giới hạn số mục', () => {
    expect(MAX_FOCUS_ITEMS).toBeGreaterThanOrEqual(kanji.length);
    const keys = vocabulary.slice(0, 200).map((item) => item.key);
    expect(focusSessionHref(keys).split('k=')[1].split(',')).toHaveLength(MAX_FOCUS_ITEMS);
  });

  it('ôn tuần 120 mục tạo lượt đầu 10 câu và giữ 110 mục cho các lượt kế tiếp', () => {
    const keys = vocabulary.slice(0, MAX_FOCUS_ITEMS).map((item) => item.key);
    const href = focusReviewBatchHref(keys, '/lo-trinh/ngay/22');
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('k')?.split(',')).toHaveLength(FOCUS_REVIEW_BATCH_SIZE);
    expect(params.get('later')?.split(',')).toHaveLength(110);
    expect(params.get('tong')).toBe('12');
    expect(params.get('back')).toBe('/lo-trinh/ngay/22');
  });
});
