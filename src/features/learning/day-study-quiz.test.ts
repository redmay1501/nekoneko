import { describe, expect, it } from 'vitest';
import type { DayStudyData } from './day-study';
import { buildGrammarQuiz, buildKanjiQuiz, buildVocabQuiz, orderTokens, pickOptions } from './day-study-quiz';

const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const data = {
  day: 20, title: '', radicals: [], learned: { vocab: 0, grammar: 0, kanji: 0 }, weakestKeys: [],
  vocab: [
    { key: 'vocabulary-1', face: '私', kana: 'わたし', kanji: '私', romaji: 'watashi', meaning: 'Tôi', tip: '', example: null },
    { key: 'vocabulary-2', face: 'あなた', kana: 'あなた', kanji: '', romaji: 'anata', meaning: 'Bạn', tip: '', example: null },
  ],
  grammar: [{ key: 'grammar-1', pattern: 'N1 は N2 です', romaji: '', meaning: '', whenToUse: '', commonMistake: '',
    examples: [{ jp: 'わたしは グエンです。', reading: '', romaji: '', vi: 'Tôi là Nguyễn.' }] }],
  kanji: [{ key: 'kanji-1', character: '一', hanViet: 'NHẤT', meaning: 'Một', onReading: 'イチ', kunReading: 'ひと(つ)', readingRomaji: '',
    readings: ['イチ', 'ひと(つ)'], strokes: 1, words: [{ word: '一人', reading: 'ひとり', meaning: 'một người' }], relatedVocab: [], tip: '' }],
  distractors: {
    vocab: [{ face: '人', kana: 'ひと', meaning: 'Người' }, { face: '本', kana: 'ほん', meaning: 'Sách' }, { face: '水', kana: 'みず', meaning: 'Tôi' }],
    kanji: [{ character: '二', meaning: 'Hai', readings: ['ニ', 'いち'], words: [{ word: '二人', reading: 'ふたり', meaning: '' }] },
      { character: '三', meaning: 'Ba', readings: ['サン'], words: [] }, { character: '日', meaning: 'Ngày', readings: ['ニチ'], words: [] }],
    grammar: [{ jp: 'これは ほんです。', vi: 'Đây là sách.' }, { jp: 'あれは なんですか。', vi: 'Kia là gì?' }],
  },
} as unknown as DayStudyData;

describe('day study quizzes', () => {
  it('never offers a wrong option equal to the answer', () => {
    const options = pickOptions('Tôi', ['Tôi', 'Bạn', 'Người', 'Sách', 'Bạn'], seeded());
    expect(options).toHaveLength(4);
    expect(options.filter((option) => option === 'Tôi')).toHaveLength(1);
    expect(new Set(options).size).toBe(4);
  });

  it('builds each vocabulary quiz with the correct answer among the options', () => {
    for (const question of buildVocabQuiz(data, 'nghia', data.vocab, seeded())) expect(question.options).toContain(question.answer);
    const faces = buildVocabQuiz(data, 'tu', data.vocab, seeded());
    expect(faces.every((question) => question.options.includes(question.answer) && question.ask === 'face')).toBe(true);
    expect(faces.find((question) => question.answer === '私')?.optionLabels?.['私']).toBe('私（わたし）');
    const typing = buildVocabQuiz(data, 'go', data.vocab, seeded());
    expect(typing.every((question) => question.options.length === 0 && question.accepted?.includes(question.answer))).toBe(true);
  });

  it('keeps kanji reading distractors that read the same out of the options', () => {
    for (let seed = 1; seed < 20; seed += 1) {
      const [question] = buildKanjiQuiz(data, 'doc', data.kanji, seeded(seed));
      expect(question.options).not.toContain('いち');
      expect(question.options).toContain(question.answer);
    }
    const [word] = buildKanjiQuiz(data, 'tu-ghep', data.kanji, seeded());
    expect(word).toMatchObject({ prompt: '一人', wordPrompt: '一人', answer: 'ひとり', ask: 'word-reading' });
  });

  it('builds two-way grammar questions from the examples', () => {
    const [toJp] = buildGrammarQuiz(data, 'viet-nhat', data.grammar, seeded());
    expect(toJp).toMatchObject({ ask: 'vi-to-jp', prompt: 'Tôi là Nguyễn.', answer: 'わたしは グエンです。' });
    const [toVi] = buildGrammarQuiz(data, 'nhat-viet', data.grammar, seeded());
    expect(toVi.options).toContain('Tôi là Nguyễn.');
  });

  it('splits example sentences into reorderable pieces', () => {
    expect(orderTokens('わたしは グエンです。')).toEqual(['わたし', 'は', 'グエン', 'です']);
    expect(orderTokens('ミラーさんは アメリカ人ですか。')).toEqual(['ミラーさん', 'は', 'アメリカ人', 'です', 'か']);
    expect(orderTokens('あれは なんですか。')).toEqual(['あれ', 'は', 'なん', 'です', 'か']);
  });
});
