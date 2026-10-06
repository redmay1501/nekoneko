import type { KanjiRadicalLink, N5Content, RadicalContent } from '@/types/content';

/** Dạng file content/seed/kanji-radicals.json. */
export interface KanjiRadicalSource {
  supplementaryRadicals: { radical: string; nameJp: string; meaning: string; tip: string }[];
  /** chữ kanji → các bộ (đúng chuỗi `radical` của bảng radicals), bộ chính đứng đầu. */
  kanji: Record<string, string[]>;
}

/**
 * Gắn thành phần bộ thủ cho từng kanji BẰNG ID (thay cho cột văn bản "Kanji chứa bộ này"):
 *  - bộ chưa có trong lộ trình được thêm vào bảng radicals với day = null (bộ tham khảo, không xếp lịch học);
 *  - kanjiList của mọi bộ được tính lại từ liên kết, để văn bản và liên kết luôn nói cùng một điều.
 */
export function withKanjiRadicals(content: Omit<N5Content, 'kanjiRadicals'>, source: KanjiRadicalSource): N5Content {
  let nextId = Math.max(...content.radicals.map((radical) => radical.id)) + 1;
  const supplementary: RadicalContent[] = source.supplementaryRadicals.map((radical) => ({
    id: nextId++, radical: radical.radical, nameJp: radical.nameJp, meaning: radical.meaning, kanjiList: '', tip: radical.tip, day: null,
  }));
  const radicals = [...content.radicals, ...supplementary];
  const radicalId = new Map(radicals.map((radical) => [radical.radical, radical.id]));
  const kanjiRadicals: KanjiRadicalLink[] = content.kanji.flatMap((kanji) => (source.kanji[kanji.character] ?? []).map((glyph, position) => {
    const id = radicalId.get(glyph);
    if (id === undefined) throw new Error(`kanji-radicals.json: bộ "${glyph}" của ${kanji.character} không có trong bảng bộ thủ`);
    return { kanjiId: kanji.id, radicalId: id, position };
  }));

  // kanjiList: kanji N5 có chứa bộ (theo liên kết) + kanji ngoài N5 mà lộ trình đã ghi (ví dụ 池, 酒 cho bộ 氵).
  const kanjiById = new Map(content.kanji.map((kanji) => [kanji.id, kanji.character]));
  const n5Characters = new Set(content.kanji.map((kanji) => kanji.character));
  const linked = new Map<number, string[]>();
  for (const link of kanjiRadicals) linked.set(link.radicalId, [...(linked.get(link.radicalId) ?? []), kanjiById.get(link.kanjiId) ?? '']);
  const withLists = radicals.map((radical) => {
    const outsideN5 = radical.kanjiList.split(/[・,\s]+/).filter((character) => character && !n5Characters.has(character));
    const characters = [...new Set([...(linked.get(radical.id) ?? []), ...outsideN5])];
    return { ...radical, kanjiList: characters.join('・') };
  });
  return { ...content, radicals: withLists, kanjiRadicals };
}
