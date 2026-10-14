import { describe, expect, it } from 'vitest';
import { loadSeedContent } from './seed-content';
import { READING_PASSAGES } from './reading-passages';
import { lessonNumber } from '@/lib/utils/lesson';

const content = loadSeedContent();
const HAN = /[一-鿿々]/gu;

describe('bài đọc hiểu (Neko soạn)', () => {
  it('một bài cho mỗi bài Minna 1–25, id không trùng, theo thứ tự ngày', () => {
    expect(READING_PASSAGES.map((passage) => lessonNumber(passage.lesson))).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(new Set(READING_PASSAGES.map((passage) => passage.id)).size).toBe(READING_PASSAGES.length);
    const days = READING_PASSAGES.map((passage) => passage.day);
    expect(days).toEqual([...days].sort((left, right) => left - right));
  });

  it('chỉ dùng chữ Hán đã học tới ngày của bài', () => {
    for (const passage of READING_PASSAGES) {
      const learned = new Set(content.kanji.filter((kanji) => kanji.day !== null && kanji.day <= passage.day).map((kanji) => kanji.character));
      const unknown = [...new Set(passage.textJp.match(HAN) ?? [])].filter((character) => !learned.has(character));
      expect({ lesson: passage.lesson, unknown }).toEqual({ lesson: passage.lesson, unknown: [] });
    }
  });

  it('bài nằm sau khi đã học hết từ và mẫu câu của bài Minna đó', () => {
    for (const passage of READING_PASSAGES) {
      const lesson = lessonNumber(passage.lesson);
      const lessonDays = [...content.vocabulary, ...content.grammar]
        .filter((item) => lessonNumber(item.lesson) === lesson && item.day !== null).map((item) => item.day!);
      expect(passage.day).toBeGreaterThanOrEqual(Math.max(...lessonDays));
    }
  });

  it('mỗi bài có tiêu đề, bản dịch và 3–4 câu hỏi hợp lệ (4 lựa chọn khác nhau, đáp án nằm trong lựa chọn)', () => {
    for (const passage of READING_PASSAGES) {
      expect(passage.title.length).toBeGreaterThan(0);
      expect(passage.textVi.length).toBeGreaterThan(0);
      expect(passage.questions.length).toBeGreaterThanOrEqual(3);
      expect(passage.questions.length).toBeLessThanOrEqual(4);
      for (const question of passage.questions) {
        expect(new Set(question.options).size).toBe(4);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
      }
    }
  });
});
