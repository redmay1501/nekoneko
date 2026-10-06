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

  // File Excel có 491 đầu việc; bỏ 5 việc học từ ở ngày 1–5 và 2 bài đọc nhanh ở ngày 7/14 (scripts/roadmap_adjustments.py) → 484.
  it('tổng số đầu việc của 90 ngày = file lộ trình (491) trừ các điều chỉnh đã ghi', () => {
    const total = Array.from({ length: 90 }, (_, index) => buildDayPlan(catalog, index + 1, AT_DAY_1).tasks.length)
      .reduce((sum, count) => sum + count, 0);
    expect(total).toBe(484);
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

describe('lộ trình kana theo hàng âm (kana-by-row)', () => {
  const kanaOf = (day: number) => buildDayPlan(catalog, day, AT_DAY_23).knowledge.kana;

  it('Hiragana ngày 1–5: trọn hàng âm 10/10/10/8/8; ngày 6 chỉ âm đục & bán đục; ngày 7 âm ghép', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((day) => kanaOf(day).length)).toEqual([10, 10, 10, 8, 8, 25, 33]);
    expect(kanaOf(2).map((item) => item.face).join('')).toBe('さしすせそたちつてと');
    expect(kanaOf(6).every((item) => item.face.length === 1)).toBe(true); // không có âm ghép (2 ký tự)
    expect(kanaOf(7).every((item) => item.face.length === 2)).toBe(true);
  });

  it('Katakana ngày 8–14 đi y hệt; ngày 8 là ngày CHỮ MỚI — khớp với việc "Học chữ mới"', () => {
    expect([8, 9, 10, 11, 12, 13, 14].map((day) => kanaOf(day).length)).toEqual([10, 10, 10, 8, 8, 25, 33]);
    const dayEight = buildDayPlan(catalog, 8, AT_DAY_23);
    expect(dayEight.knowledge.kana.every((item) => item.type === 'katakana')).toBe(true);
    expect(dayEight.hasNewKnowledge).toBe(true);
    expect(dayEight.tasks.some((task) => task.name.includes('Học chữ mới'))).toBe(true);
  });
});
