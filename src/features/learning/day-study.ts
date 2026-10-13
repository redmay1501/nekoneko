import type { MemoryView } from '@/features/memory/memory-types';
import { buildDayPlan } from '@/features/roadmap/day-plan';
import type { JourneyPosition } from '@/features/roadmap/journey-progress';
import { canRomanize, kanjiReadingRomaji, patternRomaji, sentenceRomaji, vocabularyRomaji } from '@/lib/utils/romaji';
import { primaryRadicalGlyph, itemsOfType, type KnowledgeCatalog } from './knowledge-catalog';
import { pickContextExample } from './context-index';
import { kanjiContainingRadical, radicalsOfKanji } from './knowledge-relations';
import { type ContentKey, toContentKey } from './knowledge-types';
import { type KanjiWord, kanjiReadingList, parseKanjiWords } from './study-grading';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  HỌC THEO NGÀY — dữ liệu cho /lo-trinh/ngay/[day]/hoc
 * ═══════════════════════════════════════════════════════════════════
 *  Bốn bước theo thứ tự: Từ vựng → Ngữ pháp → Kanji → Ôn tập. Server dựng sẵn mọi thẻ + "kho nhiễu" (đáp án sai
 *  hợp lý, lấy từ những ngày gần nhất) để trình duyệt tự tạo câu hỏi mới mỗi lần làm lại mà không gọi server.
 *  Chỉ dữ liệu thuần (serializable) — truyền thẳng vào component client.
 * ═══════════════════════════════════════════════════════════════════
 */

export interface StudyVocabCard {
  key: ContentKey;
  face: string;
  kana: string;
  kanji: string;
  romaji: string;
  meaning: string;
  tip: string;
  /** Câu ví dụ thật (Tatoeba / câu mẫu) — chỉ có khi tìm được câu chứa từ này. */
  example: { jp: string; vi: string; romaji: string } | null;
}

export interface StudyGrammarExample {
  jp: string;
  reading: string;
  romaji: string;
  vi: string;
}

export interface StudyGrammarCard {
  key: ContentKey;
  pattern: string;
  romaji: string;
  meaning: string;
  whenToUse: string;
  commonMistake: string;
  examples: StudyGrammarExample[];
}

export interface StudyRadicalCard {
  key: ContentKey;
  glyph: string;
  name: string;
  meaning: string;
  tip: string;
  /** Kanji (trong app) chứa bộ này — bộ thủ là công cụ nhận ra / nhớ chữ, không thay cho việc học chữ. */
  kanji: Array<{ character: string; meaning: string }>;
}

export interface StudyKanjiCard {
  key: ContentKey;
  character: string;
  hanViet: string;
  meaning: string;
  onReading: string;
  kunReading: string;
  readingRomaji: string;
  readings: string[];
  strokes: number | null;
  words: KanjiWord[];
  /** Bộ thủ tạo nên chữ (gợi ý ghi nhớ). */
  radicals: Array<{ glyph: string; meaning: string }>;
  /** Từ vựng trong app có chứa chữ này. */
  relatedVocab: Array<{ face: string; kana: string; meaning: string }>;
  tip: string;
}

/** Đáp án sai hợp lý cho câu hỏi trắc nghiệm (kiến thức của các ngày gần nhất). */
export interface StudyDistractors {
  vocab: Array<{ face: string; kana: string; meaning: string }>;
  kanji: Array<{ character: string; meaning: string; readings: string[]; words: KanjiWord[] }>;
  grammar: Array<{ jp: string; vi: string }>;
  radicals: Array<{ glyph: string; meaning: string }>;
}

export interface DayStudyData {
  day: number;
  title: string;
  vocab: StudyVocabCard[];
  grammar: StudyGrammarCard[];
  radicals: StudyRadicalCard[];
  kanji: StudyKanjiCard[];
  distractors: StudyDistractors;
  /** Số mục đã gặp (đã học) theo từng bước — tiến độ hiện trên thanh bước. */
  learned: Record<'vocab' | 'grammar' | 'radical' | 'kanji', number>;
  /** Mục của ngày, yếu nhất trước (điểm trí nhớ thấp / chưa học) — nguồn cho bước Ôn tập. */
  weakestKeys: ContentKey[];
}

const VOCAB_DISTRACTORS = 40;
const KANJI_DISTRACTORS = 24;
const GRAMMAR_DISTRACTORS = 14;
const RADICAL_DISTRACTORS = 12;

/** Gần ngày `day` nhất trước (ngày đã học quanh đó), loại mục của chính ngày. */
function nearest<T extends { day: number | null }>(items: readonly T[], day: number, limit: number): T[] {
  return items
    .filter((item) => item.day !== null && item.day !== day)
    .sort((left, right) => Math.abs((left.day ?? 0) - day) - Math.abs((right.day ?? 0) - day))
    .slice(0, limit);
}

export function buildDayStudy(
  catalog: KnowledgeCatalog,
  day: number,
  journey: JourneyPosition,
  memoryViews: ReadonlyMap<ContentKey, MemoryView>,
): DayStudyData {
  const plan = buildDayPlan(catalog, day, journey);
  const { knowledge } = plan;
  const { content } = catalog;

  const vocab = knowledge.vocabulary.map((word): StudyVocabCard => {
    const key = toContentKey('vocabulary', word.id);
    const item = catalog.byKey.get(key);
    const found = item ? pickContextExample(catalog, item, memoryViews) : null;
    return {
      key, face: word.kanji || word.kana, kana: word.kana, kanji: word.kanji, romaji: vocabularyRomaji(word),
      meaning: word.meaning, tip: word.tip,
      example: found ? { jp: found.jp, vi: found.vi, romaji: canRomanize(found.jp) ? sentenceRomaji(found.jp) : '' } : null,
    };
  });

  const grammar = knowledge.grammar.map((pattern): StudyGrammarCard => {
    const example = (jp: string, reading: string, vi: string): StudyGrammarExample => ({
      jp, reading: reading && reading !== jp ? reading : '', vi,
      romaji: canRomanize(reading || jp) ? sentenceRomaji(reading || jp) : '',
    });
    return {
      key: toContentKey('grammar', pattern.id), pattern: pattern.pattern, romaji: patternRomaji(pattern.pattern) ?? '',
      meaning: pattern.usage, whenToUse: pattern.whenToUse, commonMistake: pattern.commonMistake,
      examples: [
        example(pattern.exampleJp, pattern.exampleReading, pattern.exampleVi),
        ...(pattern.example2Jp ? [example(pattern.example2Jp, pattern.example2Reading, pattern.example2Vi)] : []),
      ],
    };
  });

  const radicals = knowledge.radicals.map((radical): StudyRadicalCard => ({
    key: toContentKey('radical', radical.id), glyph: primaryRadicalGlyph(radical.radical),
    name: radical.nameJp.split(' / ')[0], meaning: radical.meaning, tip: radical.tip,
    kanji: kanjiContainingRadical(catalog, radical).slice(0, 6).map((entry) => ({ character: entry.character, meaning: entry.meaning })),
  }));

  const kanji = knowledge.kanji.map((entry): StudyKanjiCard => ({
    key: toContentKey('kanji', entry.id), character: entry.character, hanViet: entry.hanViet, meaning: entry.meaning,
    onReading: entry.onReading, kunReading: entry.kunReading, readingRomaji: kanjiReadingRomaji(entry.onReading, entry.kunReading),
    readings: kanjiReadingList(entry), strokes: entry.strokes, words: parseKanjiWords(entry.words), tip: entry.tip,
    radicals: radicalsOfKanji(catalog, entry).map((radical) => ({ glyph: primaryRadicalGlyph(radical.radical), meaning: radical.meaning })),
    relatedVocab: content.vocabulary.filter((word) => word.kanji.includes(entry.character)).slice(0, 4)
      .map((word) => ({ face: word.kanji, kana: word.kana, meaning: word.meaning })),
  }));

  const studyKeys: ContentKey[] = [...vocab, ...grammar, ...radicals, ...kanji].map((card) => card.key);
  const countLearned = (cards: Array<{ key: ContentKey }>) => cards.filter((card) => memoryViews.get(card.key)?.isLearned).length;
  const strength = (key: ContentKey) => {
    const view = memoryViews.get(key);
    return view?.isLearned ? view.memoryScore : -1;
  };

  return {
    day,
    title: plan.journeyDay.title,
    vocab, grammar, radicals, kanji,
    distractors: {
      vocab: nearest(content.vocabulary, day, VOCAB_DISTRACTORS).map((word) => ({ face: word.kanji || word.kana, kana: word.kana, meaning: word.meaning })),
      kanji: nearest(content.kanji, day, KANJI_DISTRACTORS).map((entry) => ({
        character: entry.character, meaning: entry.meaning, readings: kanjiReadingList(entry), words: parseKanjiWords(entry.words),
      })),
      grammar: nearest(itemsOfType(catalog, 'grammar'), day, GRAMMAR_DISTRACTORS).flatMap((item) => [
        { jp: item.content.exampleJp, vi: item.content.exampleVi },
        ...(item.content.example2Jp ? [{ jp: item.content.example2Jp, vi: item.content.example2Vi }] : []),
      ]),
      radicals: nearest(content.radicals, day, RADICAL_DISTRACTORS).map((radical) => ({ glyph: primaryRadicalGlyph(radical.radical), meaning: radical.meaning })),
    },
    learned: { vocab: countLearned(vocab), grammar: countLearned(grammar), radical: countLearned(radicals), kanji: countLearned(kanji) },
    weakestKeys: [...studyKeys].sort((left, right) => strength(left) - strength(right)),
  };
}
