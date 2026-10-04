import type { N5Content } from '@/types/content';
import {
  type ContentKey,
  type ContentType,
  type KnowledgeItem,
  parseContentKey,
  toContentKey,
} from './knowledge-types';

/**
 * Danh mục kiến thức hợp nhất: gom 6 bảng nội dung thành một danh sách
 * KnowledgeItem để Memory Engine và Session Engine làm việc trên cùng một kiểu.
 *
 * Hàm thuần — không đọc database, không đọc trạng thái người dùng.
 */
export interface KnowledgeCatalog {
  content: N5Content;
  items: KnowledgeItem[];
  byKey: ReadonlyMap<ContentKey, KnowledgeItem>;
}

/** Bộ thủ có thể ghi "人 / 亻" — mặt chữ chính là phần trước dấu "/". */
export function primaryRadicalGlyph(radical: string): string {
  return radical.split(' / ')[0].trim();
}

/**
 * Mỗi dòng bảng chữ cái mang cả Hiragana lẫn Katakana nhưng chỉ có MỘT cột ngày (ngày học Hiragana, 1–6).
 * Lộ trình học Katakana đúng một tuần sau, cùng thứ tự: Hiragana ngày 1–6 · ôn ngày 7 · Katakana ngày 8–13 · ôn ngày 14.
 */
export const KATAKANA_DAY_OFFSET = 7;

export function buildKnowledgeCatalog(content: N5Content): KnowledgeCatalog {
  const items: KnowledgeItem[] = [];

  for (const kana of content.kana) {
    items.push({
      type: 'hiragana', key: toContentKey('hiragana', kana.id), id: kana.id,
      face: kana.hiragana, reading: kana.romaji, meaning: 'Chữ Hiragana', day: kana.day, content: kana,
    });
    items.push({
      type: 'katakana', key: toContentKey('katakana', kana.id), id: kana.id,
      face: kana.katakana, reading: kana.romaji, meaning: 'Chữ Katakana',
      day: kana.day === null ? null : kana.day + KATAKANA_DAY_OFFSET, content: kana,
    });
  }
  for (const radical of content.radicals) {
    items.push({
      type: 'radical', key: toContentKey('radical', radical.id), id: radical.id,
      face: primaryRadicalGlyph(radical.radical), reading: radical.nameJp, meaning: radical.meaning,
      day: radical.day, content: radical,
    });
  }
  for (const kanji of content.kanji) {
    items.push({
      type: 'kanji', key: toContentKey('kanji', kanji.id), id: kanji.id,
      face: kanji.character, reading: kanji.kunReading || kanji.onReading, meaning: kanji.meaning,
      day: kanji.day, content: kanji,
    });
  }
  for (const word of content.vocabulary) {
    items.push({
      type: 'vocabulary', key: toContentKey('vocabulary', word.id), id: word.id,
      face: word.kanji || word.kana, reading: word.kana, meaning: word.meaning, day: word.day, content: word,
    });
  }
  for (const pattern of content.grammar) {
    items.push({
      type: 'grammar', key: toContentKey('grammar', pattern.id), id: pattern.id,
      face: pattern.pattern, reading: pattern.exampleJp, meaning: pattern.usage, day: pattern.day, content: pattern,
    });
  }

  return { content, items, byKey: new Map(items.map((item) => [item.key, item])) };
}

export function itemsOfType<T extends ContentType>(
  catalog: KnowledgeCatalog,
  type: T,
): Extract<KnowledgeItem, { type: T }>[] {
  return catalog.items.filter((item): item is Extract<KnowledgeItem, { type: T }> => item.type === type);
}

/** Những kiến thức lộ trình xếp vào đúng ngày `day`. */
export function itemsScheduledOn(catalog: KnowledgeCatalog, day: number): KnowledgeItem[] {
  return catalog.items.filter((item) => item.day === day);
}

/** Những kiến thức lộ trình xếp vào ngày `day` trở về trước. */
export function itemsScheduledUpTo(catalog: KnowledgeCatalog, day: number): KnowledgeItem[] {
  return catalog.items.filter((item) => item.day !== null && item.day <= day);
}

/** Tìm kiến thức từ một chuỗi bất kỳ (ví dụ tham số URL). Trả về undefined nếu không hợp lệ. */
export function findKnowledgeItem(catalog: KnowledgeCatalog, rawKey: string): KnowledgeItem | undefined {
  const parsed = parseContentKey(rawKey);
  return parsed ? catalog.byKey.get(toContentKey(parsed.type, parsed.id)) : undefined;
}
