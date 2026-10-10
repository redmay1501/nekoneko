import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import content from '@content/seed/n5-content.json';
import {
  type StrokeEnds, checkWriting, describeWritingCheck, hasStrokeOrder, strokeCountOf, strokeOrderCharacters,
  strokeOrderUrl, strokeStartOf,
} from './stroke-order';

describe('dữ liệu thứ tự nét (KanjiVG)', () => {
  it('có đủ mọi chữ kana và 103 Kanji N5', () => {
    const characters = [...new Set(content.kana.flatMap((kana) => [...kana.hiragana, ...kana.katakana]))];
    expect(characters.filter((character) => !hasStrokeOrder(character))).toEqual([]);
    expect(content.kanji.filter((kanji) => !hasStrokeOrder(kanji.character)).map((kanji) => kanji.character)).toEqual([]);
  });

  it('số nét Kanji khớp dữ liệu bài học', () => {
    expect(content.kanji.filter((kanji) => strokeCountOf(kanji.character) !== kanji.strokes).map((kanji) => kanji.character)).toEqual([]);
  });

  it('số nét kana theo cách dạy chuẩn', () => {
    expect(['そ', 'ソ', 'ン', 'シ', 'ツ', 'ヨ', 'き', 'ふ'].map(strokeCountOf)).toEqual([1, 2, 2, 3, 3, 3, 4, 4]);
  });

  it('file hình nét tồn tại và khớp mục lục', () => {
    for (const character of ['そ', 'ソ', '日', 'ゃ']) {
      const data = JSON.parse(readFileSync(`public${strokeOrderUrl(character)}`, 'utf8'));
      expect(data.c).toBe(character);
      expect(data.strokes).toHaveLength(strokeCountOf(character)!);
      expect(data.labels).toHaveLength(data.strokes.length);
    }
  });

  it('chữ không có dữ liệu thì nói không có (không đoán)', () => {
    expect(hasStrokeOrder('〜')).toBe(false);
    expect(strokeCountOf('A')).toBeUndefined();
    expect(strokeOrderCharacters('きゃ')).toEqual(['き', 'ゃ']);
  });

  it('đọc điểm đầu của nét', () => {
    expect(strokeStartOf('M38.4,22c1.88,1.25')).toEqual([38.4, 22]);
  });
});

describe('chấm bài viết cơ bản', () => {
  // Chữ hai nét giả định: nét 1 ngang (trái → phải), nét 2 dọc (trên → dưới).
  const reference: StrokeEnds[] = [{ start: [20, 30], end: [90, 30] }, { start: [55, 10], end: [55, 100] }];

  it('đúng thứ tự, đúng chiều → đúng', () => {
    const check = checkWriting([[[22, 32], [60, 31], [88, 29]], [[54, 12], [56, 98]]], reference);
    expect(check.isCorrect).toBe(true);
    expect(describeWritingCheck(check)).toContain('Đúng cả 2 nét');
  });

  it('viết ngược chiều', () => {
    const check = checkWriting([[[88, 30], [21, 31]], [[55, 11], [55, 99]]], reference);
    expect(check.verdicts).toEqual(['reversed', 'ok']);
    expect(describeWritingCheck(check)).toContain('Nét 1 đang viết ngược chiều');
  });

  it('sai thứ tự → nét đầu sai chỗ', () => {
    const check = checkWriting([[[55, 10], [55, 100]], [[20, 30], [90, 30]]], reference);
    expect(check.verdicts).toEqual(['wrong-place', 'wrong-place']);
    expect(describeWritingCheck(check)).toContain('Nét 1 chưa đúng chỗ');
  });

  it('thiếu nét / thừa nét / chưa viết', () => {
    expect(describeWritingCheck(checkWriting([[[20, 30], [90, 30]]], reference))).toContain('còn thiếu 1 nét');
    expect(describeWritingCheck(checkWriting([[[20, 30], [90, 30]], [[55, 10], [55, 100]], [[1, 1], [2, 2]]], reference)))
      .toContain('chỉ có 2 nét');
    expect(describeWritingCheck(checkWriting([], reference))).toBe('Viết chữ vào khung trước nhé.');
  });
});
