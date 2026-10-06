import { describe, expect, it } from 'vitest';
import { compareJapanese, normalizeJapanese } from './japanese-text';

describe('normalizeJapanese / compareJapanese', () => {
  it('bỏ dấu câu, khoảng trắng; chuẩn hoá toàn/nửa chiều rộng', () => {
    expect(normalizeJapanese('わたしは　がくせいです。')).toBe('わたしはがくせいです');
    expect(normalizeJapanese('ｶﾒﾗ')).toBe('カメラ');
    expect(normalizeJapanese('コーヒー。')).toBe('コーヒー'); // dấu kéo dài là một phần của từ
  });

  it('chấp nhận nhiều đáp án và Katakana ↔ Hiragana khi hỏi cách đọc', () => {
    expect(compareJapanese('学生', ['学生', 'がくせい']).isCorrect).toBe(true);
    expect(compareJapanese('ガクセイ', ['がくせい'], { foldKatakana: true }).isCorrect).toBe(true);
    expect(compareJapanese('ガクセイ', ['がくせい']).isCorrect).toBe(false);
  });

  it('câu gần đúng: chỉ ra ký tự sai và cho điểm', () => {
    const result = compareJapanese('わたしはがくせいてす', ['わたしは がくせいです。']);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.diff.filter((cell) => !cell.isMatch).map((cell) => cell.character)).toEqual(['で']);
  });

  it('dấu câu khác vẫn đúng, đánh dấu là "đúng nới lỏng"', () => {
    const result = compareJapanese('わたしはがくせいです', ['わたしは がくせいです。']);
    expect(result).toMatchObject({ isCorrect: true, isLenient: true, score: 100 });
  });
});
