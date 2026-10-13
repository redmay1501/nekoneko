import type { KnowledgeItem } from './knowledge-types';
import { compareJapanese, normalizeJapanese } from '@/lib/utils/japanese-text';

/**
 * Câu hỏi của luồng học theo ngày (/lo-trinh/ngay/[day]/hoc). Dùng chung cho trình duyệt (dựng câu hỏi)
 * và server (CHẤM — không tin đúng/sai từ trình duyệt).
 * - meaning: hiện chữ/từ → chọn nghĩa · face: hiện nghĩa → chọn chữ/từ · reading: chọn / gõ cách đọc
 * - word-reading: từ ghép chứa Kanji → cách đọc (prompt = từ ghép)
 * - vi-to-jp / jp-to-vi: câu ví dụ ngữ pháp hai chiều
 */
export const STUDY_ASKS = ['meaning', 'face', 'reading', 'word-reading', 'vi-to-jp', 'jp-to-vi'] as const;
export type StudyAsk = (typeof STUDY_ASKS)[number];

/** Loại kiến thức có quiz trong luồng học theo ngày. */
export const STUDY_TYPES = ['vocabulary', 'grammar', 'radical', 'kanji'] as const;

export interface KanjiWord {
  word: string;
  reading: string;
  meaning: string;
}

/** "日本 (にほん) Nhật Bản ・ 今日 (きょう) hôm nay" → [{ word: 日本, reading: にほん, meaning: Nhật Bản }, …]. */
export function parseKanjiWords(words: string): KanjiWord[] {
  return words.split('・').flatMap((part) => {
    const match = /^\s*(\S+)\s*[(（]([^)）]+)[)）]\s*(.*)$/.exec(part);
    return match ? [{ word: match[1], reading: match[2].trim(), meaning: match[3].trim() }] : [];
  });
}

/** Từng cách đọc của một Kanji (On rồi Kun), giữ dạng hiển thị: "ニチ", "ひと(つ)". */
export function kanjiReadingList(content: { onReading: string; kunReading: string }): string[] {
  return [content.onReading, content.kunReading]
    .flatMap((text) => text.split(/[・、,，/\s]+/))
    .map((reading) => reading.trim())
    .filter((reading) => reading && reading !== '-' && reading !== '—');
}

export const readingKey = (reading: string) => normalizeJapanese(reading.replace(/[()（）.\-]/g, ''), { foldKatakana: true });

/** Đúng / sai của một câu trả lời; `null` khi kiểu câu hỏi không áp dụng cho loại kiến thức này. */
export function gradeStudyAnswer(item: KnowledgeItem, ask: StudyAsk, answer: string, prompt = ''): boolean | null {
  const trimmed = answer.trim();
  switch (item.type) {
    case 'vocabulary':
      if (ask === 'meaning') return trimmed === item.meaning;
      if (ask === 'face') return trimmed === item.face;
      if (ask === 'reading') return compareJapanese(trimmed, [item.content.kana, item.content.kanji].filter(Boolean), { foldKatakana: true }).isCorrect;
      return null;
    case 'kanji':
      if (ask === 'meaning') return trimmed === item.meaning;
      if (ask === 'face') return trimmed === item.content.character;
      if (ask === 'reading') return kanjiReadingList(item.content).some((reading) => readingKey(reading) === readingKey(trimmed));
      if (ask === 'word-reading') {
        const word = parseKanjiWords(item.content.words).find((entry) => entry.word === prompt.trim());
        return word ? readingKey(word.reading) === readingKey(trimmed) : null;
      }
      return null;
    case 'radical':
      // Bộ thủ chỉ hỏi nghĩa (nhận ra bộ) — tính riêng cho bộ thủ, không bao giờ tính thay cho Kanji.
      return ask === 'meaning' ? trimmed === item.meaning : null;
    case 'grammar':
      if (ask === 'vi-to-jp') return compareJapanese(trimmed, [item.content.exampleJp, item.content.example2Jp].filter(Boolean)).isCorrect;
      if (ask === 'jp-to-vi') return [item.content.exampleVi, item.content.example2Vi].includes(trimmed);
      return null;
    default:
      return null;
  }
}
