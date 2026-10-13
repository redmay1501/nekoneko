import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { buildDayPlan, formatTaskBody } from './day-plan';

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

describe('lộ trình ngày 15–90 (audit)', () => {
  const plans = Array.from({ length: 76 }, (_, index) => buildDayPlan(catalog, index + 15, AT_DAY_1));

  it('dòng thời gian luôn theo thứ tự Từ vựng → Ngữ pháp → Bộ thủ → Kanji', () => {
    const order = ['語', '文', '部', '漢'];
    for (const plan of plans) {
      const glyphs = plan.tasks.map((task) => task.glyph).filter((glyph) => order.includes(glyph));
      expect(glyphs).toEqual([...glyphs].sort((left, right) => order.indexOf(left) - order.indexOf(right)));
    }
  });

  it('ngày ôn giữa lộ trình gắn với kiến thức thật của các ngày học liền trước', () => {
    const day21 = plans.find((plan) => plan.day === 21)!;
    expect(day21.reviewWindow).toMatchObject({ from: 15, to: 20 });
    const fromWeek = new Set(catalog.items.filter((item) => item.day! >= 15 && item.day! <= 20 && item.type !== 'hiragana' && item.type !== 'katakana').map((item) => item.key));
    expect(new Set(day21.reviewWindow!.keys)).toEqual(fromWeek);
    // "Kiểm tra lại toàn bộ từ vựng Minna bài 1–3" → đúng các từ bài 1–3.
    expect(day21.reviewVocabulary.length).toBeGreaterThan(0);
    for (const plan of plans.filter((entry) => !entry.hasNewKnowledge && entry.day < 78)) expect(plan.reviewWindow?.keys.length).toBeGreaterThan(0);
    // Tổng ôn 78–90: không có "tuần" liền trước → giữ cách ôn chung.
    expect(plans.find((plan) => plan.day === 79)!.reviewWindow).toBeNull();
  });

  it('việc trong app không chỉ ra sách: phần làm trong app đứng trước, sách là tuỳ chọn', () => {
    for (const plan of plans) {
      for (const task of plan.tasks.filter((entry) => entry.place === 'app')) {
        const book = task.lines.filter((line) => /練習|trong sách|問題集/.test(line.text));
        for (const line of book) expect(line.text.startsWith('Có sách Minna (tuỳ chọn)')).toBe(true);
        if (task.glyph === '文' && book.length) expect(task.lines[0].text).toMatch(/app/);
      }
    }
  });

  it('bộ thủ và Kanji là hai phần riêng, đúng ngày của dữ liệu', () => {
    for (const plan of plans) {
      expect(plan.knowledge.radicals.every((radical) => radical.day === plan.day)).toBe(true);
      expect(plan.knowledge.kanji.every((kanji) => kanji.day === plan.day)).toBe(true);
    }
  });
});
