import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type ContentKey, toContentKey } from '@/features/learning/knowledge-types';
import { type MatchCard, MATCH_PAIRS, accuracyOf, formatDuration, mergeGameRecord, pickMatchRound } from './match-game';
import { buildMatchPool, parseMatchRange, playableLessons } from './match-pool';

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

describe('Ghép thẻ — chỉ dùng kiến thức đã học', () => {
  const NOW = new Date('2026-10-03T08:00:00.000Z');
  const catalog = buildKnowledgeCatalog(loadSeedContent());
  const records = generateDemoMemoryRecords(catalog.items, 30, NOW);
  const byKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  const views: Map<ContentKey, MemoryView> = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, byKey.get(item.key) ?? null, NOW)]));

  it.each([['tu-vung', 'tat-ca'], ['kanji', 'tat-ca'], ['tu-vung', 'can-on']] as const)('%s / %s: mọi thẻ đều đã học', (kind, range) => {
    const pool = buildMatchPool(catalog, views, kind, range);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((item) => views.get(item.contentKey as ContentKey)?.isLearned)).toBe(true);
  });

  it('người mới chưa học gì → bộ thẻ rỗng (không lấy thứ chưa học làm câu đố)', () => {
    expect(buildMatchPool(catalog, new Map(), 'tu-vung', 'tat-ca')).toEqual([]);
  });

  it('chọn theo bài chỉ lấy từ của bài đó; phạm vi lạ → tất cả', () => {
    const [lesson] = playableLessons(catalog, views, 3);
    const pool = buildMatchPool(catalog, views, 'tu-vung', `bai-${lesson}`);
    expect(pool.length).toBeGreaterThanOrEqual(3);
    expect(parseMatchRange('drop table', 'tu-vung')).toBe('tat-ca');
    expect(parseMatchRange('bai-3', 'kanji')).toBe('tat-ca');
  });
});
