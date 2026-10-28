import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { createInitialMemoryRecord, toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import type { ContentKey, KnowledgeItem } from '@/features/learning/knowledge-types';
import {
  MIN_STREAK_QUESTIONS, STREAK_OPTIONS, STREAK_RECORD_KEY, applyStreakAnswer, bestStreakOf, buildStreakDeck, buildStreakItems,
  initialStreakState, mergeStreakRecord, streakMilestone,
} from './neko-streak';

const NOW = new Date('2026-10-28T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
const seeded = (seed: number) => { let state = seed + 1; return () => ((state = (state * 16807) % 2147483647) / 2147483647); };

/** Người học đã gặp MỌI mục tới ngày `learnedUpTo` (kể cả ngày sau ngày đang học — để thử luật "không vượt ngày đang học"). */
function viewsLearnedUpTo(learnedUpTo: number): Map<ContentKey, MemoryView> {
  return new Map((catalog.items as KnowledgeItem[]).map((item) => {
    const learned = item.day !== null && item.day <= learnedUpTo;
    const record = learned ? { ...createInitialMemoryRecord(item.type, item.id, NOW), encounterCount: 2 } : null;
    return [item.key, toMemoryView(item.key, item.type, record as never, NOW)];
  }));
}
const dayOf = (key: string) => catalog.byKey.get(key as ContentKey)!.day!;

describe('Neko Streak — phạm vi kiến thức theo tiến độ của từng người', () => {
  it.each([5, 20, 45, 90])('đang học ngày %i: chỉ kiến thức ngày ≤ %i, kể cả khi đã "học trước" ngày sau', (journeyDay) => {
    const items = buildStreakItems(catalog, viewsLearnedUpTo(90), journeyDay);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => dayOf(item.key) <= journeyDay)).toBe(true);
  });

  it('chỉ mục ĐÃ HỌC: ngày đã tới nhưng chưa gặp thì không vào game', () => {
    const items = buildStreakItems(catalog, viewsLearnedUpTo(10), 30);
    expect(items.every((item) => dayOf(item.key) <= 10)).toBe(true);
    const fresh = new Map((catalog.items as KnowledgeItem[]).map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    expect(buildStreakItems(catalog, fresh, 90)).toEqual([]);
  });

  it('hai người tiến độ khác nhau → phạm vi khác nhau; học thêm ngày mới → phạm vi mở rộng', () => {
    const early = buildStreakItems(catalog, viewsLearnedUpTo(90), 15).map((item) => item.key);
    const later = buildStreakItems(catalog, viewsLearnedUpTo(90), 25).map((item) => item.key);
    expect(later.length).toBeGreaterThan(early.length);
    expect(early.every((key) => later.includes(key))).toBe(true);
  });

  it('câu hỏi VÀ đáp án nhiễu đều thuộc phạm vi; đủ 4 đáp án khác nhau, đúng một đáp án đúng', () => {
    const journeyDay = 20;
    const items = buildStreakItems(catalog, viewsLearnedUpTo(90), journeyDay);
    const inScope = new Set(items.flatMap((item) => [item.face, item.reading, item.meaning]));
    const deck = buildStreakDeck(items, seeded(1));
    expect(deck.length).toBeGreaterThanOrEqual(MIN_STREAK_QUESTIONS);
    for (const question of deck) {
      expect(question.options).toHaveLength(STREAK_OPTIONS);
      expect(new Set(question.options.map((option) => option.trim().toLowerCase())).size).toBe(STREAK_OPTIONS);
      expect(question.options.filter((option) => option === question.answer)).toHaveLength(1);
      for (const option of question.options) expect(inScope.has(option)).toBe(true);
      expect(dayOf(question.contentKey)).toBeLessThanOrEqual(journeyDay);
    }
  });

  it('không lặp câu trong một bộ; bỏ qua câu đã hỏi trong phiên; thứ tự xáo khác nhau giữa các lần', () => {
    const items = buildStreakItems(catalog, viewsLearnedUpTo(90), 30);
    const deck = buildStreakDeck(items, seeded(2));
    expect(new Set(deck.map((question) => question.id)).size).toBe(deck.length);
    const asked = new Set(deck.slice(0, 10).map((question) => question.id));
    const rest = buildStreakDeck(items, seeded(3), asked);
    expect(rest.some((question) => asked.has(question.id))).toBe(false);
    expect(rest.length).toBe(deck.length - 10);
    expect(buildStreakDeck(items, seeded(4)).map((question) => question.id)).not.toEqual(deck.map((question) => question.id));
  });

  it('hết câu hợp lệ → bộ rỗng (không tự bịa / lặp vài câu để kéo dài)', () => {
    const items = buildStreakItems(catalog, viewsLearnedUpTo(90), 14);
    const all = new Set(buildStreakDeck(items, seeded(5)).map((question) => question.id));
    expect(buildStreakDeck(items, seeded(6), all)).toEqual([]);
  });
});

describe('Neko Streak — chuỗi đúng & kỷ lục', () => {
  it('đúng liên tiếp tăng chuỗi; sai về 0 nhưng giữ kỷ lục; chuỗi mới vượt thì kỷ lục theo chuỗi', () => {
    let state = initialStreakState(0);
    for (let index = 0; index < 12; index += 1) state = applyStreakAnswer(state, true);
    expect(state).toMatchObject({ streak: 12, best: 12, answered: 12, correct: 12 });
    state = applyStreakAnswer(state, false);
    expect(state).toMatchObject({ streak: 0, best: 12, answered: 13 });
    for (let index = 0; index < 25; index += 1) state = applyStreakAnswer(state, true);
    expect(state).toMatchObject({ streak: 25, best: 25 });
  });

  it('không giới hạn: qua 20, 50, 100 câu game không dừng / reset; mốc chỉ là lời khen', () => {
    let state = initialStreakState(3);
    for (let index = 0; index < 150; index += 1) state = applyStreakAnswer(state, true);
    expect(state.streak).toBe(150);
    expect(state.best).toBe(150);
    expect(streakMilestone(20)).toBeTruthy();
    expect(streakMilestone(100)).toBeTruthy();
    expect(streakMilestone(150)).toBeTruthy();
    expect(streakMilestone(7)).toBeNull();
  });

  it('isNewBest chỉ khi chuỗi vượt kỷ lục đang có', () => {
    let state = initialStreakState(2);
    state = applyStreakAnswer(state, true);
    expect(state.isNewBest).toBe(false);
    state = applyStreakAnswer(state, true);
    expect(state.isNewBest).toBe(false); // bằng kỷ lục
    state = applyStreakAnswer(state, true);
    expect(state.isNewBest).toBe(true);
  });

  it('lưu kỷ lục: luôn giữ giá trị lớn nhất (gửi lại / lệch thứ tự không làm lùi), giữ dữ liệu trò khác', () => {
    const others = { 'match:tu-vung:tat-ca:6': { bestAccuracy: 90, bestTimeMs: 30000, plays: 2, lastPlayedAt: NOW.toISOString() } };
    let { records, isNewBest } = mergeStreakRecord(others, 12, NOW, true);
    expect(isNewBest).toBe(true);
    expect(bestStreakOf(records)).toBe(12);
    ({ records, isNewBest } = mergeStreakRecord(records, 7, NOW, false)); // đến muộn, nhỏ hơn
    expect(isNewBest).toBe(false);
    expect(bestStreakOf(records)).toBe(12);
    ({ records } = mergeStreakRecord(records, 12, NOW, false)); // gửi lại cùng giá trị
    expect(bestStreakOf(records)).toBe(12);
    expect(records[STREAK_RECORD_KEY]!.plays).toBe(1);
    expect(records['match:tu-vung:tat-ca:6']).toEqual(others['match:tu-vung:tat-ca:6']);
  });

  it('khôi phục phiên: chuỗi đang chạy được giữ, kỷ lục không nhỏ hơn chuỗi đó', () => {
    expect(initialStreakState(5, { streak: 8, answered: 10, correct: 9 })).toMatchObject({ streak: 8, best: 8, answered: 10 });
    expect(initialStreakState(20, { streak: 8, answered: 10, correct: 9 })).toMatchObject({ streak: 8, best: 20 });
  });
});
