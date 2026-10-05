import { firstMeaning } from '@/lib/utils/text';
import { type ContextExample, type KanaExampleWord, kanaExampleWords, pickContextExample } from './context-index';
import type { MemoryView } from '@/features/memory/memory-types';
import { speechTextFor } from './speech-text';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import { type KnowledgeCatalog, primaryRadicalGlyph } from './knowledge-catalog';
import {
  grammarUsingVocabulary,
  kanjiContainingRadical,
  kanjiInVocabulary,
  radicalsOfKanji,
  vocabularyContainingKanji,
} from './knowledge-relations';
import type { ContentKey, KnowledgeItem } from './knowledge-types';

/**
 * Chuyển một KnowledgeItem thành dữ liệu sẵn hiển thị cho các khoảnh khắc học:
 * thẻ Khám phá, chuỗi liên kết, gợi ý khi cứu, câu ngữ cảnh.
 *
 * Vì sao tách khỏi component: cùng một cách "nối vào thứ đã biết" được dùng ở
 * phiên học, màn cứu kiến thức và màn chi tiết. Đặt ở đây để không viết ba lần.
 */

export interface RelatedChip {
  face: string;
  label: string;
}

export interface DiscoverCard {
  face: string;
  reading: string;
  meaning: string;
  detailLines: string[];
  relatedChips: RelatedChip[];
  /** Câu nối kiến thức mới vào thứ đã học — "Nó mang bộ 日 bạn đã học ngày 17". */
  bridgeText: string | null;
  audioText: string;
  /** Câu ví dụ có kiến thức này — kèm thứ người học ĐÃ GẶP trong câu (kiến thức cũ quay lại). */
  example?: ContextExample | null;
  /** Chữ cái: vài từ bắt đầu bằng chữ này ("あ trong あなた — bạn"). */
  exampleWords?: KanaExampleWord[];
}

export interface ChainNode {
  face: string;
  caption: string;
}

export interface RescueHint {
  hintText: string;
  parts: RelatedChip[];
}

export interface ContextSentence {
  sentenceJp: string;
  translationVi: string;
}

/**
 * Thẻ Khám phá: mặt chữ, cách đọc, nghĩa, mẹo — và NGỮ CẢNH: một câu ví dụ (ưu tiên câu có nhiều thứ người học đã
 * biết, kèm "Bạn đã từng gặp: …"), hoặc với chữ cái là vài từ dùng chữ đó.
 */
export function buildDiscoverCard(
  item: KnowledgeItem,
  catalog: KnowledgeCatalog,
  journeyDay: number,
  memoryViews: ReadonlyMap<ContentKey, MemoryView> = new Map(),
): DiscoverCard {
  const card = buildBaseDiscoverCard(item, catalog, journeyDay);
  if (item.type === 'hiragana' || item.type === 'katakana') return { ...card, exampleWords: kanaExampleWords(catalog, item) };
  // Ngữ pháp đã có câu mẫu riêng trong thẻ → chỉ thêm ngữ cảnh cho từ vựng / kanji.
  if (item.type === 'vocabulary' || item.type === 'kanji') return { ...card, example: pickContextExample(catalog, item, memoryViews) };
  return card;
}

function buildBaseDiscoverCard(item: KnowledgeItem, catalog: KnowledgeCatalog, journeyDay: number): DiscoverCard {
  const base = { face: item.face, reading: item.reading, meaning: item.meaning, audioText: speechTextFor(item) };
  switch (item.type) {
    case 'kanji': {
      const radical = radicalsOfKanji(catalog, item.content).find((candidate) => (candidate.day ?? 99) <= journeyDay);
      return {
        ...base,
        detailLines: [`${item.content.hanViet} · ${item.content.onReading}・${item.content.kunReading || '—'}`, item.content.tip],
        relatedChips: [],
        bridgeText: radical
          ? `Nó mang bộ ${primaryRadicalGlyph(radical.radical)} (${radical.meaning.toLowerCase()}) mà bạn đã học ngày ${radical.day}.`
          : null,
      };
    }
    case 'vocabulary': {
      const knownKanji = kanjiInVocabulary(catalog, item.content).filter((kanji) => (kanji.day ?? 99) <= journeyDay);
      return {
        ...base,
        detailLines: [item.content.tip],
        relatedChips: knownKanji.map((kanji) => ({ face: kanji.character, label: kanji.meaning.toLowerCase() })),
        bridgeText: knownKanji[0]
          ? `Trong từ này có chữ ${knownKanji[0].character} (${knownKanji[0].meaning.toLowerCase()}) bạn đã gặp rồi.`
          : null,
      };
    }
    case 'radical':
      return {
        ...base,
        detailLines: [item.content.tip],
        relatedChips: kanjiContainingRadical(catalog, item.content).slice(0, 4).map((kanji) => ({ face: kanji.character, label: '' })),
        bridgeText: null,
      };
    case 'grammar':
      return {
        ...base,
        detailLines: [item.content.usage, item.content.exampleJp, item.content.exampleVi],
        relatedChips: [],
        bridgeText: null,
        audioText: item.content.exampleJp,
      };
    case 'hiragana':
    case 'katakana':
      return { ...base, detailLines: [item.content.tip], relatedChips: [], bridgeText: null };
  }
}

/** Chuỗi dọc: bộ thủ ↓ kanji ↓ từ ↓ câu. Trả về mảng rỗng nếu không đủ hai nút. */
export function buildKnowledgeChain(item: KnowledgeItem, catalog: KnowledgeCatalog): ChainNode[] {
  const nodes: ChainNode[] = [];
  if (item.type === 'vocabulary') {
    const kanji = kanjiInVocabulary(catalog, item.content)[0];
    if (kanji) nodes.push({ face: kanji.character, caption: `${kanji.hanViet} · ${kanji.meaning}` });
    nodes.push({ face: item.face, caption: item.content.kana });
    const grammar = grammarUsingVocabulary(catalog, item.content)[0];
    if (grammar) nodes.push({ face: grammar.exampleJp, caption: grammar.exampleVi });
  } else if (item.type === 'kanji') {
    const radical = radicalsOfKanji(catalog, item.content)[0];
    if (radical) nodes.push({ face: primaryRadicalGlyph(radical.radical), caption: `Bộ ${radical.meaning.toLowerCase()}` });
    nodes.push({ face: item.face, caption: `${item.content.hanViet} · ${item.content.meaning}` });
    const word = vocabularyContainingKanji(catalog, item.content)[0];
    if (word) nodes.push({ face: word.kanji || word.kana, caption: `${word.kana} · ${word.meaning}` });
  } else if (item.type === 'radical') {
    nodes.push({ face: item.face, caption: `Bộ ${item.meaning.toLowerCase()}` });
    const kanji = kanjiContainingRadical(catalog, item.content)[0];
    if (kanji) {
      nodes.push({ face: kanji.character, caption: `${kanji.hanViet} · ${kanji.meaning}` });
      const word = vocabularyContainingKanji(catalog, kanji)[0];
      if (word) nodes.push({ face: word.kanji || word.kana, caption: word.meaning });
    }
  }
  return nodes.length >= 2 ? nodes : [];
}

const DEFAULT_HINT = 'Thử đọc to lên một lần — tay và miệng nhớ nhanh hơn mắt.';

export function buildRescueHint(item: KnowledgeItem, catalog: KnowledgeCatalog): RescueHint {
  switch (item.type) {
    case 'vocabulary':
      return {
        hintText: item.content.tip || DEFAULT_HINT,
        parts: kanjiInVocabulary(catalog, item.content).map((kanji) => ({ face: kanji.character, label: firstMeaning(kanji.meaning).toLowerCase() })),
      };
    case 'kanji':
      return {
        hintText: item.content.tip || DEFAULT_HINT,
        parts: radicalsOfKanji(catalog, item.content).map((radical) => ({ face: primaryRadicalGlyph(radical.radical), label: radical.meaning.toLowerCase() })),
      };
    case 'grammar':
      return { hintText: item.content.usage || DEFAULT_HINT, parts: [] };
    default:
      return { hintText: item.content.tip || DEFAULT_HINT, parts: [] };
  }
}

/** Một câu thật có chứa kiến thức — "gặp trong câu là cách giữ lại lâu nhất". */
export function buildContextSentence(item: KnowledgeItem, catalog: KnowledgeCatalog, journeyDay: number): ContextSentence {
  if (item.type === 'vocabulary') {
    const grammar = grammarUsingVocabulary(catalog, item.content)[0];
    if (grammar) return { sentenceJp: grammar.exampleJp, translationVi: grammar.exampleVi };
    return { sentenceJp: `わたしは ${item.content.kana} です。`, translationVi: `Tôi là ${item.meaning.toLowerCase()}.` };
  }
  if (item.type === 'kanji') {
    return { sentenceJp: item.content.words.split('・')[0].trim(), translationVi: `Từ ghép thường gặp của ${item.content.hanViet}.` };
  }
  if (item.type === 'grammar') {
    return { sentenceJp: item.content.exampleJp, translationVi: item.content.exampleVi };
  }
  const learnedGrammar = catalog.content.grammar.filter((pattern) => (pattern.day ?? 99) <= journeyDay);
  const fallback = pickDeterministic(learnedGrammar.length ? learnedGrammar : catalog.content.grammar, 1, `context:${item.key}`)[0];
  return { sentenceJp: fallback.exampleJp, translationVi: fallback.exampleVi };
}
