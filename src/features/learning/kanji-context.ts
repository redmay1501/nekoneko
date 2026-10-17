import type { KanjiContent, VocabularyContent } from '@/types/content';

/**
 * Kanji học TRONG từ vựng (lộ trình phân bổ lại — docs/ROADMAP_REPLAN.md): mỗi Kanji gặp lần đầu cùng ngày với từ chứa nó.
 * Module này trả lời: hôm nay Kanji nằm trong từ nào, đọc thế nào TRONG từ đó, và đã gặp ở những từ nào trước đây.
 * Cách đọc trong từ chỉ suy từ dữ liệu (âm On / Kun của Kanji) — không chắc thì không đoán.
 */

export interface KanjiInWord {
  word: VocabularyContent;
  /** Cách đọc của Kanji trong chính từ này (hiragana), null nếu không suy ra chắc chắn (vd. 今日 きょう — đọc đặc biệt). */
  reading: string | null;
}

export interface KanjiContext {
  /** Từ của chính ngày học chứa Kanji (ngữ cảnh giới thiệu). */
  today: KanjiInWord[];
  /** Từ đã học ở các ngày TRƯỚC có cùng Kanji — để thấy mối liên hệ (tối đa EARLIER_LIMIT). */
  earlier: VocabularyContent[];
}

const EARLIER_LIMIT = 4;
const KATAKANA_TO_HIRAGANA = 0x60;
const DAKUTEN: Record<string, string> = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
};
const HANDAKUTEN: Record<string, string> = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
/** Đuôi động từ (hàng う) → dạng ます (hàng い): いる → いり (入口), のむ → のみ (飲み物). */
const MASU_STEM: Record<string, string> = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
const IS_KANA = /[぀-ヿー]/;
const MAX_UNKNOWN_KANJI_READING = 4;

const toHiragana = (text: string) => text.replace(/[ァ-ヶ]/g, (character) => String.fromCodePoint(character.codePointAt(0)! - KATAKANA_TO_HIRAGANA));

/** Các cách đọc gốc của Kanji theo dữ liệu (On đổi sang hiragana; Kun bỏ phần okurigana trong ngoặc / sau dấu chấm). */
export function baseReadings(kanji: Pick<KanjiContent, 'onReading' | 'kunReading'>): string[] {
  const split = (text: string) => text.split(/[・、,/\s]+/).map((part) => part.trim()).filter(Boolean);
  const on = split(kanji.onReading).map(toHiragana);
  const kun = split(kanji.kunReading).flatMap((reading) => {
    const stem = reading.replace(/[(（].*$/, '').replace(/\..*$/, '');
    const full = reading.replace(/[()（）.]/g, '');
    if (full === stem) return [stem];
    // Dạng ます: động từ nhóm I đổi đuôi sang hàng い; nhóm II (〜る) bỏ る — thử cả hai, chỉ dùng khi ghép khớp cả từ.
    const masu = MASU_STEM[full.slice(-1)] ? [full.slice(0, -1) + MASU_STEM[full.slice(-1)]] : [];
    const ichidan = full.endsWith('る') && full.length > 2 ? [full.slice(0, -1)] : [];
    return [stem, full, ...masu, ...ichidan];
  });
  return [...new Set([...on, ...kun].map((reading) => reading.replace(/[-ー〜~]/g, '')).filter(Boolean))];
}

/** Biến âm thường gặp khi ghép từ: âm đục / bán đục ở chữ đầu (rendaku), âm cuối thành っ (sokuon). */
function readingVariants(reading: string): string[] {
  const variants = new Set([reading]);
  const first = reading[0];
  if (DAKUTEN[first]) variants.add(DAKUTEN[first] + reading.slice(1));
  if (HANDAKUTEN[first]) variants.add(HANDAKUTEN[first] + reading.slice(1));
  if (reading.length >= 2) {
    const small = reading.slice(0, -1) + 'っ';
    variants.add(small);
    if (DAKUTEN[first]) variants.add(DAKUTEN[first] + small.slice(1));
  }
  return [...variants];
}

type KanjiReadings = Pick<KanjiContent, 'character' | 'onReading' | 'kunReading'>;

/**
 * Cách đọc của `character` trong từ `word`: dò ghép mặt chữ với cách đọc kana — chữ kana phải khớp nguyên văn; Kanji có dữ liệu
 * (`known`, gồm Kanji đích) chỉ dùng các cách đọc của nó (kèm biến âm); Kanji ngoài danh sách khớp 1–4 kana bất kỳ.
 * Chỉ trả kết quả khi MỌI cách ghép hợp lệ cho cùng một cách đọc; không ghép được (đọc đặc biệt như 今日, 一人) thì null.
 */
export function kanjiReadingInWord(kanji: KanjiReadings, word: Pick<VocabularyContent, 'kanji' | 'kana'>, known: ReadonlyMap<string, KanjiReadings> = new Map()): string | null {
  const face = [...(word.kanji ?? '').replace(/[〜~]/g, '')];
  const kana = toHiragana(word.kana.split(/\s*[/／]\s*/)[0].replace(/[〜~\s]/g, ''));
  if (!face.includes(kanji.character) || !kana) return null;
  const readingsOf = new Map<string, string[]>();
  const candidatesOf = (character: string) => {
    if (!readingsOf.has(character)) {
      const entry = character === kanji.character ? kanji : known.get(character);
      readingsOf.set(character, entry ? baseReadings(entry).flatMap(readingVariants) : []);
    }
    return readingsOf.get(character)!;
  };
  const found = new Set<string>();

  const walk = (faceIndex: number, kanaIndex: number, picked: string | null) => {
    if (found.size > 1) return;
    if (faceIndex === face.length) {
      if (kanaIndex === kana.length && picked) found.add(picked);
      return;
    }
    const character = face[faceIndex];
    if (character === '々') {
      // Lặp chữ trước: cho khớp như một Kanji không rõ cách đọc.
      for (let length = 1; length <= MAX_UNKNOWN_KANJI_READING && kanaIndex + length <= kana.length; length++) walk(faceIndex + 1, kanaIndex + length, picked);
      return;
    }
    if (IS_KANA.test(character)) {
      if (toHiragana(character) === kana[kanaIndex]) walk(faceIndex + 1, kanaIndex + 1, picked);
      return;
    }
    if (character === kanji.character && picked === null) {
      for (const reading of candidatesOf(character)) if (kana.startsWith(reading, kanaIndex)) walk(faceIndex + 1, kanaIndex + reading.length, reading);
      return;
    }
    const readings = candidatesOf(character);
    if (readings.length) {
      for (const reading of readings) if (kana.startsWith(reading, kanaIndex)) walk(faceIndex + 1, kanaIndex + reading.length, picked);
      return;
    }
    for (let length = 1; length <= MAX_UNKNOWN_KANJI_READING && kanaIndex + length <= kana.length; length++) walk(faceIndex + 1, kanaIndex + length, picked);
  };
  walk(0, 0, null);
  return found.size === 1 ? [...found][0] : null;
}

const containsKanji = (word: VocabularyContent, character: string) => (word.kanji ?? '').includes(character);

/** Tra cách đọc của mọi Kanji có dữ liệu — để ghép từ nhiều Kanji (先生, 入口) cho đúng. */
export function kanjiReadingIndex(kanji: readonly KanjiReadings[]): ReadonlyMap<string, KanjiReadings> {
  return new Map(kanji.map((entry) => [entry.character, entry]));
}

/** Ngữ cảnh của một Kanji trong ngày `day`: từ của hôm nay chứa nó (kèm cách đọc trong từ) + từ đã học trước đó. */
export function kanjiContextOf(kanji: KanjiContent, content: { vocabulary: readonly VocabularyContent[]; kanji: readonly KanjiContent[] }, day: number): KanjiContext {
  const { vocabulary } = content;
  const known = kanjiReadingIndex(content.kanji);
  const today = vocabulary.filter((word) => word.day === day && containsKanji(word, kanji.character))
    .map((word) => ({ word, reading: kanjiReadingInWord(kanji, word, known) }));
  const earlier = vocabulary.filter((word) => word.day !== null && word.day < day && containsKanji(word, kanji.character))
    .sort((left, right) => (left.day ?? 0) - (right.day ?? 0) || left.id - right.id)
    .slice(0, EARLIER_LIMIT);
  return { today, earlier };
}

/** Từ đã học tới ngày `day` (gồm hôm nay) có chứa Kanji — hôm nay trước, rồi theo thứ tự lộ trình. Không lấy từ của ngày sau. */
export function learnedWordsWithKanji(kanji: Pick<KanjiContent, 'character'>, vocabulary: readonly VocabularyContent[], day: number): VocabularyContent[] {
  return vocabulary.filter((word) => word.day !== null && word.day <= day && containsKanji(word, kanji.character))
    .sort((left, right) => Number(right.day === day) - Number(left.day === day) || (left.day ?? 0) - (right.day ?? 0) || left.id - right.id);
}
