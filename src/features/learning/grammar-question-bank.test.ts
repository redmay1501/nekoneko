import { describe, expect, it } from 'vitest';
import rawQuestionBank from '@content/seed/grammar-question-bank.json';
import { lessonNumber } from '@/lib/utils/lesson';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildGrammarQuestionBank, exercisesFor, isExerciseCorrect } from './grammar-exercises';

const content = loadSeedContent();
const rows = rawQuestionBank as unknown[];
const bank = buildGrammarQuestionBank(content.grammar, rows);

describe('ngân hàng câu hỏi ngữ pháp', () => {
  it('có đúng 10 câu cho từng mẫu trong tổng số 112 mẫu', () => {
    expect(bank).toHaveLength(1120);
    for (const grammar of content.grammar) {
      expect(bank.filter((exercise) => exercise.grammarId === grammar.id)).toHaveLength(10);
    }
  });

  it('không trùng ID; mỗi câu có 4 lựa chọn khác nhau và đáp án đúng nằm trong lựa chọn', () => {
    expect(new Set(bank.map((exercise) => exercise.id)).size).toBe(1120);
    for (const exercise of bank) {
      expect(exercise.options).toHaveLength(4);
      expect(new Set(exercise.options.map((option) => option.text)).size).toBe(4);
      expect(exercise.options.filter((option) => isExerciseCorrect(exercise, option.text))).toHaveLength(1);
    }
  });

  it('chỉ ánh xạ ba dạng được hỗ trợ, gộp hai nhãn điền thành một dạng', () => {
    expect(new Set(bank.map((exercise) => exercise.kind))).toEqual(new Set(['nhat-viet', 'viet-nhat', 'dien-tu']));
    expect(bank.filter((exercise) => exercise.kind === 'dien-tu')).toHaveLength(447);
    expect((rawQuestionBank as Array<{ reviewStatus: string }>).every((row) => row.reviewStatus === 'Cần rà soát ngôn ngữ và đáp án')).toBe(true);
  });

  it('lọc đúng theo bài Minna và mẫu ngữ pháp', () => {
    const first = content.grammar[0];
    const lesson = lessonNumber(first.lesson);
    const byLesson = exercisesFor(bank, { lesson });
    const byPattern = exercisesFor(bank, { grammarId: first.id });
    expect(byLesson.length).toBeGreaterThan(10);
    expect(byLesson.every((exercise) => exercise.lesson === lesson)).toBe(true);
    expect(byPattern).toHaveLength(10);
    expect(byPattern.every((exercise) => exercise.grammarId === first.id)).toBe(true);
  });

  it('xáo trộn câu và lựa chọn tất định mà không làm mất liên kết đáp án', () => {
    const first = exercisesFor(bank, { grammarId: 1 }, 'seed-a');
    expect(exercisesFor(bank, { grammarId: 1 }, 'seed-a')).toEqual(first);
    expect(exercisesFor(bank, { grammarId: 1 }, 'seed-b')).not.toEqual(first);
    for (const exercise of first) {
      expect(exercise.options.some((option) => option.text === exercise.answer)).toBe(true);
      expect(exercise.options.filter((option) => isExerciseCorrect(exercise, option.text))).toHaveLength(1);
    }
  });

  it('dừng nếu thiếu dòng hoặc có đáp án sai, không bỏ qua câu lỗi', () => {
    expect(() => buildGrammarQuestionBank(content.grammar, rows.slice(0, -1))).toThrow(/1119/);
    const corrupted = rows.map((row) => row);
    const first = { ...(corrupted[0] as Record<string, unknown>), answer: 'Không có trong lựa chọn' };
    corrupted[0] = first;
    expect(() => buildGrammarQuestionBank(content.grammar, corrupted)).toThrow(/đáp án đúng không nằm trong 4 lựa chọn/);
  });
});
