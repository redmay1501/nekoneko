import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { buildGrammarExercises, buildGrammarQuestionBank, exercisesFor, withVocabularyScope } from './grammar-exercises';
import { laterLessonWords } from './vocabulary-scope';
import { selectNewGrammarRound } from '@/components/learning/grammar-exercise-runner-state';
import { buildDayStudy, nearest } from './day-study';
import { buildGrammarQuiz, buildVocabQuiz } from './day-study-quiz';

const catalog = buildKnowledgeCatalog(loadSeedContent());

describe('phạm vi từ vựng của câu hỏi (không dùng từ bài sau)', () => {
  it('nhận ra từ của bài sau, bỏ qua chữ Hán nằm trong tên riêng (山田, 田中, 東京)', () => {
    expect(laterLessonWords(['兄は 銀行員です。'], 1, catalog).map((word) => word.word)).toEqual(['兄']);
    expect(laterLessonWords(['山田さんは 先生です。', '田中さんは 東京の 学生です。'], 1, catalog)).toEqual([]);
    expect(laterLessonWords(['あの 方は 先生ですか。'], 1, catalog)).toEqual([]); // あの方 là từ Bài 1
    expect(laterLessonWords(['ここは 駅じゃ ありません。'], 5, catalog)).toEqual([]);
  });

  it('lượt luyện ngữ pháp Bài 1 (10–20 câu) chỉ gồm câu dùng từ Bài 1 trở về trước; câu còn lại có chú thích', () => {
    const lesson1 = withVocabularyScope(exercisesFor(buildGrammarQuestionBank(catalog.content.grammar), { lesson: 1 }), catalog);
    expect(lesson1.slice(0, 20).every((exercise) => !exercise.laterWords)).toBe(true);
    // Lượt mới (kể cả khi đã có lịch sử câu đã gặp) vẫn ưu tiên câu trong phạm vi.
    expect(selectNewGrammarRound(lesson1, [], [], 20, 'x').every((exercise) => !exercise.laterWords)).toBe(true);
    for (const exercise of lesson1.filter((entry) => entry.laterWords)) {
      expect(exercise.laterWords!.every((word) => word.lesson > 1 && word.reading && word.meaning)).toBe(true);
    }
  });

  it('câu nhiễu của bài tập ngữ pháp chỉ lấy từ cùng bài / bài trước', () => {
    const exercises = buildGrammarExercises(catalog.content.grammar);
    const lessonOfSentence = new Map(catalog.content.grammar.flatMap((pattern) => [pattern.exampleJp, pattern.example2Jp, pattern.exampleVi, pattern.example2Vi]
      .filter(Boolean).map((text) => [text, Number(/\d+/.exec(pattern.lesson)?.[0])] as const)));
    for (const exercise of exercises.filter((entry) => entry.kind === 'nhat-viet' || entry.kind === 'viet-nhat')) {
      for (const option of exercise.options) expect(lessonOfSentence.get(option.text) ?? 0).toBeLessThanOrEqual(exercise.lesson);
    }
  });
});

describe('quiz theo ngày ở Lộ trình: nhiễu chỉ từ ngày trước', () => {
  it('nearest() không bao giờ lấy mục của ngày sau', () => {
    const items = [{ day: 10 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 18 }];
    expect(nearest(items, 14, 10).map((item) => item.day)).toEqual([13, 10]);
  });

  it('ngày 14 (Bài 1): mọi phương án của quiz từ vựng và ngữ pháp thuộc ngày ≤ 14', () => {
    const journey = { currentDay: 14, completedDays: [] } as unknown as Parameters<typeof buildDayStudy>[2];
    const data = buildDayStudy(catalog, 14, journey, new Map());
    const dayOfMeaning = new Map(catalog.content.vocabulary.map((word) => [word.meaning, word.day ?? 0]));
    for (const question of buildVocabQuiz(data, 'nghia', data.vocab, () => 0.3)) {
      for (const option of question.options) expect(dayOfMeaning.get(option) ?? 0).toBeLessThanOrEqual(14);
    }
    const dayOfSentence = new Map(catalog.content.grammar.flatMap((pattern) => [pattern.exampleJp, pattern.example2Jp].map((jp) => [jp, pattern.day ?? 0] as const)));
    for (const question of buildGrammarQuiz(data, 'viet-nhat', data.grammar, () => 0.3)) {
      for (const option of question.options) expect(dayOfSentence.get(option) ?? 0).toBeLessThanOrEqual(14);
    }
  });
});

describe('cách đọc của câu luyện ngữ pháp (hiện sau khi chấm)', () => {
  it('câu hỏi trong ngân hàng dùng lại câu ví dụ thì có cách đọc; lựa chọn Việt → Nhật có cách đọc', () => {
    const bank = buildGrammarQuestionBank(catalog.content.grammar);
    expect(bank.filter((exercise) => exercise.sentence.reading).length).toBeGreaterThan(0);
    const generated = buildGrammarExercises(catalog.content.grammar).filter((exercise) => exercise.kind === 'viet-nhat');
    expect(generated.some((exercise) => exercise.optionReadings && Object.keys(exercise.optionReadings).length >= 2)).toBe(true);
  });
});
