import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { buildDayPlan, buildDayStrip, formatTaskBody } from './day-plan';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const AT_DAY_1 = { currentDay: 1, isJourneyComplete: false };
const AT_DAY_23 = { currentDay: 23, isJourneyComplete: false };

describe('buildDayPlan', () => {
  it('ngày 1 có đầu việc và kiến thức bảng chữ cái', () => {
    const plan = buildDayPlan(catalog, 1, AT_DAY_23);
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.knowledge.kana.length).toBe(10);
    expect(plan.relation).toBe('past');
  });

  // File Excel có 491 đầu việc; bỏ 5 việc học từ ở ngày 1–5 (scripts/roadmap_adjustments.py) → 486.
  it('tổng số đầu việc của 90 ngày = file lộ trình (491) trừ 5 việc học từ ngày 1–5', () => {
    const total = Array.from({ length: 90 }, (_, index) => buildDayPlan(catalog, index + 1, AT_DAY_1).tasks.length)
      .reduce((sum, count) => sum + count, 0);
    expect(total).toBe(486);
  });

  it('ngày ngoài khoảng 1–90 được kéo về trong khoảng', () => {
    expect(buildDayPlan(catalog, 500, AT_DAY_23).day).toBe(90);
    expect(buildDayPlan(catalog, -3, AT_DAY_23).day).toBe(1);
  });

  it('ngày không có kiến thức mới thì gợi ý vài thứ nên gặp lại', () => {
    const reviewDay = Array.from({ length: 90 }, (_, index) => buildDayPlan(catalog, index + 1, AT_DAY_1)).find((plan) => !plan.hasNewKnowledge && plan.day > 15);
    expect(reviewDay?.reviewSuggestions.length).toBeGreaterThan(0);
  });
});

describe('formatTaskBody', () => {
  it('giữ đủ chữ, nhận dạng dòng gạch đầu dòng và dòng phụ', () => {
    expect(formatTaskBody('Học chữ\n• あ (a)\nMẹo: nhìn kỹ\n\n')).toEqual([
      { kind: 'line', text: 'Học chữ' },
      { kind: 'bullet', text: 'あ (a)' },
      { kind: 'sub', text: 'Mẹo: nhìn kỹ' },
    ]);
  });
});

describe('buildDayStrip', () => {
  it('luôn 7 ngày và không vượt biên', () => {
    expect(buildDayStrip(1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(buildDayStrip(90)).toEqual([84, 85, 86, 87, 88, 89, 90]);
    expect(buildDayStrip(23)).toEqual([20, 21, 22, 23, 24, 25, 26]);
  });
});

describe('chưa thuộc bảng chữ cái thì chưa học từ', () => {
  const content = loadSeedContent();
  it('ngày 1–5 (46 chữ Hiragana cơ bản) không có việc học từ vựng', () => {
    const vocabularyTasks = content.dayTasks.filter((task) => task.day <= 5 && task.label.includes('Từ vựng'));
    expect(vocabularyTasks).toEqual([]);
  });

  it('mười từ chào hỏi vẫn được học — ở ngày 8–12', () => {
    const later = content.dayTasks.filter((task) => task.day >= 8 && task.day <= 12 && task.label.includes('Từ vựng')).map((task) => task.body).join(' ');
    for (const greeting of ['おはようございます', 'こんにちは', 'ありがとうございます', 'はじめまして', 'ごめんなさい']) expect(later).toContain(greeting);
  });
});
