import type { KnowledgeItem } from './knowledge-types';

/** Dấu phân cách nhiều cách đọc trong dữ liệu: "ひ・か", "ひと / にんべん", "ニチ、ジツ". */
const READING_SEPARATORS = /[・、,，/／;；]/;
/** Ký hiệu chú thích không được đọc thành tiếng: ngoặc okurigana "ひと(つ)", gạch nối "-か", dấu chấm "あ.う", dấu "〜さん". */
const NOTATION_MARKS = /[()（）\-－.．\s〜～~]/g;

/** Cách đọc ĐẦU TIÊN, đã bỏ ký hiệu chú thích: "ひと(つ)・ひと" → "ひとつ". */
export function firstSpokenReading(readings: string): string {
  const first = readings.split(READING_SEPARATORS).map((part) => part.replace(NOTATION_MARKS, '')).find(Boolean);
  return first ?? '';
}

/**
 * Chữ tiếng Nhật được ĐỌC THÀNH TIẾNG cho một kiến thức — luôn là chữ Nhật, không bao giờ là romaji
 * (giọng tiếng Nhật đọc "a" thành "エー"), không chứa ký hiệu chú thích của dữ liệu.
 */
export function speechTextFor(item: KnowledgeItem): string {
  switch (item.type) {
    case 'hiragana':
    case 'katakana':
      return item.face;
    case 'kanji':
      // Ưu tiên âm Kun (từ đứng một mình, nghe tự nhiên); không có thì âm On.
      return firstSpokenReading(item.content.kunReading) || firstSpokenReading(item.content.onReading) || item.face;
    case 'radical':
      return firstSpokenReading(item.content.nameJp) || item.face;
    case 'vocabulary':
      return firstSpokenReading(item.content.kana) || item.face;
    case 'grammar':
      return item.content.exampleJp || item.face;
  }
}
