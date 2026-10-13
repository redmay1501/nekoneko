import { shuffle } from '@/features/games/match-game';
import { normalizeJapanese } from '@/lib/utils/japanese-text';
import { WORDS_ENDING_LIKE_PARTICLES } from '@/lib/utils/romaji';
import type { DayStudyData, StudyGrammarCard, StudyKanjiCard, StudyRadicalCard, StudyVocabCard } from './day-study';
import type { ContentKey } from './knowledge-types';
import { type StudyAsk, readingKey } from './study-grading';

/**
 * Câu hỏi của luồng học theo ngày — dựng trong trình duyệt từ dữ liệu server gửi sẵn (đổi thứ tự / đáp án mỗi lần làm lại).
 * Server vẫn chấm lại khi ghi trí nhớ (/api/study/answer); ở đây chỉ để hiện đúng / sai ngay.
 */
export interface StudyQuestion {
  id: string;
  contentKey: ContentKey;
  ask: StudyAsk;
  prompt: string;
  promptIsJapanese: boolean;
  /** Dòng nhỏ dưới câu hỏi (gợi ý, kiểu câu hỏi). */
  hint?: string;
  /** Câu hỏi "từ ghép → cách đọc": từ ghép gửi kèm cho server chấm. */
  wordPrompt?: string;
  /** Rỗng = câu gõ (kana). */
  options: string[];
  /** Nhãn hiển thị của từng lựa chọn (mặc định là chính giá trị). */
  optionLabels?: Record<string, string>;
  optionsAreJapanese: boolean;
  answer: string;
  /** Câu gõ: các đáp án chấp nhận. */
  accepted?: string[];
  audioText?: string;
}

/** Bốn bước của luồng học theo ngày, đúng thứ tự học. */
export const STUDY_STEPS = [
  { id: 'tu-vung', label: 'Từ vựng', icon: '語' },
  { id: 'ngu-phap', label: 'Ngữ pháp', icon: '文' },
  { id: 'bo-thu', label: 'Bộ thủ', icon: '部' },
  { id: 'kanji', label: 'Kanji', icon: '漢' },
  { id: 'on-tap', label: 'Ôn tập', icon: '🔁' },
] as const;
export type StudyStepId = (typeof STUDY_STEPS)[number]['id'];

export const VOCAB_QUIZZES = [
  { id: 'nghia', label: 'Nhật → Việt', icon: '🇯🇵' },
  { id: 'tu', label: 'Việt → Nhật', icon: '🇻🇳' },
  { id: 'ghep', label: 'Ghép cặp', icon: '🧩' },
  { id: 'go', label: 'Gõ kana', icon: '⌨️' },
] as const;
export const GRAMMAR_QUIZZES = [
  { id: 'viet-nhat', label: 'Việt → Nhật', icon: '🇻🇳' },
  { id: 'nhat-viet', label: 'Nhật → Việt', icon: '🇯🇵' },
  { id: 'sap-xep', label: 'Sắp xếp câu', icon: '🔀' },
  { id: 'tu-viet', label: 'Tự viết câu', icon: '✍️' },
] as const;
export const RADICAL_QUIZZES = [
  { id: 'nghia', label: 'Bộ → nghĩa', icon: '部' },
] as const;
export const KANJI_QUIZZES = [
  { id: 'nghia', label: 'Chữ → nghĩa', icon: '漢' },
  { id: 'chu', label: 'Nghĩa → chữ', icon: '🔎' },
  { id: 'doc', label: 'Cách đọc', icon: '🔊' },
  { id: 'tu-ghep', label: 'Đọc từ ghép', icon: '📖' },
] as const;

export type VocabQuizId = (typeof VOCAB_QUIZZES)[number]['id'];
export type GrammarQuizId = (typeof GRAMMAR_QUIZZES)[number]['id'];
export type KanjiQuizId = (typeof KANJI_QUIZZES)[number]['id'];

const OPTION_COUNT = 4;

/** Đúng + tối đa 3 đáp án sai khác nhau (bỏ những cái `isSame` với đáp án đúng), xáo thứ tự. */
export function pickOptions(correct: string, candidates: readonly string[], random: () => number, isSame: (value: string) => boolean = (value) => value === correct): string[] {
  const wrong = [...new Set(shuffle(candidates, random))].filter((value) => value && !isSame(value)).slice(0, OPTION_COUNT - 1);
  return shuffle([correct, ...wrong], random);
}

export function buildVocabQuiz(data: DayStudyData, kind: Exclude<VocabQuizId, 'ghep'>, cards: readonly StudyVocabCard[] = data.vocab, random = Math.random): StudyQuestion[] {
  const pool = [...data.vocab, ...data.distractors.vocab];
  return shuffle(cards, random).map((card) => {
    const base = { id: `${kind}:${card.key}`, contentKey: card.key, audioText: card.kana };
    if (kind === 'nghia') {
      return { ...base, ask: 'meaning', prompt: card.face, promptIsJapanese: true, hint: card.kanji ? card.kana : undefined,
        options: pickOptions(card.meaning, pool.map((word) => word.meaning), random), optionsAreJapanese: false, answer: card.meaning };
    }
    if (kind === 'tu') {
      const labels = Object.fromEntries(pool.map((word) => [word.face, word.face === word.kana ? word.kana : `${word.face}（${word.kana}）`]));
      return { ...base, ask: 'face', prompt: card.meaning, promptIsJapanese: false, audioText: undefined,
        options: pickOptions(card.face, pool.map((word) => word.face), random), optionLabels: labels, optionsAreJapanese: true, answer: card.face };
    }
    return { ...base, ask: 'reading', prompt: card.meaning, promptIsJapanese: false, audioText: undefined,
      hint: card.kanji ? `Gõ cách đọc của ${card.kanji} bằng kana` : 'Gõ từ này bằng kana',
      options: [], optionsAreJapanese: true, answer: card.kana, accepted: [card.kana, card.kanji].filter(Boolean) };
  });
}

export function buildGrammarQuiz(data: DayStudyData, kind: 'viet-nhat' | 'nhat-viet', cards: readonly StudyGrammarCard[] = data.grammar, random = Math.random): StudyQuestion[] {
  const pool = [...data.grammar.flatMap((card) => card.examples), ...data.distractors.grammar];
  return shuffle(cards.flatMap((card) => card.examples.map((example, index) => ({ card, example, index }))), random).map(({ card, example, index }) => {
    const own = card.examples.map((other) => other.jp);
    const ownVi = card.examples.map((other) => other.vi);
    const base = { id: `${kind}:${card.key}:${index}`, contentKey: card.key, hint: `Mẫu ${card.pattern}` };
    return kind === 'viet-nhat'
      ? { ...base, ask: 'vi-to-jp' as const, prompt: example.vi, promptIsJapanese: false,
        options: pickOptions(example.jp, pool.map((other) => other.jp), random, (value) => own.includes(value)), optionsAreJapanese: true, answer: example.jp }
      : { ...base, ask: 'jp-to-vi' as const, prompt: example.jp, promptIsJapanese: true, audioText: example.reading || example.jp,
        options: pickOptions(example.vi, pool.map((other) => other.vi), random, (value) => ownVi.includes(value)), optionsAreJapanese: false, answer: example.vi };
  });
}

export function buildKanjiQuiz(data: DayStudyData, kind: KanjiQuizId, cards: readonly StudyKanjiCard[] = data.kanji, random = Math.random): StudyQuestion[] {
  const pool = [...data.kanji, ...data.distractors.kanji];
  return shuffle(cards, random).flatMap((card): StudyQuestion[] => {
    const base = { id: `${kind}:${card.key}`, contentKey: card.key };
    if (kind === 'nghia') {
      return [{ ...base, ask: 'meaning', prompt: card.character, promptIsJapanese: true,
        options: pickOptions(card.meaning, pool.map((other) => other.meaning), random), optionsAreJapanese: false, answer: card.meaning }];
    }
    if (kind === 'chu') {
      return [{ ...base, ask: 'face', prompt: card.meaning, promptIsJapanese: false, hint: card.hanViet,
        options: pickOptions(card.character, pool.map((other) => other.character), random), optionsAreJapanese: true, answer: card.character }];
    }
    if (kind === 'doc') {
      if (!card.readings.length) return [];
      const own = new Set(card.readings.map(readingKey));
      const correct = card.readings[Math.floor(random() * card.readings.length)];
      return [{ ...base, ask: 'reading', prompt: card.character, promptIsJapanese: true, hint: 'Chữ này đọc là…',
        options: pickOptions(correct, pool.flatMap((other) => other.readings), random, (value) => own.has(readingKey(value))),
        optionsAreJapanese: true, answer: correct }];
    }
    if (!card.words.length) return [];
    const word = card.words[Math.floor(random() * card.words.length)];
    const own = new Set(card.words.filter((other) => other.word === word.word).map((other) => readingKey(other.reading)));
    return [{ ...base, id: `${kind}:${card.key}:${word.word}`, ask: 'word-reading', prompt: word.word, promptIsJapanese: true,
      hint: `${word.meaning} — đọc là…`, wordPrompt: word.word, audioText: word.reading,
      options: pickOptions(word.reading, pool.flatMap((other) => other.words.map((entry) => entry.reading)), random, (value) => own.has(readingKey(value))),
      optionsAreJapanese: true, answer: word.reading }];
  });
}

/** Bộ thủ: nhìn bộ → chọn nghĩa. Ghi vào trí nhớ của BỘ THỦ (không phải Kanji). */
export function buildRadicalQuiz(data: DayStudyData, cards: readonly StudyRadicalCard[] = data.radicals, random = Math.random): StudyQuestion[] {
  const pool = [...data.radicals, ...data.distractors.radicals];
  return shuffle(cards, random).map((card) => ({
    id: `bo-thu:${card.key}`, contentKey: card.key, ask: 'meaning' as const, prompt: card.glyph, promptIsJapanese: true, hint: 'Bộ này nghĩa là…',
    options: pickOptions(card.meaning, pool.map((other) => other.meaning), random), optionsAreJapanese: false, answer: card.meaning,
  }));
}

/** Đuôi tách thành mảnh riêng khi sắp xếp câu (dài trước). */
const SPLIT_ENDINGS = ['ですか', 'ません', 'から', 'まで', 'です', 'ます', 'は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の', 'か', 'ね', 'よ'];
/** Từ tự nó kết thúc giống trợ từ — không tách (thêm vào danh sách chung của phần phiên âm). */
const WHOLE_WORDS = new Set(['なに', 'なん', 'どこ', 'だれ', 'いつ', 'ほんとうに', 'いっしょに', 'すぐに', 'ここ', 'そこ', 'あそこ', 'でも', 'あの', 'その', 'この', 'どの', 'から', 'まで', 'です', 'ます', 'ません']);
const isWholeWord = (chunk: string) => WHOLE_WORDS.has(chunk) || WORDS_ENDING_LIKE_PARTICLES.has(normalizeJapanese(chunk, { foldKatakana: true }));

function splitChunk(chunk: string): string[] {
  if (isWholeWord(chunk)) return [chunk];
  const ending = SPLIT_ENDINGS.find((end) => chunk.endsWith(end) && chunk.length > end.length);
  if (!ending) return [chunk];
  const stem = chunk.slice(0, -ending.length);
  // "ですか" → "です" + "か"; "ましたか"… giữ nguyên phần chia động từ, chỉ tách trợ từ cuối.
  if (ending === 'ですか') return [...splitChunk(stem), 'です', 'か'];
  if (/^(ます|ません)$/.test(ending)) return [chunk];
  return [...splitChunk(stem), ending];
}

/**
 * Câu sắp xếp: chia câu ví dụ thành các mảnh (cụm cách nhau bởi khoảng trắng, tách thêm trợ từ cuối và です / か).
 * Đúng = ghép lại khớp câu gốc (bỏ khoảng trắng) — mảnh trùng nhau đổi chỗ vẫn đúng. Dưới 3 mảnh thì không dùng.
 */
export function orderTokens(sentence: string): string[] {
  return sentence.replace(/[。？！?!]$/, '').split(/\s+/).filter(Boolean).flatMap(splitChunk);
}
