import type { KnowledgeItem } from '@/features/learning/knowledge-types';

/**
 * Bài chữ cái của một ngày, dạng BẢNG để nhìn ra quy luật (không phải danh sách rời):
 *  - rows    : hàng âm (あ い う え お / か き く け こ…)
 *  - dakuten : âm gốc → âm đục / bán đục, theo từng phụ âm, kèm mẹo nhớ + ngoại lệ đã kiểm tra
 *  - youon   : chữ cột い + ゃ ゅ ょ nhỏ
 * Suy ra từ chính các chữ của ngày (Unicode: âm đục = âm gốc + 1, bán đục = âm gốc + 2) — không có bảng soạn tay để lệch.
 */

export interface KanaCell {
  item: KnowledgeItem;
  /** Âm gốc (か cho が) — chỉ có ở bảng âm đục. */
  base?: string;
  baseReading?: string;
}

export interface KanaRow {
  label: string;
  /** "K → G · con gái" — chỉ ở bảng âm đục. */
  rule?: string;
  cells: KanaCell[];
}

export type KanaLesson =
  | { kind: 'rows'; rows: KanaRow[] }
  | { kind: 'dakuten'; rows: KanaRow[]; exceptions: string[] }
  | { kind: 'youon'; rows: KanaRow[] };

/** Mẹo nhớ theo phụ âm — đã kiểm tra: docs/N5_CONTENT_AUDIT.md (mục Dakuten). */
const DAKUTEN_RULES: Record<string, string> = {
  g: 'K → G · “con gái”',
  z: 'S → Z · “sống zai”',
  d: 'T → D · “tự do”',
  b: 'H → B · “hòa bình”',
  p: 'H → P · “hạnh phúc” (dấu ゜ vòng tròn)',
};

export const DAKUTEN_EXCEPTIONS = [
  'じ đọc “ji” (không phải “zi”).',
  'ぢ cũng đọc “ji”, づ đọc “zu” — rất hiếm, thường viết じ / ず.',
  'ふ đọc “fu”, nhưng ぶ là “bu” và ぷ là “pu”.',
];

const VOICED_OF: Record<string, string> = { k: 'g', s: 'z', t: 'd', h: 'b' };
const UNVOICED_OF: Record<string, string> = { g: 'k', z: 's', d: 't', b: 'h', p: 'h' };

/** Phụ âm của HÀNG chứa âm này: shi → s, chi/tsu → t, fu → h. */
function rowConsonant(reading: string): string {
  return ROW_OF[reading] ?? reading[0];
}

export function buildKanaLesson(items: KnowledgeItem[], allKana: KnowledgeItem[]): KanaLesson | null {
  if (!items.length) return null;
  const readings = new Map(allKana.map((item) => [item.face, item.reading.toLowerCase()]));

  if (items.every((item) => [...item.face].length === 2)) {
    // Âm ghép: nhóm theo chữ đầu (き → きゃ きゅ きょ).
    const groups = new Map<string, KnowledgeItem[]>();
    for (const item of items) groups.set(item.face[0], [...(groups.get(item.face[0]) ?? []), item]);
    return { kind: 'youon', rows: [...groups].map(([first, cells]) => ({ label: `${first} + ゃゅょ`, cells: cells.map((item) => ({ item })) })) };
  }

  const firstFace = items[0].face;
  if (items.every((item) => /^[gzjdbp]/.test(item.reading.toLowerCase()))) {
    // Nhóm theo CHỮ GỐC, không theo romaji: ぢ đọc "ji", づ đọc "zu" nhưng thuộc hàng た (ち/つ + ゛).
    const groups = new Map<string, KanaCell[]>();
    for (const item of items) {
      const isHandakuten = item.reading.toLowerCase().startsWith('p');
      const base = String.fromCodePoint(item.face.codePointAt(0)! - (isHandakuten ? 2 : 1));
      const baseReading = readings.get(base) ?? '';
      const voiced = isHandakuten ? 'p' : VOICED_OF[rowConsonant(baseReading)] ?? '';
      groups.set(voiced, [...(groups.get(voiced) ?? []), { item, base, baseReading }]);
    }
    return {
      kind: 'dakuten',
      rows: [...groups].map(([voiced, cells]) => ({
        label: `${(UNVOICED_OF[voiced] ?? '').toUpperCase()} → ${voiced.toUpperCase()}`,
        rule: DAKUTEN_RULES[voiced],
        cells,
      })),
      exceptions: firstFace >= 'ァ' ? DAKUTEN_EXCEPTIONS.map(toKatakanaNote) : DAKUTEN_EXCEPTIONS,
    };
  }

  // Hàng âm cơ bản: hàng = phụ âm đầu (あ hàng nguyên âm; ん đứng riêng).
  const groups = new Map<string, KnowledgeItem[]>();
  for (const item of items) {
    const reading = item.reading.toLowerCase();
    const row = reading === 'n' ? 'n' : /^[aiueo]$/.test(reading) ? 'a' : rowConsonant(reading);
    groups.set(row, [...(groups.get(row) ?? []), item]);
  }
  return { kind: 'rows', rows: [...groups].map(([, cells]) => ({ label: `Hàng ${cells[0].face}`, cells: cells.map((item) => ({ item })) })) };
}

/** Âm đặc biệt thuộc hàng nào: shi → hàng さ, chi/tsu → hàng た, fu → hàng は. */
const ROW_OF: Record<string, string> = { shi: 's', chi: 't', tsu: 't', fu: 'h', wo: 'w' };

const HIRAGANA_TO_KATAKANA_OFFSET = 0x60;
function toKatakanaNote(note: string): string {
  return note.replace(/[ぁ-ゖ]/g, (character) => String.fromCodePoint(character.codePointAt(0)! + HIRAGANA_TO_KATAKANA_OFFSET));
}
