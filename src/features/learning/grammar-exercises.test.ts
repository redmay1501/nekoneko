import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { lessonNumber } from '@/lib/utils/lesson';
import { blankParticle, buildGrammarExercises, exercisesFor, isExerciseCorrect, whyWrong } from './grammar-exercises';

const content = loadSeedContent();
const exercises = buildGrammarExercises(content.grammar);

describe('bài tập ngữ pháp sinh từ dữ liệu thật', () => {
  it('không trùng câu hỏi; mỗi câu gắn đúng mẫu và đúng bài', () => {
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length);
    const byId = new Map(content.grammar.map((grammar) => [grammar.id, grammar]));
    for (const exercise of exercises) {
      const grammar = byId.get(exercise.grammarId)!;
      expect(grammar.pattern).toBe(exercise.pattern);
      expect(lessonNumber(grammar.lesson)).toBe(exercise.lesson);
      expect([grammar.exampleJp, grammar.example2Jp]).toContain(exercise.sentence.jp);
    }
  });

  it('câu trắc nghiệm: đủ 4 lựa chọn khác nhau, đúng MỘT đáp án đúng', () => {
    for (const exercise of exercises.filter((entry) => entry.kind !== 'sap-xep')) {
      const texts = exercise.options.map((option) => option.text);
      expect(new Set(texts).size).toBe(4);
      expect(texts.filter((text) => isExerciseCorrect(exercise, text))).toHaveLength(1);
      for (const text of texts.filter((value) => value !== exercise.answer)) expect(whyWrong(exercise, text)).toBeTruthy();
    }
  });

  it('chọn trợ từ: đúng một chỗ trống, ghép lại đúng câu gốc; trợ từ nằm trong chính mẫu câu', () => {
    const particleItems = exercises.filter((entry) => entry.kind === 'tro-tu');
    expect(particleItems.length).toBeGreaterThan(30);
    for (const exercise of particleItems) {
      expect(exercise.prompt.split('＿＿')).toHaveLength(2);
      expect(exercise.prompt.replace('＿＿', exercise.answer)).toBe(exercise.sentence.jp);
      expect(exercise.pattern.split(/[\s/（）()〜~・、,]+/)).toContain(exercise.answer);
    }
    expect(blankParticle('わたしは グエンです。', 'は')).toBe('わたし＿＿ グエンです。');
    expect(blankParticle('わたしは 先生で、 あなたは 学生です。', 'は')).toBeNull(); // hai chỗ は → mơ hồ, không hỏi
  });

  it('sắp xếp câu: mảnh ghép lại đúng câu; bỏ trống không bao giờ tính đúng', () => {
    for (const exercise of exercises.filter((entry) => entry.kind === 'sap-xep')) {
      expect(exercise.tokens.length).toBeGreaterThanOrEqual(3);
      expect(isExerciseCorrect(exercise, exercise.tokens.join(''))).toBe(true);
    }
    expect(exercises.every((exercise) => !isExerciseCorrect(exercise, null))).toBe(true);
  });

  it('bài nào cũng có bài tập; lọc theo bài / theo mẫu và cùng seed thì cùng thứ tự', () => {
    for (let lesson = 1; lesson <= 25; lesson++) expect(exercisesFor(exercises, { lesson }).length).toBeGreaterThan(5);
    const first = exercisesFor(exercises, { lesson: 3 }).map((exercise) => exercise.id);
    expect(exercisesFor(exercises, { lesson: 3 }).map((exercise) => exercise.id)).toEqual(first);
    expect(exercisesFor(exercises, { grammarId: content.grammar[0].id }).every((exercise) => exercise.grammarId === content.grammar[0].id)).toBe(true);
  });

  it('thống kê số bài mỗi mẫu (in ra để báo cáo)', () => {
    const counts = content.grammar.map((grammar) => exercises.filter((exercise) => exercise.grammarId === grammar.id).length);
    const histogram = counts.reduce<Record<number, number>>((all, count) => ({ ...all, [count]: (all[count] ?? 0) + 1 }), {});
    console.log('grammar-exercises', JSON.stringify({ total: exercises.length, perPattern: histogram,
      byKind: exercises.reduce<Record<string, number>>((all, exercise) => ({ ...all, [exercise.kind]: (all[exercise.kind] ?? 0) + 1 }), {}) }));
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(2);
  });
});
