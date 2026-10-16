import type { KanaContent, KanjiContent, RadicalContent, VocabularyContent } from '@/types/content';
import { primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
import { hasStrokeOrder, strokeCountOf } from '@/features/learning/stroke-order';

/**
 * SỔ LUYỆN VIẾT — vở tập viết: mỗi trang vài dòng, mỗi dòng MỘT chữ (chữ mẫu + nhiều ô lặp lại).
 * Dựng hoàn toàn từ nội dung có sẵn (bảng kana, Kanji N5, bộ thủ) — không thêm chữ nào ngoài dữ liệu.
 *  - Hiragana / Katakana: theo hàng あ行, か行… (bảng 50 âm), rồi âm đục, rồi âm ghép (mỗi trang hai hàng).
 *  - Kanji / Bộ thủ: theo thứ tự lộ trình (ngày học), mỗi trang KANJI_PER_PAGE chữ.
 * Thứ tự nét chỉ báo "có" khi chữ nằm trong dữ liệu KanjiVG (stroke-order.ts) — không đoán.
 */
export type NotebookId = 'hiragana' | 'katakana' | 'kanji' | 'bo-thu' | 'tu-vung';

export interface NotebookRow {
  /** Chữ để viết (một ký tự, hoặc hai với âm ghép きゃ). */
  glyph: string;
  /** Dòng phụ dưới chữ mẫu: romaji với kana, âm Hán Việt với Kanji, tên với bộ thủ. */
  label: string;
  meaning?: string;
  reading?: string;
  strokeCount: number | null;
  hasStrokeOrder: boolean;
  /** Sổ Từ vựng: một dòng là một TỪ — viết mỗi chữ một ô, theo cách viết kana hoặc chữ Kanji. */
  word?: { kana: string[]; kanji: string[] | null; meaning: string };
}

export interface NotebookPage {
  /** Mã ổn định để lưu tiến độ: "<sổ>-<số thứ tự>" (ví dụ hiragana-3). */
  id: string;
  notebookId: NotebookId;
  number: number;
  title: string;
  subtitle: string;
  rows: NotebookRow[];
}

export interface Notebook {
  id: NotebookId;
  title: string;
  description: string;
  pages: NotebookPage[];
}

export const KANJI_PER_PAGE = 5;
export const RADICALS_PER_PAGE = 6;
const YOUON_ROWS_PER_PAGE = 2;

/** Bảng 50 âm + âm đục theo hàng (chỉ để XẾP NHÓM — chữ thật lấy từ dữ liệu kana). */
const KANA_ROWS: ReadonlyArray<{ id: string; label: string; chars: string }> = [
  { id: 'a', label: 'あ行', chars: 'あいうえお' }, { id: 'ka', label: 'か行', chars: 'かきくけこ' },
  { id: 'sa', label: 'さ行', chars: 'さしすせそ' }, { id: 'ta', label: 'た行', chars: 'たちつてと' },
  { id: 'na', label: 'な行', chars: 'なにぬねの' }, { id: 'ha', label: 'は行', chars: 'はひふへほ' },
  { id: 'ma', label: 'ま行', chars: 'まみむめも' }, { id: 'ya', label: 'や行', chars: 'やゆよ' },
  { id: 'ra', label: 'ら行', chars: 'らりるれろ' }, { id: 'wa', label: 'わ行 · ん', chars: 'わをん' },
  { id: 'ga', label: 'が行', chars: 'がぎぐげご' }, { id: 'za', label: 'ざ行', chars: 'ざじずぜぞ' },
  { id: 'da', label: 'だ行', chars: 'だぢづでど' }, { id: 'ba', label: 'ば行', chars: 'ばびぶべぼ' },
  { id: 'pa', label: 'ぱ行', chars: 'ぱぴぷぺぽ' },
];
const rowOfHiragana = (character: string) => KANA_ROWS.find((row) => row.chars.includes(character));

const toKatakanaLabel = (label: string) => label.replace(/[ぁ-ゖ]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0x60));

function strokeInfo(glyph: string): Pick<NotebookRow, 'strokeCount' | 'hasStrokeOrder'> {
  const characters = [...glyph];
  const isKnown = characters.every(hasStrokeOrder);
  return { hasStrokeOrder: isKnown, strokeCount: isKnown ? characters.reduce((sum, character) => sum + (strokeCountOf(character) ?? 0), 0) : null };
}

function kanaNotebook(kana: readonly KanaContent[], script: 'hiragana' | 'katakana'): Notebook {
  const glyphOf = (item: KanaContent) => (script === 'hiragana' ? item.hiragana : item.katakana);
  const rowOf = (item: KanaContent): NotebookRow => ({ glyph: glyphOf(item), label: item.romaji, ...strokeInfo(glyphOf(item)) });
  const pages: Array<Omit<NotebookPage, 'id' | 'number' | 'notebookId'>> = [];
  const single = kana.filter((item) => [...item.hiragana].length === 1);
  for (const group of KANA_ROWS) {
    const items = single.filter((item) => rowOfHiragana(item.hiragana)?.id === group.id);
    if (!items.length) continue;
    const label = script === 'hiragana' ? group.label : toKatakanaLabel(group.label);
    pages.push({ title: `Hàng ${label}`, subtitle: items.map((item) => item.romaji).join(' · '), rows: items.map(rowOf) });
  }
  // Âm ghép (きゃ…): gom theo chữ đầu, mỗi trang hai hàng.
  const youonGroups = new Map<string, KanaContent[]>();
  for (const item of kana.filter((entry) => [...entry.hiragana].length > 1)) {
    const head = item.hiragana[0];
    youonGroups.set(head, [...(youonGroups.get(head) ?? []), item]);
  }
  const groups = [...youonGroups.values()];
  for (let index = 0; index < groups.length; index += YOUON_ROWS_PER_PAGE) {
    const pageGroups = groups.slice(index, index + YOUON_ROWS_PER_PAGE);
    const items = pageGroups.flat();
    pages.push({ title: `Âm ghép ${pageGroups.map((group) => glyphOf(group[0]).slice(0, 1)).join(' · ')}`, subtitle: items.map((item) => item.romaji).join(' · '), rows: items.map(rowOf) });
  }
  return {
    id: script,
    title: script === 'hiragana' ? 'Hiragana' : 'Katakana',
    description: script === 'hiragana' ? 'Bảng chữ mềm — theo hàng あ行, か行…, âm đục và âm ghép.' : 'Bảng chữ cứng — theo hàng ア行, カ行…, âm đục và âm ghép.',
    pages: pages.map((page, index) => ({ ...page, id: `${script}-${index + 1}`, notebookId: script, number: index + 1 })),
  };
}

const byDay = <T extends { day: number | null; id: number }>(left: T, right: T) => (left.day ?? 999) - (right.day ?? 999) || left.id - right.id;
const dayRange = (items: ReadonlyArray<{ day: number | null }>) => {
  const days = items.map((item) => item.day).filter((day): day is number => day !== null);
  if (!days.length) return 'chưa gắn ngày';
  const [first, last] = [Math.min(...days), Math.max(...days)];
  return first === last ? `ngày ${first}` : `ngày ${first}–${last}`;
};

function chunked<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

function kanjiNotebook(kanji: readonly KanjiContent[]): Notebook {
  const pages = chunked([...kanji].sort(byDay), KANJI_PER_PAGE).map((items, index): NotebookPage => ({
    id: `kanji-${index + 1}`, notebookId: 'kanji', number: index + 1,
    title: items.map((item) => item.character).join(' '), subtitle: `Kanji N5 · ${dayRange(items)}`,
    rows: items.map((item) => ({
      glyph: item.character, label: item.hanViet, meaning: item.meaning,
      reading: [item.onReading, item.kunReading].filter(Boolean).join(' · '),
      ...strokeInfo(item.character),
      // Số nét trong dữ liệu Kanji dùng khi KanjiVG không có chữ.
      ...(hasStrokeOrder(item.character) ? {} : { strokeCount: item.strokes }),
    })),
  }));
  return { id: 'kanji', title: 'Kanji N5', description: `${kanji.length} chữ theo thứ tự lộ trình, mỗi trang ${KANJI_PER_PAGE} chữ — kèm âm Hán Việt, nghĩa, âm đọc.`, pages };
}

function radicalNotebook(radicals: readonly RadicalContent[]): Notebook {
  const pages = chunked([...radicals].sort(byDay), RADICALS_PER_PAGE).map((items, index): NotebookPage => ({
    id: `bo-thu-${index + 1}`, notebookId: 'bo-thu', number: index + 1,
    title: items.map((item) => primaryRadicalGlyph(item.radical)).join(' '), subtitle: `Bộ thủ · ${dayRange(items)}`,
    rows: items.map((item) => {
      const glyph = primaryRadicalGlyph(item.radical);
      return { glyph, label: item.nameJp.split(' / ')[0], meaning: item.meaning, ...strokeInfo(glyph) };
    }),
  }));
  return { id: 'bo-thu', title: 'Bộ thủ', description: `${radicals.length} bộ thủ trong app, mỗi trang ${RADICALS_PER_PAGE} bộ.`, pages };
}

export const WORDS_PER_PAGE = 5;

/**
 * Cách viết của một mục từ vựng (dữ liệu có ký hiệu phụ): lấy phương án đầu ("だれ / どなた" → だれ), bỏ phần tuỳ chọn
 * trong ngoặc vuông ("しんせつ[な]" → しんせつ), bỏ "〜" ở hai đầu ("〜さん" → さん), "〜" ở giữa thì lấy phần trước
 * ("ひとつ〜とお" → ひとつ), bỏ khoảng trắng. Trả mảng ký tự (mỗi ký tự một ô).
 */
export function writingFormOf(text: string): string[] {
  let form = text.split('/')[0].replace(/\[[^\]]*\]/g, '').replace(/[\s　]/g, '');
  form = form.replace(/^[〜~]+|[〜~]+$/g, '');
  if (/[〜~]/.test(form)) form = form.split(/[〜~]/)[0];
  return [...form].filter((character) => !/[()（）]/.test(character));
}

function vocabularyNotebook(vocabulary: readonly VocabularyContent[]): Notebook {
  const lessonOf = (word: VocabularyContent) => word.lesson.split('·')[0].trim() || 'Khác';
  const lessons = new Map<string, VocabularyContent[]>();
  for (const word of vocabulary) {
    if (!writingFormOf(word.kana).length) continue;
    lessons.set(lessonOf(word), [...(lessons.get(lessonOf(word)) ?? []), word]);
  }
  // Bài theo thứ tự lộ trình (ngày sớm nhất của bài), trong bài theo ngày rồi id.
  const firstDay = (words: VocabularyContent[]) => Math.min(...words.map((word) => word.day ?? 999));
  const ordered = [...lessons].sort(([, left], [, right]) => firstDay(left) - firstDay(right));
  const pages: NotebookPage[] = [];
  for (const [lesson, words] of ordered) {
    const chunks = chunked([...words].sort(byDay), WORDS_PER_PAGE);
    chunks.forEach((items, index) => {
      const number = pages.length + 1;
      pages.push({
        id: `tu-vung-${number}`, notebookId: 'tu-vung', number,
        title: items.map((item) => writingFormOf(item.kanji || item.kana).join('')).join(' · '),
        subtitle: `${lesson.replace(/^BÀI/, 'Bài')}${chunks.length > 1 ? ` · phần ${index + 1}/${chunks.length}` : ''}`,
        rows: items.map((item) => {
          const kana = writingFormOf(item.kana);
          const kanji = item.kanji ? writingFormOf(item.kanji) : [];
          return {
            glyph: kana.join(''), label: kanji.length ? kanji.join('') : '', meaning: item.meaning,
            strokeCount: null, hasStrokeOrder: kana.every(hasStrokeOrder),
            word: { kana, kanji: kanji.length && kanji.join('') !== kana.join('') ? kanji : null, meaning: item.meaning },
          };
        }),
      });
    });
  }
  return { id: 'tu-vung', title: 'Từ vựng', description: `${vocabulary.length} từ theo bài Minna, mỗi trang ${WORDS_PER_PAGE} từ — viết mỗi chữ một ô, bằng kana hoặc chữ Kanji.`, pages };
}

export function buildNotebooks(content: {
  kana: readonly KanaContent[]; kanji: readonly KanjiContent[]; radicals: readonly RadicalContent[]; vocabulary?: readonly VocabularyContent[];
}): Notebook[] {
  return [
    kanaNotebook(content.kana, 'hiragana'),
    kanaNotebook(content.kana, 'katakana'),
    kanjiNotebook(content.kanji),
    radicalNotebook(content.radicals),
    vocabularyNotebook(content.vocabulary ?? []),
  ].filter((notebook) => notebook.pages.length > 0);
}

/**
 * Dòng từ vựng kiểu giấy ô vuông (genkō yōshi): cả từ viết NỐI TIẾP, mỗi chữ một ô, hết hàng thì xuống hàng — ô cùng cỡ,
 * cùng số cột với các sổ chữ nên hàng nào cũng kín. L ô đầu là mẫu; sau đó lặp lại từ.
 *  - Đầy khung: kín `rows` hàng, nhưng luôn đủ chỗ cho mẫu + ít nhất 2 lần viết (từ dài trên điện thoại → thêm hàng).
 *  - Số lần cố định: mẫu + N lần viết.
 *  - "Nửa đồ": chữ mờ đúng hết hàng đầu (ít nhất một lần viết trọn từ), phần sau tự viết.
 */
export function wordCells(input: { columns: number; rows: number; wordLength: number; repeats: RepeatSetting }):
  { total: number; ghostLimit: (mode: GhostMode) => number } {
  const length = Math.max(1, input.wordLength);
  const columns = Math.max(1, input.columns);
  const total = input.repeats === 'auto'
    ? Math.max(input.rows, Math.ceil((length * 3) / columns)) * columns
    : length * (input.repeats + 1);
  const ghostLimit = (mode: GhostMode) => {
    if (mode === 'all') return total;
    if (mode === 'none') return length;
    // Đầy khung: chữ mờ đúng hết hàng đầu (từ dài hơn một hàng → ít nhất trọn một lần viết sau mẫu).
    const limit = input.repeats === 'auto' ? Math.max(columns, 2 * length) : length * (1 + Math.ceil(input.repeats / 2));
    return Math.min(total, limit);
  };
  return { total, ghostLimit };
}

export function findNotebookPage(notebooks: readonly Notebook[], pageId: string): NotebookPage | undefined {
  return notebooks.flatMap((notebook) => notebook.pages).find((page) => page.id === pageId);
}

/** Số ô lặp lại mỗi chữ (người học chọn) — hoặc 'auto': lấp đầy khung giấy. */
export const REPEAT_OPTIONS = [4, 6, 8, 10, 12] as const;
export type RepeatSetting = number | 'auto';
export const DEFAULT_REPEATS: RepeatSetting = 'auto';
/** Số ô khi in ở chế độ "Đầy khung" — vừa một dòng A4 (13 ô × 13 mm kể cả ô mẫu). */
export const PRINT_AUTO_REPEATS = 12;

/** Lưới của một dòng chữ: số cột vừa bề rộng khung; ô mẫu chiếm 2 cột × 2 hàng. */
export const SAMPLE_SPAN = 2;
const MIN_COLUMNS = SAMPLE_SPAN + 2;

export function gridColumns(containerWidth: number, cellSize: number, gap: number): number {
  if (containerWidth <= 0) return MIN_COLUMNS;
  return Math.max(MIN_COLUMNS, Math.floor((containerWidth + gap) / (cellSize + gap)));
}

/**
 * "Đầy khung": số ô luyện để dòng chữ lấp kín đúng số hàng — 2 hàng khi khung rộng (máy tính, iPad: ≥ 8 cột),
 * 3 hàng khi khung hẹp (điện thoại) để vẫn đủ ô luyện. Ô mẫu chiếm SAMPLE_SPAN × SAMPLE_SPAN chỗ.
 */
export function fillRepeats(columns: number): { rows: number; repeats: number } {
  const rows = columns >= 8 ? 2 : 3;
  return { rows, repeats: rows * columns - SAMPLE_SPAN * SAMPLE_SPAN };
}

export type GhostMode = 'all' | 'half' | 'none';
/** Ô thứ `index` (0-based) có chữ mờ để đồ theo không: đồ hết · nửa đầu đồ, nửa sau tự viết · tự viết hết. */
export function isGhostCell(index: number, repeats: number, mode: GhostMode): boolean {
  if (mode === 'all') return true;
  if (mode === 'none') return false;
  return index < Math.ceil(repeats / 2);
}
