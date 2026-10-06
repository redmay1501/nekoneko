import type { RadicalContent } from '@/types/content';
import { type KnowledgeCatalog, primaryRadicalGlyph } from './knowledge-catalog';
import { kanjiContainingRadical } from './knowledge-relations';

/** Một bộ thủ để hiển thị mở rộng tại chỗ. */
export interface RadicalExpandableData {
  id: number;
  face: string;
  meaning: string;
  nameJp: string;
  tip: string;
  /** null = bộ tham khảo (không xếp ngày học riêng). */
  day: number | null;
  kanji: { id: number; character: string; meaning: string }[];
}

/** Dữ liệu cho một bộ thủ mở rộng tại chỗ — nghĩa, mẹo, Kanji chứa nó. */
export function toRadicalExpandable(catalog: KnowledgeCatalog, radical: RadicalContent): RadicalExpandableData {
  return {
    id: radical.id, face: primaryRadicalGlyph(radical.radical), meaning: radical.meaning, nameJp: radical.nameJp,
    tip: radical.tip, day: radical.day,
    kanji: kanjiContainingRadical(catalog, radical).map((kanji) => ({ id: kanji.id, character: kanji.character, meaning: kanji.meaning })),
  };
}
