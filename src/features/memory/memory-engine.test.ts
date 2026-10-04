import { describe, expect, it } from 'vitest';
import {
  calculateMemoryHealth,
  calculateMemoryUpdate,
  createInitialMemoryRecord,
  getEffectiveMemoryScore,
  getForgettingRadar,
  getMemoryStatus,
  getNextReviewDate,
  pickMemorySurprise,
  toMemoryView,
} from './memory-engine';
import { INITIAL_MEMORY_SCORE, MEMORY_SCORE_LIMITS, SCORE_CHANGE } from './memory-rules';
import type { MemoryRecord, MemoryView } from './memory-types';
import { addDays } from '@/lib/utils/dates';
import type { ContentKey, ContentType } from '@/features/learning/knowledge-types';

const NOW = new Date('2026-10-03T08:00:00.000Z');

function recordWith(overrides: Partial<MemoryRecord>): MemoryRecord {
  return {
    ...createInitialMemoryRecord('vocabulary', 1, addDays(NOW, -10)),
    lastSeenAt: NOW.toISOString(),
    ...overrides,
  };
}

function viewWith(overrides: Partial<MemoryView> & { contentKey: ContentKey; contentType?: ContentType }): MemoryView {
  return {
    contentType: 'vocabulary', isLearned: true, status: 'learning', memoryScore: 60,
    encounterCount: 2, correctCount: 1, wrongCount: 0, daysSinceSeen: 5, daysUntilReview: 0,
    lastEncounterText: '5 ngày trước', nextEncounterText: 'Hôm nay', reason: '',
    ...overrides,
  };
}

describe('getMemoryStatus — ngưỡng chuyển trạng thái', () => {
  it.each([
    [99, 'mastered'], [90, 'mastered'], [89, 'strong'], [74, 'strong'], [73, 'learning'],
    [56, 'learning'], [55, 'fading'], [40, 'fading'], [39, 'weak'], [10, 'weak'],
  ])('điểm %i → %s', (score, expected) => {
    expect(getMemoryStatus(score)).toBe(expected);
  });
});

describe('getEffectiveMemoryScore — trôi theo thời gian', () => {
  it('không trôi khi vừa gặp hôm nay', () => {
    expect(getEffectiveMemoryScore(recordWith({ memoryScore: 80 }), NOW)).toBe(80);
  });

  it('trừ 0.45 điểm mỗi ngày không gặp', () => {
    const record = recordWith({ memoryScore: 80, lastSeenAt: addDays(NOW, -10).toISOString() });
    expect(getEffectiveMemoryScore(record, NOW)).toBe(Math.round(80 - 10 * 0.45));
  });

  it('không bao giờ trôi xuống dưới mức sàn', () => {
    const record = recordWith({ memoryScore: 12, lastSeenAt: addDays(NOW, -400).toISOString() });
    expect(getEffectiveMemoryScore(record, NOW)).toBe(MEMORY_SCORE_LIMITS.FLOOR);
  });

  it('mục chưa gặp lại lần nào trôi tính từ lúc được gieo', () => {
    const record = recordWith({ memoryScore: 50, lastSeenAt: null, createdAt: addDays(NOW, -20).toISOString() });
    expect(getEffectiveMemoryScore(record, NOW)).toBe(41);
  });
});

describe('calculateMemoryUpdate — một lần gặp lại', () => {
  it('trả lời đúng: +14, tăng số lần đúng, đẩy lịch gặp lại ra xa', () => {
    const result = calculateMemoryUpdate({
      record: recordWith({ memoryScore: 60 }), contentType: 'vocabulary', contentId: 1,
      eventType: 'recall', isCorrect: true, now: NOW,
    });
    expect(result.scoreBefore).toBe(60);
    expect(result.scoreAfter).toBe(60 + SCORE_CHANGE.CORRECT);
    expect(result.nextRecord.correctCount).toBe(1);
    expect(result.nextRecord.encounterCount).toBe(1);
    expect(result.nextRecord.lastRecalledAt).toBe(NOW.toISOString());
    expect(result.nextRecord.nextReviewAt).toBe(addDays(NOW, Math.round(74 / 18)).toISOString());
  });

  it('trả lời sai: −6, gặp lại ngay ngày mai, không cập nhật lần nhớ đúng', () => {
    const before = recordWith({ memoryScore: 60, lastRecalledAt: addDays(NOW, -3).toISOString() });
    const result = calculateMemoryUpdate({
      record: before, contentType: 'vocabulary', contentId: 1, eventType: 'recall', isCorrect: false, now: NOW,
    });
    expect(result.scoreAfter).toBe(60 + SCORE_CHANGE.WRONG);
    expect(result.nextRecord.wrongCount).toBe(1);
    expect(result.nextRecord.lastRecalledAt).toBe(before.lastRecalledAt);
    expect(result.nextRecord.nextReviewAt).toBe(addDays(NOW, 1).toISOString());
  });

  it('không vượt trần 99 khi đúng liên tục', () => {
    const result = calculateMemoryUpdate({
      record: recordWith({ memoryScore: 95 }), contentType: 'kanji', contentId: 1,
      eventType: 'recall', isCorrect: true, now: NOW,
    });
    expect(result.scoreAfter).toBe(MEMORY_SCORE_LIMITS.CEILING);
  });

  it('không xuống dưới sàn 10 khi sai liên tục', () => {
    const result = calculateMemoryUpdate({
      record: recordWith({ memoryScore: 12 }), contentType: 'kanji', contentId: 1,
      eventType: 'recall', isCorrect: false, now: NOW,
    });
    expect(result.scoreAfter).toBe(MEMORY_SCORE_LIMITS.FLOOR);
  });

  it('khám phá: không đổi điểm nhưng vẫn tính là một lần gặp', () => {
    const result = calculateMemoryUpdate({
      record: recordWith({ memoryScore: 35 }), contentType: 'kanji', contentId: 1,
      eventType: 'discover', isCorrect: null, now: NOW,
    });
    expect(result.scoreAfter).toBe(35);
    expect(result.nextRecord.encounterCount).toBe(1);
    expect(result.nextRecord.correctCount).toBe(0);
    expect(result.nextRecord.wrongCount).toBe(0);
  });

  it('cứu kiến thức luôn tính như trả lời đúng và đếm số lần được cứu', () => {
    const result = calculateMemoryUpdate({
      record: recordWith({ memoryScore: 30 }), contentType: 'vocabulary', contentId: 1,
      eventType: 'rescue', isCorrect: false, now: NOW,
    });
    expect(result.scoreAfter).toBe(30 + SCORE_CHANGE.CORRECT);
    expect(result.nextRecord.rescuedCount).toBe(1);
  });

  it('chốt phần trôi vào điểm trước khi cộng — không trừ hai lần ở lần sau', () => {
    const stale = recordWith({ memoryScore: 70, lastSeenAt: addDays(NOW, -20).toISOString() });
    const first = calculateMemoryUpdate({
      record: stale, contentType: 'vocabulary', contentId: 1, eventType: 'recall', isCorrect: false, now: NOW,
    });
    expect(first.scoreBefore).toBe(61);
    expect(getEffectiveMemoryScore(first.nextRecord, NOW)).toBe(first.scoreAfter);
  });

  it('chưa có bản ghi thì tạo mới từ điểm khởi đầu', () => {
    const result = calculateMemoryUpdate({
      record: null, contentType: 'grammar', contentId: 3, eventType: 'use', isCorrect: true, now: NOW,
    });
    expect(result.scoreBefore).toBe(INITIAL_MEMORY_SCORE);
    expect(result.daysSinceSeenBefore).toBeNull();
    expect(result.nextRecord.contentType).toBe('grammar');
  });
});

describe('getNextReviewDate', () => {
  it('đúng với điểm thấp vẫn gặp lại tối thiểu sau 1 ngày', () => {
    expect(getNextReviewDate(10, true, NOW).toISOString()).toBe(addDays(NOW, 1).toISOString());
  });
  it('đúng với điểm cao gặp lại xa hơn', () => {
    expect(getNextReviewDate(99, true, NOW).toISOString()).toBe(addDays(NOW, 6).toISOString());
  });
});

describe('getForgettingRadar — ra-đa sắp quên', () => {
  const views = [
    viewWith({ contentKey: 'vocabulary-1', status: 'fading', memoryScore: 50, daysSinceSeen: 4 }),
    viewWith({ contentKey: 'vocabulary-2', status: 'weak', memoryScore: 20, daysSinceSeen: 3 }),
    viewWith({ contentKey: 'vocabulary-3', status: 'weak', memoryScore: 15, daysSinceSeen: 1 }),
    viewWith({ contentKey: 'vocabulary-4', status: 'strong', memoryScore: 80, daysSinceSeen: 9 }),
    viewWith({ contentKey: 'vocabulary-5', status: 'new', isLearned: false, memoryScore: 0, daysSinceSeen: null }),
  ];

  it('chỉ lấy sắp quên / chưa vững, xếp yếu nhất lên đầu', () => {
    expect(getForgettingRadar(views).map((view) => view.contentKey)).toEqual(['vocabulary-2', 'vocabulary-1']);
  });

  it('mục vừa gặp trong 1 ngày qua không bao giờ bị báo sắp quên', () => {
    expect(getForgettingRadar(views).some((view) => view.contentKey === 'vocabulary-3')).toBe(false);
  });

  it('trả về danh sách rỗng khi không có gì cần cứu', () => {
    expect(getForgettingRadar([views[3]])).toEqual([]);
  });
});

describe('pickMemorySurprise — vùng vàng', () => {
  it('chỉ chọn từ vựng/kanji điểm 58–86, ít nhất 3 ngày chưa gặp', () => {
    const views = [
      viewWith({ contentKey: 'vocabulary-1', memoryScore: 70, daysSinceSeen: 6 }),
      viewWith({ contentKey: 'vocabulary-2', memoryScore: 95, daysSinceSeen: 6 }),
      viewWith({ contentKey: 'vocabulary-3', memoryScore: 70, daysSinceSeen: 1 }),
      viewWith({ contentKey: 'hiragana-1', contentType: 'hiragana', memoryScore: 70, daysSinceSeen: 6 }),
    ];
    expect(pickMemorySurprise(views, 'seed')?.contentKey).toBe('vocabulary-1');
  });

  it('cùng seed luôn chọn cùng một mục (tất định)', () => {
    const views = Array.from({ length: 10 }, (_, index) =>
      viewWith({ contentKey: `vocabulary-${index + 1}` as ContentKey, memoryScore: 70, daysSinceSeen: 5 }));
    expect(pickMemorySurprise(views, 'a')?.contentKey).toBe(pickMemorySurprise(views, 'a')?.contentKey);
  });

  it('bỏ qua các mục đã loại trừ', () => {
    const views = [viewWith({ contentKey: 'vocabulary-1', memoryScore: 70 })];
    expect(pickMemorySurprise(views, 'x', ['vocabulary-1'])).toBeNull();
  });
});

describe('toMemoryView & calculateMemoryHealth', () => {
  it('kiến thức chưa học tới có trạng thái Mới và không tính vào sức khoẻ', () => {
    const fresh = toMemoryView('kanji-5', 'kanji', null, NOW);
    expect(fresh.status).toBe('new');
    expect(fresh.isLearned).toBe(false);
    expect(calculateMemoryHealth([fresh])).toBe(0);
  });

  it('sức khoẻ = điểm trung bình của các mục đã học', () => {
    const views = [viewWith({ contentKey: 'kanji-1', memoryScore: 80 }), viewWith({ contentKey: 'kanji-2', memoryScore: 60 })];
    expect(calculateMemoryHealth(views)).toBe(70);
  });
});
