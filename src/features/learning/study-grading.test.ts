import { describe, expect, it } from 'vitest';
import { gradeStudyAnswer, kanjiReadingList, parseKanjiWords } from './study-grading';
import type { KnowledgeItem } from './knowledge-types';

const kanji = {
  key: 'kanji-1', id: 1, type: 'kanji', face: '一', reading: 'ひと(つ)', meaning: 'Một', day: 20,
  content: { id: 1, character: '一', hanViet: 'NHẤT', meaning: 'Một', onReading: 'イチ・イツ', kunReading: 'ひと(つ)', strokes: 1,
    words: '一つ (ひとつ) một cái ・ 一人 (ひとり) một người', tip: '', day: 20 },
} as KnowledgeItem;
const word = {
  key: 'vocabulary-1', id: 1, type: 'vocabulary', face: '私', reading: 'わたし', meaning: 'Tôi', day: 15,
  content: { id: 1, kana: 'わたし', kanji: '私', meaning: 'Tôi', tip: '', lesson: 'BÀI 1', day: 15 },
} as KnowledgeItem;
const grammar = {
  key: 'grammar-1', id: 1, type: 'grammar', face: 'N1 は N2 です', reading: 'わたしは グエンです。', meaning: 'N1 là N2', day: 15,
  content: { id: 1, pattern: 'N1 は N2 です', usage: '', exampleJp: 'わたしは グエンです。', exampleVi: 'Tôi là Nguyễn.', lesson: '', day: 15,
    exampleReading: '', whenToUse: '', commonMistake: '', example2Jp: 'これは ほんです。', example2Reading: '', example2Vi: 'Đây là quyển sách.' },
} as KnowledgeItem;

describe('study grading', () => {
  it('parses compound words and readings of a kanji', () => {
    expect(parseKanjiWords(kanji.type === 'kanji' ? kanji.content.words : '')).toEqual([
      { word: '一つ', reading: 'ひとつ', meaning: 'một cái' },
      { word: '一人', reading: 'ひとり', meaning: 'một người' },
    ]);
    expect(kanji.type === 'kanji' && kanjiReadingList(kanji.content)).toEqual(['イチ', 'イツ', 'ひと(つ)']);
  });

  it('grades vocabulary both ways and typed kana', () => {
    expect(gradeStudyAnswer(word, 'meaning', 'Tôi')).toBe(true);
    expect(gradeStudyAnswer(word, 'face', '私')).toBe(true);
    expect(gradeStudyAnswer(word, 'reading', 'ワタシ')).toBe(true);
    expect(gradeStudyAnswer(word, 'reading', 'あなた')).toBe(false);
    expect(gradeStudyAnswer(word, 'vi-to-jp', 'x')).toBeNull();
  });

  it('grades kanji readings in either script and compound-word readings', () => {
    expect(gradeStudyAnswer(kanji, 'reading', 'いち')).toBe(true);
    expect(gradeStudyAnswer(kanji, 'reading', 'ひと(つ)')).toBe(true);
    expect(gradeStudyAnswer(kanji, 'reading', 'ニ')).toBe(false);
    expect(gradeStudyAnswer(kanji, 'word-reading', 'ひとり', '一人')).toBe(true);
    expect(gradeStudyAnswer(kanji, 'word-reading', 'ひとつ', '一人')).toBe(false);
    expect(gradeStudyAnswer(kanji, 'word-reading', 'ひとり', '二人')).toBeNull();
  });

  it('grades grammar sentences both ways against either example', () => {
    expect(gradeStudyAnswer(grammar, 'vi-to-jp', 'これは ほんです。')).toBe(true);
    expect(gradeStudyAnswer(grammar, 'jp-to-vi', 'Tôi là Nguyễn.')).toBe(true);
    expect(gradeStudyAnswer(grammar, 'jp-to-vi', 'Đây là cái bút.')).toBe(false);
  });
});

describe('radical grading', () => {
  const radical = { key: 'radical-1', id: 1, type: 'radical', face: '亻', reading: '', meaning: 'Người', day: 15,
    content: { id: 1, radical: '人 / 亻', nameJp: 'ひと', meaning: 'Người', kanjiList: '', tip: '', day: 15 } } as KnowledgeItem;
  it('chỉ chấm nghĩa của bộ thủ', () => {
    expect(gradeStudyAnswer(radical, 'meaning', 'Người')).toBe(true);
    expect(gradeStudyAnswer(radical, 'reading', 'ひと')).toBeNull();
  });
});

describe('kana grading', () => {
  const kana = { key: 'hiragana-1', id: 1, type: 'hiragana', face: 'あ', reading: 'a', meaning: 'Chữ Hiragana', day: 1,
    content: { id: 1, hiragana: 'あ', katakana: 'ア', romaji: 'a', day: 1 } } as unknown as KnowledgeItem;
  it('chữ → romaji và romaji → chữ', () => {
    expect(gradeStudyAnswer(kana, 'reading', 'A')).toBe(true);
    expect(gradeStudyAnswer(kana, 'face', 'あ')).toBe(true);
    expect(gradeStudyAnswer(kana, 'face', 'お')).toBe(false);
    expect(gradeStudyAnswer(kana, 'meaning', 'a')).toBeNull();
  });
});
