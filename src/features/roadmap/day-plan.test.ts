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
    expect(plan.knowledge.kana.length).toBe(15);
    expect(plan.relation).toBe('past');
  });

  // Lộ trình NekoNeko v3 (scripts/replan_v3.py): chữ cái 1–10, bộ thủ 11–13, bài 14–81 dựng từ dữ liệu + việc tự làm của bài;
  // tổng ôn 82–90 giữ nguyên. Mỗi ngày đều có việc, tổng 388.
  it('mỗi ngày đều có việc; tổng số đầu việc của 90 ngày khớp dữ liệu', () => {
    const counts = Array.from({ length: 90 }, (_, index) => buildDayPlan(catalog, index + 1, AT_DAY_1).tasks.length);
    expect(counts.every((count) => count > 0)).toBe(true);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(388);
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
  it('ngày 1–3 (46 chữ Hiragana cơ bản) không có việc học từ vựng', () => {
    const vocabularyTasks = content.dayTasks.filter((task) => task.day <= 3 && task.label.includes('Từ vựng'));
    expect(vocabularyTasks).toEqual([]);
  });

  it('mười từ chào hỏi vẫn được học — ở ngày 4–6 (sau khi thuộc đủ Hiragana)', () => {
    const later = content.dayTasks.filter((task) => task.day >= 4 && task.day <= 6 && task.label.includes('Từ vựng')).map((task) => task.body).join(' ');
    for (const greeting of ['おはようございます', 'こんにちは', 'ありがとうございます', 'はじめまして', 'ごめんなさい']) expect(later).toContain(greeting);
  });
});

describe('lộ trình kana theo hàng âm (kana-by-row)', () => {
  const kanaOf = (day: number) => buildDayPlan(catalog, day, AT_DAY_23).knowledge.kana;

  it('Hiragana ngày 1–3: trọn hàng âm 15/15/16; ngày 4 chỉ âm đục & bán đục; ngày 5 âm ghép', () => {
    expect([1, 2, 3, 4, 5].map((day) => kanaOf(day).length)).toEqual([15, 15, 16, 25, 33]);
    expect(kanaOf(2).map((item) => item.face).join('')).toBe('たちつてとなにぬねのはひふへほ');
    expect(kanaOf(4).every((item) => item.face.length === 1)).toBe(true); // không có âm ghép (2 ký tự)
    expect(kanaOf(5).every((item) => item.face.length === 2)).toBe(true);
  });

  it('Katakana ngày 6–10 đi y hệt; ngày 6 là ngày CHỮ MỚI — khớp với việc "Học chữ mới"', () => {
    expect([6, 7, 8, 9, 10].map((day) => kanaOf(day).length)).toEqual([15, 15, 16, 25, 33]);
    const dayEight = buildDayPlan(catalog, 6, AT_DAY_23);
    expect(dayEight.knowledge.kana.every((item) => item.type === 'katakana')).toBe(true);
    expect(dayEight.hasNewKnowledge).toBe(true);
    expect(dayEight.tasks.some((task) => task.name.includes('Học chữ mới'))).toBe(true);
  });
});

describe('lộ trình ngày 11–90 (audit)', () => {
  const plans = Array.from({ length: 80 }, (_, index) => buildDayPlan(catalog, index + 11, AT_DAY_1));

  it('dòng thời gian luôn theo thứ tự Bộ thủ → Từ vựng → Kanji (ngay sau từ) → Ngữ pháp', () => {
    const order = ['部', '語', '漢', '文'];
    for (const plan of plans) {
      const glyphs = plan.tasks.map((task) => task.glyph).filter((glyph) => order.includes(glyph));
      expect(glyphs).toEqual([...glyphs].sort((left, right) => order.indexOf(left) - order.indexOf(right)));
    }
  });

  it('ngày ôn giữa lộ trình gắn với kiến thức thật của các ngày học liền trước', () => {
    // Ngày 22 (ôn bài 1–3) = kiến thức thật của ngày 11–21: bộ thủ 11–13 không có ngày ôn riêng nên được ôn cùng bài 1–3.
    const day26 = plans.find((plan) => plan.day === 22)!;
    expect(day26.reviewWindow).toMatchObject({ from: 11, to: 21 });
    expect(day26.reviewWindow!.counts.map((entry) => entry.type)).toContain('radical');
    const fromWeek = new Set(catalog.items.filter((item) => item.day! >= 11 && item.day! <= 21 && item.type !== 'hiragana' && item.type !== 'katakana').map((item) => item.key));
    expect(new Set(day26.reviewWindow!.keys)).toEqual(fromWeek);
    // "Ôn lại toàn bộ từ vựng Minna bài 1–3" → đúng các từ bài 1–3.
    expect(day26.reviewVocabulary.length).toBeGreaterThan(0);
    for (const plan of plans.filter((entry) => !entry.hasNewKnowledge && entry.day < 82)) expect(plan.reviewWindow?.keys.length).toBeGreaterThan(0);
    // Tổng ôn 83–90: ôn theo chủ đề, không có "tuần" liền trước.
    expect(plans.find((plan) => plan.day === 83)!.reviewWindow).toBeNull();
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

describe('nút học lại của mọi ngày có kiến thức', () => {
  it('ngày 1–81 đều có kiến thức của riêng ngày hoặc của tuần; chỉ tổng ôn / thi thử 82–90 không gắn', () => {
    const plans = Array.from({ length: 90 }, (_, index) => buildDayPlan(catalog, index + 1, AT_DAY_1));
    const withoutOwnKnowledge = plans.filter((plan) => !plan.hasNewKnowledge && !plan.reviewWindow).map((plan) => plan.day);
    expect(withoutOwnKnowledge).toEqual([82, 83, 84, 85, 86, 87, 88, 89, 90]);
    expect(plans[9].knowledge.kana.length).toBeGreaterThan(0);
  });
});
