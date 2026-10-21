import type { GrammarContent } from '@/types/content';
import rawQuestionBank from '@content/seed/grammar-question-bank.json';
import { orderTokens } from './day-study-quiz';
import { lessonNumber } from '@/lib/utils/lesson';

/**
 * Bài tập ngữ pháp sinh từ DỮ LIỆU THẬT của mỗi mẫu (câu ví dụ + câu ví dụ 2, cách dùng, lỗi hay gặp) — không bịa câu mới.
 * Mỗi câu ví dụ cho tối đa 4 dạng: Nhật → Việt, Việt → Nhật, chọn trợ từ (chỉ khi trợ từ nằm trong chính mẫu câu),
 * sắp xếp câu (≥ 3 mảnh). Lời giải thích lấy từ cách dùng / lỗi hay gặp của mẫu; đáp án sai được giải thích bằng
 * mẫu câu mà nó thuộc về. Mỗi mẫu hiện có 2 câu ví dụ → tối đa 8 bài; muốn ~10 bài/mẫu cần soạn thêm câu ví dụ
 * (xem docs/GRAMMAR_EXERCISES.md).
 */

export type GrammarExerciseKind = 'nhat-viet' | 'viet-nhat' | 'dien-tu' | 'tro-tu' | 'sap-xep';

export const GRAMMAR_EXERCISE_KINDS: ReadonlyArray<{ id: GrammarExerciseKind; label: string }> = [
  { id: 'nhat-viet', label: 'Chọn nghĩa' },
  { id: 'viet-nhat', label: 'Chọn câu tiếng Nhật' },
  { id: 'dien-tu', label: 'Điền từ / cấu trúc' },
];

export type GrammarQuestionBankKind = 'Nhật → Việt' | 'Việt → Nhật' | 'Điền cấu trúc/từ' | 'Điền từ theo câu';

export interface GrammarQuestionBankRow {
  id: string;
  grammarId: number;
  lessonLabel: string;
  pattern: string;
  kind: GrammarQuestionBankKind;
  prompt: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
  sentenceJp: string;
  sentenceVi: string;
  source: string;
  origin: string;
  reviewStatus: string;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(row: Record<string, unknown>, key: string, rowNumber: number, errors: string[]): string {
  const value = row[key];
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`Dòng ${rowNumber}: thiếu trường "${key}".`);
    return '';
  }
  return value;
}

/** Đọc và kiểm tra toàn bộ JSON chuyển nguyên trạng từ CSV; lỗi nào cũng làm dừng, không âm thầm bỏ dòng. */
export function buildGrammarQuestionBank(
  grammar: readonly GrammarContent[],
  sourceRows: readonly unknown[] = rawQuestionBank as unknown[],
): GrammarExercise[] {
  const errors: string[] = [];
  const grammarById = new Map(grammar.map((entry) => [entry.id, entry]));
  const ids = new Set<string>();
  const counts = new Map<number, number>();
  const parsed: GrammarQuestionBankRow[] = [];
  if (sourceRows.length !== grammar.length * 10) errors.push(`Ngân hàng có ${sourceRows.length} dòng; cần đúng ${grammar.length * 10} (10 câu × ${grammar.length} mẫu).`);

  sourceRows.forEach((value, index) => {
    const rowNumber = index + 1;
    if (!isRecord(value)) {
      errors.push(`Dòng ${rowNumber}: dữ liệu không phải object.`);
      return;
    }
    const id = requiredText(value, 'id', rowNumber, errors);
    const patternText = requiredText(value, 'pattern', rowNumber, errors);
    const lessonLabel = requiredText(value, 'lessonLabel', rowNumber, errors);
    const prompt = requiredText(value, 'prompt', rowNumber, errors);
    const answer = requiredText(value, 'answer', rowNumber, errors);
    const explanation = requiredText(value, 'explanation', rowNumber, errors);
    const sentenceJp = requiredText(value, 'sentenceJp', rowNumber, errors);
    const sentenceVi = requiredText(value, 'sentenceVi', rowNumber, errors);
    const source = requiredText(value, 'source', rowNumber, errors);
    const origin = requiredText(value, 'origin', rowNumber, errors);
    const reviewStatus = requiredText(value, 'reviewStatus', rowNumber, errors);
    const kind = value.kind;
    const grammarId = value.grammarId;
    const rowGrammar = typeof grammarId === 'number' ? grammarById.get(grammarId) : undefined;

    if (!/^G\d{3}-Q\d{2}$/.test(id)) errors.push(`${id || `Dòng ${rowNumber}`}: ID sai định dạng.`);
    if (ids.has(id)) errors.push(`${id}: ID bị trùng.`);
    ids.add(id);
    if (!Number.isInteger(grammarId) || !rowGrammar) errors.push(`${id}: không tìm thấy Mẫu ID ${String(grammarId)} trong nội dung ngữ pháp.`);
    if (rowGrammar) {
      counts.set(rowGrammar.id, (counts.get(rowGrammar.id) ?? 0) + 1);
      if (patternText !== rowGrammar.pattern) errors.push(`${id}: mẫu ngữ pháp không khớp ID ${rowGrammar.id}.`);
      const rowLesson = Number(lessonLabel.match(/^\s*BÀI\s*(\d+)/i)?.[1]);
      if (rowLesson !== lessonNumber(rowGrammar.lesson)) errors.push(`${id}: bài trong CSV không khớp mẫu ${rowGrammar.id}.`);
      if (!new RegExp(`^G${String(rowGrammar.id).padStart(3, '0')}-Q\\d{2}$`).test(id)) errors.push(`${id}: tiền tố ID không khớp mẫu ${rowGrammar.id}.`);
    }

    let normalizedKind: GrammarExerciseKind | null = null;
    if (kind === 'Nhật → Việt') normalizedKind = 'nhat-viet';
    else if (kind === 'Việt → Nhật') normalizedKind = 'viet-nhat';
    else if (kind === 'Điền cấu trúc/từ' || kind === 'Điền từ theo câu') normalizedKind = 'dien-tu';
    else errors.push(`${id || `Dòng ${rowNumber}`}: dạng bài không được hỗ trợ (${String(kind)}).`);

    const rawOptions = value.options;
    let options: [string, string, string, string] = ['', '', '', ''];
    if (!Array.isArray(rawOptions) || rawOptions.length !== 4 || rawOptions.some((option) => typeof option !== 'string' || !option.trim())) {
      errors.push(`${id || `Dòng ${rowNumber}`}: cần đúng 4 lựa chọn không rỗng.`);
    } else {
      options = rawOptions as [string, string, string, string];
      if (new Set(options).size !== 4) errors.push(`${id}: có lựa chọn trùng nhau.`);
      if (!options.includes(answer)) errors.push(`${id}: đáp án đúng không nằm trong 4 lựa chọn.`);
    }
    if (normalizedKind === 'dien-tu' && (prompt.match(/□|＿＿/g) ?? []).length !== 1) {
      errors.push(`${id}: câu điền phải có đúng một chỗ trống dạng □ hoặc ＿＿.`);
    }

    if (normalizedKind) parsed.push({
      id, grammarId: typeof grammarId === 'number' ? grammarId : -1, lessonLabel, pattern: patternText,
      kind: kind as GrammarQuestionBankKind, prompt, options, answer, explanation, sentenceJp, sentenceVi, source, origin, reviewStatus,
    });
  });

  for (const grammarId of grammarById.keys()) {
    const count = counts.get(grammarId) ?? 0;
    if (count !== 10) errors.push(`Mẫu ${grammarId}: có ${count} câu, cần đúng 10.`);
  }
  if (errors.length) throw new Error(`Ngân hàng câu hỏi ngữ pháp không hợp lệ:\n${errors.slice(0, 40).join('\n')}${errors.length > 40 ? `\n… và ${errors.length - 40} lỗi khác.` : ''}`);

  return parsed.map((row) => {
    const point = grammarById.get(row.grammarId)!;
    const kind = row.kind === 'Nhật → Việt' ? 'nhat-viet' : row.kind === 'Việt → Nhật' ? 'viet-nhat' : 'dien-tu';
    // Câu điền bản v2 có gợi ý nghĩa ở cuối: 「…＿＿…。（nghĩa）」 → bỏ phần gợi ý khi so với câu gốc.
    const completedPrompt = kind === 'dien-tu' ? row.prompt.replace(/（[^（）]*）\s*$/, '').replace(/□|＿＿/, row.answer) : row.sentenceJp;
    const sourceMatchesPrompt = completedPrompt.replace(/\s+/g, '') === row.sentenceJp.replace(/\s+/g, '');
    return {
      id: row.id, grammarId: row.grammarId, lesson: lessonNumber(point.lesson), pattern: row.pattern, kind,
      // Giữ nguyên nội dung nguồn trong JSON, chỉ trình bày chỗ trống bằng gạch dưới trong bài tập.
      prompt: row.prompt.replace(/□|＿＿/g, '___'), isPromptJapanese: kind !== 'viet-nhat',
      options: row.options.map((text) => ({ text, fromPattern: '' })), answer: row.answer, tokens: [],
      // After a fill answer, show the completed prompt. Hide the source translation if CSV source sentence differs.
      sentence: { jp: completedPrompt, reading: '', vi: kind === 'dien-tu' && !sourceMatchesPrompt ? '' : row.sentenceVi }, explanation: row.explanation,
    };
  });
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
  return shuffled(picked, seededRandom(`${seed}:${filter.lesson ?? ''}:${filter.grammarId ?? ''}`)).map((exercise) => ({
    ...exercise,
    options: shuffled(exercise.options, seededRandom(`${seed}:${exercise.id}:options`)),
  }));
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
