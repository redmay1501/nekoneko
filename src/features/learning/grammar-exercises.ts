import type { GrammarContent } from '@/types/content';
import { orderTokens } from './day-study-quiz';
import { lessonNumber } from '@/lib/utils/lesson';

/**
 * Bài tập ngữ pháp sinh từ DỮ LIỆU THẬT của mỗi mẫu (câu ví dụ + câu ví dụ 2, cách dùng, lỗi hay gặp) — không bịa câu mới.
 * Mỗi câu ví dụ cho tối đa 4 dạng: Nhật → Việt, Việt → Nhật, chọn trợ từ (chỉ khi trợ từ nằm trong chính mẫu câu),
 * sắp xếp câu (≥ 3 mảnh). Lời giải thích lấy từ cách dùng / lỗi hay gặp của mẫu; đáp án sai được giải thích bằng
 * mẫu câu mà nó thuộc về. Mỗi mẫu hiện có 2 câu ví dụ → tối đa 8 bài; muốn ~10 bài/mẫu cần soạn thêm câu ví dụ
 * (xem docs/GRAMMAR_EXERCISES.md).
 */

export type GrammarExerciseKind = 'nhat-viet' | 'viet-nhat' | 'tro-tu' | 'sap-xep';

export const GRAMMAR_EXERCISE_KINDS: ReadonlyArray<{ id: GrammarExerciseKind; label: string }> = [
  { id: 'nhat-viet', label: 'Chọn nghĩa' },
  { id: 'viet-nhat', label: 'Chọn câu tiếng Nhật' },
  { id: 'tro-tu', label: 'Chọn trợ từ' },
  { id: 'sap-xep', label: 'Sắp xếp câu' },
];

export interface GrammarExerciseOption {
  text: string;
  /** Mẫu câu mà lựa chọn này thuộc về (để giải thích vì sao sai). Rỗng với trợ từ. */
  fromPattern: string;
}

export interface GrammarExercise {
  id: string;
  grammarId: number;
  lesson: number;
  pattern: string;
  kind: GrammarExerciseKind;
  /** Câu hỏi hiển thị (câu tiếng Nhật, câu tiếng Việt, hoặc câu có chỗ trống ＿＿). */
  prompt: string;
  isPromptJapanese: boolean;
  /** Dạng chọn đáp án; rỗng với "sap-xep". */
  options: GrammarExerciseOption[];
  /** Đáp án đúng (với "sap-xep": cả câu ghép lại, không khoảng trắng). */
  answer: string;
  /** Mảnh để sắp xếp (đúng thứ tự). */
  tokens: string[];
  /** Câu gốc để nghe lại / xem lại sau khi trả lời. */
  sentence: { jp: string; reading: string; vi: string };
  /** Vì sao đáp án đúng — từ cách dùng của mẫu (+ lỗi hay gặp nếu có). */
  explanation: string;
}

const OPTION_COUNT = 4;
const MIN_ORDER_PIECES = 3;

/**
 * Trợ từ gây nhiễu cho từng trợ từ đúng — chỉ những trợ từ CHẮC CHẮN sai ở vị trí đó trong câu N5 (tránh cặp có thể
 * cùng đúng như へ/に, は/が, と/が, も/は).
 */
const PARTICLE_DISTRACTORS: Record<string, readonly string[]> = {
  'は': ['を', 'に', 'で'],
  'が': ['を', 'で', 'へ'],
  'を': ['が', 'に', 'へ'],
  'に': ['を', 'で', 'が'],
  'で': ['を', 'へ', 'が'],
  'へ': ['を', 'で', 'が'],
  'と': ['を', 'で', 'へ'],
  'も': ['を', 'で', 'へ'],
  'の': ['を', 'で', 'へ'],
  'から': ['を', 'で', 'へ'],
  'まで': ['を', 'で', 'へ'],
  'や': ['を', 'で', 'へ'],
};
/** Trợ từ dài trước để "から" không bị nhận nhầm. */
const PARTICLES = Object.keys(PARTICLE_DISTRACTORS).sort((left, right) => right.length - left.length);
const BLANK = '＿＿';

interface SentenceSource {
  grammar: GrammarContent;
  lesson: number;
  index: number;
  jp: string;
  reading: string;
  vi: string;
}

function sentencesOf(grammar: GrammarContent): SentenceSource[] {
  const lesson = lessonNumber(grammar.lesson);
  const list: SentenceSource[] = [];
  if (grammar.exampleJp && grammar.exampleVi) list.push({ grammar, lesson, index: 0, jp: grammar.exampleJp, reading: grammar.exampleReading, vi: grammar.exampleVi });
  if (grammar.example2Jp && grammar.example2Vi) list.push({ grammar, lesson, index: 1, jp: grammar.example2Jp, reading: grammar.example2Reading, vi: grammar.example2Vi });
  return list;
}

/** Số ngẫu nhiên tất định từ chuỗi — cùng bài, cùng seed thì cùng đề (test được, tải lại không nhảy đáp án). */
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.codePointAt(0)!, 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function explanationOf(grammar: GrammarContent): string {
  const parts = [`Mẫu “${grammar.pattern}”: ${grammar.usage}`];
  if (grammar.commonMistake) parts.push(`Lưu ý: ${grammar.commonMistake}`);
  return parts.join(' ');
}

/** Đáp án nhiễu: câu của MẪU KHÁC, ưu tiên cùng bài rồi bài gần nhất — khác hẳn đáp án đúng. */
function distractorSentences(source: SentenceSource, pool: readonly SentenceSource[], pick: (sentence: SentenceSource) => string, random: () => number): GrammarExerciseOption[] {
  const correct = pick(source);
  const candidates = pool
    .filter((other) => other.grammar.id !== source.grammar.id && pick(other) !== correct)
    .map((other) => ({ other, distance: Math.abs(other.lesson - source.lesson) + random() * 0.5 }))
    .sort((left, right) => left.distance - right.distance);
  const seen = new Set([correct]);
  const options: GrammarExerciseOption[] = [];
  for (const { other } of candidates) {
    const text = pick(other);
    if (seen.has(text)) continue;
    seen.add(text);
    options.push({ text, fromPattern: other.grammar.pattern });
    if (options.length === OPTION_COUNT - 1) break;
  }
  return options;
}

/** Trợ từ của mẫu câu (các mảnh trong mẫu trùng đúng một trợ từ). */
function patternParticles(pattern: string): string[] {
  const pieces = pattern.split(/[\s/（）()〜~・、,]+/).filter(Boolean);
  return PARTICLES.filter((particle) => pieces.includes(particle));
}

/**
 * Câu có chỗ trống cho trợ từ: chỉ khi câu có ĐÚNG MỘT cụm (cách nhau bởi khoảng trắng) kết thúc bằng trợ từ đó —
 * tránh hỏi mơ hồ. Trả về câu có chỗ trống hoặc null.
 */
export function blankParticle(sentence: string, particle: string): string | null {
  const chunks = sentence.split(/(\s+)/);
  const hits = chunks.map((chunk, index) => ({ chunk, index }))
    .filter(({ chunk }) => chunk.length > particle.length && chunk.endsWith(particle) && !/\s/.test(chunk));
  if (hits.length !== 1) return null;
  const { chunk, index } = hits[0];
  const copy = [...chunks];
  copy[index] = chunk.slice(0, -particle.length) + BLANK;
  return copy.join('');
}

export function buildGrammarExercises(grammar: readonly GrammarContent[], seed = 'grammar'): GrammarExercise[] {
  const pool = grammar.flatMap(sentencesOf);
  const exercises: GrammarExercise[] = [];
  for (const source of pool) {
    const { grammar: point } = source;
    const random = seededRandom(`${seed}:${point.id}:${source.index}`);
    const base = {
      grammarId: point.id, lesson: source.lesson, pattern: point.pattern, tokens: [] as string[],
      sentence: { jp: source.jp, reading: source.reading, vi: source.vi }, explanation: explanationOf(point),
    };
    const id = (kind: GrammarExerciseKind) => `${point.id}:${source.index}:${kind}`;

    const viOptions = distractorSentences(source, pool, (sentence) => sentence.vi, random);
    if (viOptions.length === OPTION_COUNT - 1) {
      exercises.push({ ...base, id: id('nhat-viet'), kind: 'nhat-viet', prompt: source.jp, isPromptJapanese: true, answer: source.vi,
        options: shuffled([{ text: source.vi, fromPattern: point.pattern }, ...viOptions], random) });
    }
    const jpOptions = distractorSentences(source, pool, (sentence) => sentence.jp, random);
    if (jpOptions.length === OPTION_COUNT - 1) {
      exercises.push({ ...base, id: id('viet-nhat'), kind: 'viet-nhat', prompt: source.vi, isPromptJapanese: false, answer: source.jp,
        options: shuffled([{ text: source.jp, fromPattern: point.pattern }, ...jpOptions], random) });
    }
    for (const particle of patternParticles(point.pattern)) {
      const blanked = blankParticle(source.jp, particle);
      if (!blanked) continue;
      exercises.push({ ...base, id: `${id('tro-tu')}:${particle}`, kind: 'tro-tu', prompt: blanked, isPromptJapanese: true, answer: particle,
        options: shuffled([particle, ...PARTICLE_DISTRACTORS[particle]].map((text) => ({ text, fromPattern: '' })), random),
        explanation: `Mẫu “${point.pattern}” dùng trợ từ ${particle}. ${point.usage}${point.commonMistake ? ` Lưu ý: ${point.commonMistake}` : ''}` });
      break; // một câu hỏi trợ từ mỗi câu ví dụ
    }
    const tokens = orderTokens(source.jp);
    if (tokens.length >= MIN_ORDER_PIECES) {
      exercises.push({ ...base, id: id('sap-xep'), kind: 'sap-xep', prompt: source.vi, isPromptJapanese: false, answer: tokens.join(''), tokens, options: [] });
    }
  }
  return exercises;
}

/** Bài tập của một bài Minna (hoặc một mẫu câu), xếp xen kẽ các dạng — cùng seed thì cùng thứ tự. */
export function exercisesFor(all: readonly GrammarExercise[], filter: { lesson?: number; grammarId?: number }, seed = 'order'): GrammarExercise[] {
  const picked = all.filter((exercise) => (filter.grammarId === undefined || exercise.grammarId === filter.grammarId)
    && (filter.lesson === undefined || exercise.lesson === filter.lesson));
  return shuffled(picked, seededRandom(`${seed}:${filter.lesson ?? ''}:${filter.grammarId ?? ''}`));
}

/** Chấm một câu trả lời. Câu bỏ trống (null) luôn sai. */
export function isExerciseCorrect(exercise: GrammarExercise, answer: string | null): boolean {
  if (answer === null) return false;
  return exercise.kind === 'sap-xep' ? answer.replace(/\s+/g, '') === exercise.answer : answer === exercise.answer;
}

/** Vì sao lựa chọn sai không hợp: thuộc mẫu khác / trợ từ khác chức năng. */
export function whyWrong(exercise: GrammarExercise, chosen: string): string | null {
  if (isExerciseCorrect(exercise, chosen)) return null;
  if (exercise.kind === 'tro-tu') return `${chosen} không đúng chức năng ở vị trí này — mẫu “${exercise.pattern}” cần ${exercise.answer}.`;
  if (exercise.kind === 'sap-xep') return 'Thứ tự các mảnh chưa đúng — so với câu mẫu bên dưới.';
  const option = exercise.options.find((entry) => entry.text === chosen);
  return option?.fromPattern ? `Lựa chọn này là câu của mẫu “${option.fromPattern}” — nghĩa khác câu đang hỏi.` : null;
}
