import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildGrammarDrills, drillsOfLesson } from './grammar-drills';
import { checkBlank, checkItem } from '@/lib/utils/drill-checker';

const { grammar } = loadSeedContent();
const drills = buildGrammarDrills(grammar);

describe('bài tập luyện tập ngữ pháp (NekoNeko v2)', () => {
  it('200 bài, mỗi bài Minna 1–25 có đủ 8 bài (2 bài × 4 dạng)', () => {
    expect(drills).toHaveLength(200);
    for (let lesson = 1; lesson <= 25; lesson++) {
      const mine = drillsOfLesson(drills, lesson);
      expect(mine).toHaveLength(8);
      for (const type of ['substitution', 'transformation', 'qa', 'dialogue']) expect(mine.filter((drill) => drill.type === type)).toHaveLength(2);
    }
  });

  it('mọi đáp án mẫu tự chấm là đúng (kể cả gõ toàn kana)', () => {
    for (const drill of drills) {
      if (drill.type === 'dialogue') {
        for (const blank of drill.blanks) expect(checkBlank(blank.answer_index, blank)).toBe(true);
        continue;
      }
      for (const item of drill.items) {
        item.answers.forEach((answer, index) => {
          expect(checkItem(answer, item).correct).toBe(true);
          expect(checkItem(item.readings[index], item).correct).toBe(true);
        });
      }
    }
  });

  it('dữ liệu hỏng thì báo lỗi rõ ràng', () => {
    expect(() => buildGrammarDrills(grammar, { exercises: [{ ...drills[0], grammarIds: [9999] }] })).toThrow(/9999/);
  });
});
