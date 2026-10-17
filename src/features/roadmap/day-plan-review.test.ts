import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { buildDayPlan } from './day-plan';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const position = { currentDay: 30, completedAt: null } as never;
const plan = (day: number) => buildDayPlan(catalog, day, position);

describe('trang ngày — từ vựng cần ôn, thời gian, việc Từ vựng', () => {
  it('ngày 14: 25 từ được liệt kê đều khớp đúng kho từ', () => {
    const words = plan(14).reviewVocabulary;
    expect(words).toHaveLength(25);
    expect(words.map((word) => word.kana)).toContain('わかりました');
  });

  it('ngày 7: 3 từ; ngày ôn theo khoảng bài: lấy đúng các bài đó', () => {
    expect(plan(7).reviewVocabulary.map((word) => word.kana)).toEqual(['はい', 'いいえ', 'わかりました']);
    // Tổng ôn trợ từ (ngày 83): "Ôn từ vựng Minna bài 1–10".
    const day83 = plan(83).reviewVocabulary;
    expect(day83.length).toBeGreaterThan(100);
    expect(day83.every((word) => /\b([1-9]|10)\b/.test(word.lesson))).toBe(true);
    // Ngày ôn giữa lộ trình (ngày 26): đúng từ của bài 1–3.
    const day26 = plan(26).reviewVocabulary;
    expect(day26.length).toBeGreaterThan(50);
    expect(day26.every((word) => /\b[1-3]\b/.test(word.lesson))).toBe(true);
  });

  it('ghi chung chung ("ôn phần yếu") → không đoán danh sách', () => {
    expect(plan(87).reviewVocabulary).toEqual([]);
  });

  it('ngày có từ mới: việc "Từ vựng" chỉ nói số từ, không lặp danh sách, không "Trong sách…"', () => {
    const day18 = plan(18);
    const task = day18.tasks.find((item) => item.glyph === '語')!;
    expect(task.lines).toHaveLength(1);
    expect(task.lines[0].text).toContain(`Học ${day18.knowledge.vocabulary.length} từ mới`);
    expect(JSON.stringify(day18.tasks)).not.toContain('Trong sách');
  });

  it('thời gian tách trong app / tự làm, cộng lại bằng tổng', () => {
    for (const day of [1, 6, 14, 20, 82]) {
      const view = plan(day);
      expect(view.minutesInApp + view.minutesSelf).toBe(view.tasks.reduce((sum, task) => sum + task.minutes, 0));
    }
    expect(plan(1).tasks.find((task) => task.name.includes('Viết tay'))?.place).toBe('self');
    expect(plan(20).tasks.find((task) => task.name.includes('Kanji'))?.place).toBe('app');
  });
});
