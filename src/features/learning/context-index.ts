import type { MemoryView } from '@/features/memory/memory-types';
import type { KnowledgeCatalog } from './knowledge-catalog';
import type { ContentKey, KnowledgeItem } from './knowledge-types';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  CONTEXT INDEX — kiến thức nào xuất hiện trong câu nào
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Nguồn câu: câu ví dụ Tatoeba (content.exampleSentences) + câu ví dụ của từng mẫu ngữ pháp.
 *  Khớp bằng chuỗi con (không cần tách từ): từ vựng theo phần gốc (読みます → 読み), kanji theo chính chữ.
 *  Dùng để: thẻ học có câu ví dụ, "Bạn đã từng gặp: …" (kiến thức cũ quay lại trong kiến thức mới),
 *  và bước "Dùng thử" lấy từ câu thật. Hàm thuần — dựng một lần cho mỗi danh mục (WeakMap cache).
 * ═══════════════════════════════════════════════════════════════════
 */

export interface IndexedSentence {
  id: string;
  jp: string;
  vi: string;
  /** Kiến thức (từ vựng, kanji, ngữ pháp) có mặt trong câu. */
  keys: ContentKey[];
}

export interface ContextIndex {
  sentencesFor(key: ContentKey): IndexedSentence[];
}

/** Dạng để tìm trong câu: bỏ "ます"/"します", "〜", khoảng trắng; tính từ い (có kanji) lấy phần gốc — khớp mọi cách chia. */
export function searchStem(raw: string): string {
  const first = raw.split(/[／/・、]/)[0].replace(/\[[^\]]*\]/g, '').replace(/[〜～\s()（）]/g, '');
  if (first.endsWith('します') && first.length > 3) return first.slice(0, -3);
  if (first.endsWith('ます')) return first.slice(0, -2);
  if (/[一-鿿]/.test(first) && first.endsWith('い') && first.length > 2) return first.slice(0, -1);
  return first;
}

const HAS_KANJI = /[一-鿿]/;
/** Chuỗi kana quá ngắn (は, いい…) khớp nhầm khắp nơi → chỉ dùng kana từ 3 ký tự, hoặc có kanji. */
const isDistinctiveStem = (stem: string) => (HAS_KANJI.test(stem) ? stem.length >= 1 : stem.length >= 3);

function stemsOf(item: KnowledgeItem): string[] {
  switch (item.type) {
    case 'vocabulary': {
      const stems = [item.content.kanji ? searchStem(item.content.kanji) : '', searchStem(item.content.kana)];
      return [...new Set(stems)].filter((stem) => stem && isDistinctiveStem(stem));
    }
    case 'kanji':
      return [item.content.character];
    default:
      return [];
  }
}

const cache = new WeakMap<KnowledgeCatalog, ContextIndex>();

export function getContextIndex(catalog: KnowledgeCatalog): ContextIndex {
  const cached = cache.get(catalog);
  if (cached) return cached;

  const matchable = catalog.items.flatMap((item) => stemsOf(item).map((stem) => ({ key: item.key, stem })));
  const sentences: IndexedSentence[] = [
    ...catalog.content.exampleSentences.map((sentence) => ({ id: `tatoeba-${sentence.id}`, jp: sentence.jp, vi: sentence.vi, keys: [] as ContentKey[] })),
    // Câu mẫu ngữ pháp dạng bảng chia ("書きます → 書いて / …") không phải câu → bỏ.
    ...catalog.items.flatMap((item) => (item.type === 'grammar' && item.content.exampleJp && !/[→/／]/.test(item.content.exampleJp)
      ? [{ id: `grammar-${item.id}`, jp: item.content.exampleJp, vi: item.content.exampleVi, keys: [item.key] as ContentKey[] }]
      : [])),
  ];
  const byKey = new Map<ContentKey, IndexedSentence[]>();
  for (const sentence of sentences) {
    for (const { key, stem } of matchable) {
      if (sentence.jp.includes(stem) && !sentence.keys.includes(key)) sentence.keys.push(key);
    }
    for (const key of sentence.keys) byKey.set(key, [...(byKey.get(key) ?? []), sentence]);
  }

  const index: ContextIndex = { sentencesFor: (key) => byKey.get(key) ?? [] };
  cache.set(catalog, index);
  return index;
}

export interface ContextExample {
  jp: string;
  vi: string;
  /** Kiến thức ĐÃ HỌC khác cũng có trong câu — "Bạn đã từng gặp: …". */
  knownFaces: string[];
  /** Kiến thức trong câu (để bước Dùng thử hỏi). */
  keys: ContentKey[];
}

const MAX_KNOWN_FACES = 3;

/**
 * Câu ví dụ tốt nhất cho một kiến thức, với người học này: ưu tiên câu mà họ đã biết nhiều thứ khác trong câu
 * (kiến thức cũ quay lại), ít thứ lạ, và ngắn. null nếu chưa có câu nào.
 */
export function pickContextExample(
  catalog: KnowledgeCatalog,
  item: KnowledgeItem,
  memoryViews: ReadonlyMap<ContentKey, MemoryView>,
): ContextExample | null {
  const candidates = getContextIndex(catalog).sentencesFor(item.key);
  if (!candidates.length) return null;
  const isKnown = (key: ContentKey) => key !== item.key && (memoryViews.get(key)?.isLearned ?? false);
  const score = (sentence: IndexedSentence) => {
    const others = sentence.keys.filter((key) => key !== item.key);
    const known = others.filter(isKnown).length;
    return known * 3 - (others.length - known) - sentence.jp.length / 12;
  };
  const best = [...candidates].sort((left, right) => score(right) - score(left))[0];
  const knownFaces = [...new Set(best.keys.filter(isKnown).map((key) => catalog.byKey.get(key)?.face ?? ''))]
    .filter(Boolean).slice(0, MAX_KNOWN_FACES);
  return { jp: best.jp, vi: best.vi, knownFaces, keys: best.keys };
}

export interface KanaExampleWord {
  face: string;
  meaning: string;
}

/**
 * Chữ cái chưa có câu → vài TỪ bắt đầu bằng chữ đó, để thấy chữ được dùng ra sao ("あ trong あなた — bạn").
 * Ưu tiên từ ngắn viết hoàn toàn bằng kana.
 */
export function kanaExampleWords(catalog: KnowledgeCatalog, item: KnowledgeItem, limit = 2): KanaExampleWord[] {
  if (item.type !== 'hiragana' && item.type !== 'katakana') return [];
  return catalog.content.vocabulary
    .map((word) => ({ word, kana: searchStem(word.kana) }))
    .filter(({ kana }) => kana.startsWith(item.face) && kana.length >= 2 && kana.length <= 5)
    .sort((left, right) => left.kana.length - right.kana.length)
    .slice(0, limit)
    .map(({ word }) => {
      const kana = word.kana.split(/[／/]/)[0].trim();
      return { face: word.kanji ? `${word.kanji.split(/[／/]/)[0].trim()}（${kana}）` : kana, meaning: word.meaning };
    });
}

export interface SentenceBlank {
  /** Câu có chỗ trống ＿＿ thay cho từ cần điền. */
  sentenceJp: string;
  vi: string;
  /** Đúng dạng chữ xuất hiện trong câu (読み, 本…). */
  answer: string;
  /** Dạng chữ cùng kiểu của các từ khác — làm phương án nhiễu. */
  distractorPool: string[];
}

/** Câu THẬT (Tatoeba) có từ vựng này → đục lỗ đúng chỗ từ đó, để bước "Dùng thử" là câu người Nhật thật sự nói. */
/** `known`: chỉ lấy phương án nhiễu từ những từ người học đã biết (không truyền = mọi từ). */
export function realSentenceBlank(catalog: KnowledgeCatalog, item: KnowledgeItem, known?: ReadonlySet<ContentKey>): SentenceBlank | null {
  if (item.type !== 'vocabulary') return null;
  const stems = stemsOf(item);
  const sentence = getContextIndex(catalog).sentencesFor(item.key)
    .filter((candidate) => candidate.id.startsWith('tatoeba-'))
    .sort((left, right) => left.jp.length - right.jp.length)
    .find((candidate) => stems.some((stem) => candidate.jp.includes(stem)));
  if (!sentence) return null;
  const answer = stems.filter((stem) => sentence.jp.includes(stem)).sort((left, right) => right.length - left.length)[0];
  // Nhiễu cùng kiểu chữ và cùng loại: từ trọn vẹn (テレビ, 国) ↔ từ trọn vẹn; phần gốc động/tính từ (食べ) ↔ phần gốc.
  const isWhole = (word: KnowledgeItem, stem: string) => word.type === 'vocabulary' && [word.content.kanji, word.content.kana].includes(stem);
  const answerIsWhole = isWhole(item, answer);
  const distractorPool = [...new Set(catalog.items.flatMap((other) => (other.key === item.key || other.type !== 'vocabulary' || (known && !known.has(other.key)) ? []
    : stemsOf(other).filter((stem) => isWhole(other, stem) === answerIsWhole))))]
    .filter((stem) => stem !== answer && !answer.includes(stem) && !stem.includes(answer)
      && HAS_KANJI.test(stem) === HAS_KANJI.test(answer) && !sentence.jp.includes(stem));
  return { sentenceJp: sentence.jp.replace(answer, '＿＿'), vi: sentence.vi, answer, distractorPool };
}
