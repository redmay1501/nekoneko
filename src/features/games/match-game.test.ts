import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type ContentKey, toContentKey } from '@/features/learning/knowledge-types';
import { type MatchCard, MATCH_PAIRS, accuracyOf, formatDuration, mergeGameRecord, pickMatchRound } from './match-game';
import { MIXED_POOL_LIMIT, buildMatchPool, buildMixedMatchPool, parseMatchKind } from './match-pool';

const card = (id: number, face: string, answer: string): MatchCard => ({ contentKey: `vocabulary-${id}`, face, answer, audioText: face });

describe('Ghép thẻ — ván chơi', () => {
  it('mỗi ván tối đa 6 cặp, không trùng mặt chữ, không trùng nghĩa', () => {
    const pool = [card(1, 'あ', 'A'), card(2, 'い', 'a'), card(3, 'う', 'U'), card(4, 'あ', 'X'), ...Array.from({ length: 10 }, (_, i) => card(10 + i, `f${i}`, `m${i}`))];
    for (let seed = 0; seed < 20; seed++) {
      let state = seed + 1;
      const random = () => ((state = (state * 16807) % 2147483647) / 2147483647);
      const round = pickMatchRound(pool, random);
      expect(round).toHaveLength(MATCH_PAIRS);
      expect(new Set(round.map((item) => item.face)).size).toBe(round.length);
      expect(new Set(round.map((item) => item.answer.toLowerCase())).size).toBe(round.length);
    }
  });

  it('ít thẻ hơn 6 thì chơi với đủ số đang có', () => {
    expect(pickMatchRound([card(1, 'a', 'A'), card(2, 'b', 'B'), card(3, 'c', 'C')])).toHaveLength(3);
  });

  it('độ chính xác = số cặp / số lần ghép', () => {
    expect(accuracyOf({ pairs: 6, mistakes: 0, timeMs: 1 })).toBe(100);
    expect(accuracyOf({ pairs: 6, mistakes: 2, timeMs: 1 })).toBe(75);
    expect(formatDuration(65_400)).toBe('1:05');
  });
});

describe('Ghép thẻ — kỷ lục', () => {
  const now = new Date('2026-10-11T10:00:00Z');
  it('kỷ lục: chính xác hơn, hoặc bằng mà nhanh hơn', () => {
    const first = mergeGameRecord({}, 'match:x', { pairs: 6, mistakes: 2, timeMs: 40_000 }, now);
    expect(first.isNewBest).toBe(true);
    const slower = mergeGameRecord(first.records, 'match:x', { pairs: 6, mistakes: 2, timeMs: 50_000 }, now);
    expect(slower.isNewBest).toBe(false);
    expect(slower.record).toMatchObject({ bestAccuracy: 75, bestTimeMs: 40_000, plays: 2 });
    const perfect = mergeGameRecord(slower.records, 'match:x', { pairs: 6, mistakes: 0, timeMs: 90_000 }, now);
    expect(perfect.isNewBest).toBe(true);
    expect(perfect.record).toMatchObject({ bestAccuracy: 100, bestTimeMs: 90_000, plays: 3 });
  });

  it('giữ tối đa 40 phạm vi, bỏ phạm vi chơi lâu nhất', () => {
    let records = {};
    for (let i = 0; i < 45; i++) records = mergeGameRecord(records, `match:s${i}`, { pairs: 6, mistakes: 0, timeMs: 1000 }, new Date(now.getTime() + i * 1000)).records;
    expect(Object.keys(records)).toHaveLength(40);
    expect(records).not.toHaveProperty('match:s0');
  });
});

describe('Ghép thẻ — chọn phạm vi như phần học', () => {
  const NOW = new Date('2026-10-03T08:00:00.000Z');
  const catalog = buildKnowledgeCatalog(loadSeedContent());
  const records = generateDemoMemoryRecords(catalog.items, 30, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  const views: Map<ContentKey, MemoryView> = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));

  it('"Đã học" / "Cần ôn" chỉ gồm thứ đã học', () => {
    for (const range of ['da-hoc', 'can-on']) {
      const pool = buildMatchPool(catalog, views, 'tu-vung', range);
      expect(pool.range).toBe(range);
      expect(pool.cards.every((card) => views.get(card.contentKey as ContentKey)?.isLearned)).toBe(true);
    }
  });

  it('chọn được một bài CHƯA học tới (ôn trước)', () => {
    const pool = buildMatchPool(catalog, views, 'tu-vung', undefined);
    const lesson25 = pool.options.find((option) => option.label === 'Bài 25')!;
    const chosen = buildMatchPool(catalog, views, 'tu-vung', lesson25.id);
    expect(chosen.cards).toHaveLength(lesson25.size);
    expect(chosen.cards.some((card) => !views.get(card.contentKey as ContentKey)?.isLearned)).toBe(true);
  });

  it('người mới: mặc định là phần đầu tiên (chưa có "Đã học")', () => {
    const pool = buildMatchPool(catalog, new Map(), 'kanji', undefined);
    expect(pool.options.some((option) => option.id === 'da-hoc')).toBe(false);
    expect(pool.range).toBe('nhom-1');
    expect(pool.cards).toHaveLength(10);
  });

  it('chữ cái: ghép chữ với romaji', () => {
    const pool = buildMatchPool(catalog, new Map(), 'hiragana', 'tat-ca');
    expect(pool.cards.find((card) => card.face === 'そ')?.answer).toBe('so');
  });

  it('ghép nhiều bài: đủ thẻ của từng bài, thứ tự id theo danh sách, nhãn "Bài 1 + Bài 3"', () => {
    const base = buildMatchPool(catalog, views, 'tu-vung', undefined);
    const [lesson1, lesson3, lesson5, lesson7] = ['Bài 1', 'Bài 3', 'Bài 5', 'Bài 7'].map((label) => base.options.find((option) => option.label === label)!);
    const combined = buildMatchPool(catalog, views, 'tu-vung', `${lesson3.id},${lesson1.id}`);
    expect(combined.range).toBe(`${lesson1.id},${lesson3.id}`);
    expect(combined.rangeLabel).toBe('Bài 1 + Bài 3');
    expect(combined.cards).toHaveLength(lesson1.size + lesson3.size);
    const many = buildMatchPool(catalog, views, 'tu-vung', [lesson1, lesson3, lesson5, lesson7].map((option) => option.id).join(','));
    expect(many.rangeLabel).toBe('4 bài');
    // id lạ trong tổ hợp bị bỏ qua, phần hợp lệ vẫn giữ.
    expect(buildMatchPool(catalog, views, 'tu-vung', `${lesson1.id},xyz`).range).toBe(lesson1.id);
  });

  it('phạm vi lạ → mặc định; loại lạ → từ vựng', () => {
    expect(buildMatchPool(catalog, views, 'tu-vung', 'drop table').range).toBe('da-hoc');
    expect(parseMatchKind('xyz')).toBe('tu-vung');
  });
});

describe('Ghép thẻ — Tổng hợp (trộn mọi thứ đã học)', () => {
  const NOW = new Date('2026-10-03T08:00:00.000Z');
  const catalog = buildKnowledgeCatalog(loadSeedContent());
  const records = generateDemoMemoryRecords(catalog.items, 30, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  const views: Map<ContentKey, MemoryView> = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));
  const seeded = (seed: number) => { let state = seed + 1; return () => ((state = (state * 16807) % 2147483647) / 2147483647); };

  it('chỉ lấy mục ĐÃ HỌC, đủ các loại có cặp ghép; không lấy ngữ pháp, không lấy mục chưa gặp', () => {
    const pool = buildMixedMatchPool(catalog, views, undefined, seeded(1));
    expect(parseMatchKind('tong-hop')).toBe('tong-hop');
    expect(pool.range).toBe('da-hoc');
    expect(pool.cards.length).toBeGreaterThan(0);
    for (const entry of pool.cards) {
      expect(views.get(entry.contentKey as ContentKey)?.isLearned).toBe(true);
      expect(entry.contentKey.startsWith('grammar')).toBe(false);
      expect(entry.face.trim() && entry.answer.trim()).toBeTruthy();
    }
    expect(new Set(pool.cards.map((entry) => entry.contentKey)).size).toBe(pool.cards.length);
    expect(pool.breakdown!.reduce((sum, entry) => sum + entry.count, 0)).toBe(pool.totalCount);
    expect(pool.cards.length).toBe(Math.min(pool.totalCount!, MIXED_POOL_LIMIT));
  });

  it('chưa học gì → không có thẻ nào (không đưa kiến thức chưa học vào)', () => {
    const fresh = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    const pool = buildMixedMatchPool(catalog, fresh, undefined);
    expect(pool.cards).toEqual([]);
    expect(pool.breakdown).toEqual([]);
  });

  it('mỗi ván: không trùng mặt chữ / nghĩa giữa các loại; mục cần ôn được ưu tiên (tối đa nửa bàn)', () => {
    const pool = buildMixedMatchPool(catalog, views, undefined, seeded(2));
    const urgentCount = pool.cards.filter((entry) => entry.priority).length;
    for (let seed = 0; seed < 30; seed++) {
      const round = pickMatchRound(pool.cards, seeded(seed), 8);
      expect(new Set(round.map((entry) => entry.face)).size).toBe(round.length);
      expect(new Set(round.map((entry) => entry.answer.trim().toLowerCase())).size).toBe(round.length);
      expect(round.filter((entry) => entry.priority).length).toBeGreaterThanOrEqual(Math.min(urgentCount, 1));
    }
    // Mỗi ván một bộ khác.
    const a = pickMatchRound(pool.cards, seeded(3), 8).map((entry) => entry.contentKey).sort();
    const b = pickMatchRound(pool.cards, seeded(4), 8).map((entry) => entry.contentKey).sort();
    expect(a).not.toEqual(b);
  });

  it('phạm vi Cần ôn chỉ gồm mục cần ôn; phạm vi lạ → Mọi thứ đã học', () => {
    const review = buildMixedMatchPool(catalog, views, 'can-on');
    if (review.range === 'can-on') expect(review.cards.every((entry) => entry.priority)).toBe(true);
    expect(buildMixedMatchPool(catalog, views, 'bai-3').range).toBe('da-hoc');
  });
});
