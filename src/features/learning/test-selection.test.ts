import { describe, expect, it } from 'vitest';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { buildLearningSession } from './session-engine';
import { ALL_QUESTIONS, pickTestKeys, questionCountFor } from './test-selection';
import { questionProgress } from './session-types';
import { MAX_FOCUS_ITEMS } from './session-modes';
import { loadSeedContent } from '@/lib/data/seed-content';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const kanjiKeys = catalog.items.filter((item) => item.type === 'kanji').map((item) => item.key);

describe('số câu kiểm tra = số đã chọn', () => {
  it.each([5, 10, 20])('chọn %i câu → lấy đúng %i mục khác nhau', (count) => {
    const picked = pickTestKeys(kanjiKeys, questionCountFor(count, kanjiKeys.length));
    expect(picked).toHaveLength(count);
    expect(new Set(picked).size).toBe(count);
  });

  it('phạm vi ít hơn số yêu cầu → lấy hết những gì có (giao diện báo rõ), "tất cả" tối đa MAX_FOCUS_ITEMS', () => {
    expect(questionCountFor(20, 12)).toBe(12);
    expect(pickTestKeys(kanjiKeys.slice(0, 12), questionCountFor(20, 12))).toHaveLength(12);
    expect(questionCountFor(ALL_QUESTIONS, 500)).toBe(MAX_FOCUS_ITEMS);
    expect(pickTestKeys([], 10)).toEqual([]);
  });

  it.each([5, 10, 20])('phiên kiểm tra %i mục (người mới, có thẻ giới thiệu) vẫn hiện đúng %i câu', (count) => {
    const keys = pickTestKeys(kanjiKeys, count, () => 0.42);
    const session = buildLearningSession({ mode: 'focus', seed: 's', catalog, memoryViews: new Map(), journeyDay: 30, focusKeys: keys });
    // Người mới: mỗi mục = 1 thẻ giới thiệu + 1 câu hỏi → 2× bước nhưng đúng `count` câu.
    expect(session.steps.length).toBe(count * 2);
    expect(questionProgress(session.steps, 0)).toEqual({ total: count, current: 1, isIntro: true });
    const lastIndex = session.steps.length - 1;
    expect(questionProgress(session.steps, lastIndex)).toMatchObject({ total: count, current: count, isIntro: false });
  });
});
