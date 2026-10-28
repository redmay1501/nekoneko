import type { MemoryView } from '@/features/memory/memory-types';
import type { KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import type { ContentKey, ContentType, KnowledgeItem } from '@/features/learning/knowledge-types';
import { speechTextFor } from '@/features/learning/speech-text';
import { needsReview } from '@/features/learning/study-actions';
import { firstMeaning } from '@/lib/utils/text';
import type { GameRecord, GameRecords } from './match-game';

/**
 * NEKO STREAK — "Mèo nhớ siêu đỉnh!": trắc nghiệm 4 đáp án liên tục, đếm chuỗi đúng liên tiếp và giữ kỷ lục cá nhân.
 *
 * PHẠM VI KIẾN THỨC (theo đúng tiến độ của từng người học, tính lại mỗi lần mở trang):
 *  - chỉ mục có ngày lộ trình ≤ ngày đang học (profiles.current_day) — không bao giờ lấy nội dung ngày sau;
 *  - và người học ĐÃ HỌC thật (MemoryView.isLearned — đã gặp ít nhất một lần). Mở / "hoàn thành" một ngày, hay chọn
 *    ngày bắt đầu, không có nghĩa là đã học hết nội dung ngày đó;
 *  - server chỉ gửi xuống trình duyệt các mục trong phạm vi → câu hỏi VÀ đáp án nhiễu đều không thể ra ngoài phạm vi.
 *
 * Game KHÔNG đổi trí nhớ / tiến độ (như mọi trò trong /tro-choi): chỉ kỷ lục chuỗi được lưu (user_settings.game_records).
 */

export const STREAK_GAME = 'streak';
export const STREAK_RECORD_KEY = `${STREAK_GAME}:best`;
/** Ít hơn chừng này câu hợp lệ thì chưa chơi được (hướng dẫn học thêm). */
export const MIN_STREAK_QUESTIONS = 8;
export const STREAK_OPTIONS = 4;

/** Các loại kiến thức hỏi được — mỗi loại một cách hỏi lấy từ dữ liệu thật. */
const STREAK_TYPES: readonly ContentType[] = ['hiragana', 'katakana', 'radical', 'kanji', 'vocabulary', 'grammar'];

/** Một mục kiến thức gửi xuống trình duyệt (chỉ trường cần để hỏi + giải thích). */
export interface StreakItem {
  key: ContentKey;
  type: ContentType;
  face: string;
  /** Kana: romaji; Kanji: "HÁN VIỆT · nghĩa"; từ vựng: cách đọc kana; ngữ pháp: câu ví dụ tiếng Nhật. */
  reading: string;
  /** Nghĩa tiếng Việt (ngữ pháp: nghĩa của câu ví dụ). */
  meaning: string;
  /** Dòng giải thích khi trả lời sai (mẹo nhớ / cách dùng) — rỗng nếu dữ liệu không có. */
  note: string;
  audioText: string;
  /** Đang cần ôn (mờ dần / đến hạn) — được ưu tiên vừa phải khi xáo câu. */
  isDue: boolean;
}

export interface StreakQuestion {
  /** Mã câu: "<contentKey>:<dạng>" — dùng để không lặp câu trong phiên. */
  id: string;
  contentKey: ContentKey;
  typeLabel: string;
  prompt: string;
  /** Mặt hiện to (chữ / từ tiếng Nhật, hoặc nghĩa tiếng Việt khi hỏi ngược). */
  face: string;
  /** Mặt chính là tiếng Nhật → hiện font Nhật + cho bấm nghe. */
  faceIsJapanese: boolean;
  audioText: string;
  options: string[];
  answer: string;
  optionsAreJapanese: boolean;
  explanation: string;
}

const TYPE_LABEL: Record<ContentType, string> = {
  hiragana: 'Hiragana', katakana: 'Katakana', radical: 'Bộ thủ', kanji: 'Kanji', vocabulary: 'Từ vựng', grammar: 'Ngữ pháp',
};

const isSentence = (text: string) => Boolean(text.trim()) && !/[→/／]/.test(text);

/** Mục đủ điều kiện của một người học: đã học thật + thuộc ngày ≤ ngày đang học. */
export function buildStreakItems(catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>, journeyDay: number): StreakItem[] {
  const items: StreakItem[] = [];
  for (const item of catalog.items as KnowledgeItem[]) {
    if (!STREAK_TYPES.includes(item.type) || item.day === null || item.day > journeyDay) continue;
    const view = views.get(item.key);
    if (!view?.isLearned) continue;
    const base = { key: item.key, type: item.type, face: item.face, audioText: speechTextFor(item), isDue: needsReview(view) };
    switch (item.type) {
      case 'hiragana':
      case 'katakana':
        items.push({ ...base, reading: item.reading, meaning: item.reading, note: item.content.tip ?? '' });
        break;
      case 'radical':
        items.push({ ...base, reading: item.content.nameJp.split(' / ')[0], meaning: firstMeaning(item.content.meaning), note: item.content.tip ?? '' });
        break;
      case 'kanji':
        items.push({ ...base, reading: `${item.content.hanViet} · ${firstMeaning(item.content.meaning)}`, meaning: `${item.content.hanViet} · ${firstMeaning(item.content.meaning)}`, note: item.content.tip ?? '' });
        break;
      case 'vocabulary':
        items.push({ ...base, reading: item.content.kana, meaning: firstMeaning(item.content.meaning), note: item.content.tip ?? '' });
        break;
      case 'grammar':
        if (!isSentence(item.content.exampleJp) || !item.content.exampleVi.trim()) break;
        items.push({ ...base, face: item.content.pattern, reading: item.content.exampleJp, meaning: item.content.exampleVi, note: item.content.usage ?? '', audioText: item.content.exampleJp });
        break;
    }
  }
  return items;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/** 3 đáp án nhiễu cùng loại, khác đáp án đúng và khác nhau (bỏ dấu cách / hoa thường); không đủ → null (bỏ câu). */
function distractors(answer: string, pool: readonly string[], random: () => number): string[] | null {
  const norm = (text: string) => text.trim().toLowerCase();
  const seen = new Set([norm(answer)]);
  const picked: string[] = [];
  for (const candidate of shuffle(pool, random)) {
    const key = norm(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push(candidate);
    if (picked.length === STREAK_OPTIONS - 1) return picked;
  }
  return null;
}

/**
 * Bộ câu cho một phiên (hoặc một lượt xáo lại): mỗi mục một câu (từ vựng: thêm câu hỏi ngược Việt → Nhật), thứ tự ngẫu nhiên,
 * mục đang cần ôn được đẩy lên trước VỪA PHẢI (trọng số, không xếp dồn). Đáp án nhiễu chỉ lấy từ chính `items`
 * (= phạm vi của người học). Câu không đủ 4 đáp án khác nhau bị loại. `exclude`: mã câu đã hỏi trong phiên.
 */
export function buildStreakDeck(items: readonly StreakItem[], random: () => number = Math.random, exclude: ReadonlySet<string> = new Set()): StreakQuestion[] {
  const byType = new Map<ContentType, StreakItem[]>();
  for (const item of items) byType.set(item.type, [...(byType.get(item.type) ?? []), item]);
  const kana = [...(byType.get('hiragana') ?? []), ...(byType.get('katakana') ?? [])];
  const questions: Array<{ question: StreakQuestion; weight: number }> = [];
  const push = (question: StreakQuestion | null, item: StreakItem) => {
    if (!question || exclude.has(question.id)) return;
    // Trọng số xáo: mục cần ôn có cơ hội lên trước cao hơn (~1.6×), các mục khác vẫn xen kẽ.
    questions.push({ question, weight: random() * (item.isDue ? 0.62 : 1) });
  };
  const make = (item: StreakItem, variant: string, fields: Omit<StreakQuestion, 'id' | 'contentKey' | 'typeLabel' | 'options' | 'explanation'>, pool: readonly string[]): StreakQuestion | null => {
    const wrong = distractors(fields.answer, pool, random);
    if (!wrong) return null;
    const explanation = item.type === 'grammar'
      ? `${item.face}: ${item.reading} — ${item.meaning}${item.note ? `. ${item.note}` : ''}`
      : `${item.face}${item.reading && item.reading !== item.face && item.type === 'vocabulary' ? `（${item.reading}）` : ''} — ${item.type === 'hiragana' || item.type === 'katakana' ? `đọc là “${item.reading}”` : item.meaning}${item.note ? `. ${item.note}` : ''}`;
    return { ...fields, id: `${item.key}:${variant}`, contentKey: item.key, typeLabel: TYPE_LABEL[item.type], options: shuffle([fields.answer, ...wrong], random), explanation };
  };

  for (const item of items) {
    const sameType = byType.get(item.type) ?? [];
    switch (item.type) {
      case 'hiragana':
      case 'katakana':
        push(make(item, 'doc', { prompt: 'Chữ này đọc là gì?', face: item.face, faceIsJapanese: true, audioText: item.audioText, answer: item.reading, optionsAreJapanese: false },
          kana.map((other) => other.reading)), item);
        break;
      case 'radical':
      case 'kanji':
        push(make(item, 'nghia', {
          prompt: item.type === 'radical' ? 'Bộ thủ này nghĩa là gì?' : 'Chữ Hán này nghĩa là gì?', face: item.face, faceIsJapanese: true,
          audioText: item.audioText, answer: item.meaning, optionsAreJapanese: false,
        }, sameType.map((other) => other.meaning)), item);
        break;
      case 'vocabulary':
        push(make(item, 'nghia', { prompt: 'Từ này nghĩa là gì?', face: item.face, faceIsJapanese: true, audioText: item.audioText, answer: item.meaning, optionsAreJapanese: false },
          sameType.map((other) => other.meaning)), item);
        push(make(item, 'tu', { prompt: 'Từ tiếng Nhật nào có nghĩa này?', face: item.meaning, faceIsJapanese: false, audioText: '', answer: item.face, optionsAreJapanese: true },
          sameType.filter((other) => other.meaning.trim().toLowerCase() !== item.meaning.trim().toLowerCase()).map((other) => other.face)), item);
        break;
      case 'grammar':
        push(make(item, 'cau', { prompt: 'Chọn câu tiếng Nhật đúng với nghĩa:', face: item.meaning, faceIsJapanese: false, audioText: '', answer: item.reading, optionsAreJapanese: true },
          sameType.map((other) => other.reading)), item);
        break;
    }
  }
  return questions.sort((left, right) => left.weight - right.weight).map((entry) => entry.question);
}

/* ─────────── Chuỗi đúng & kỷ lục ─────────── */

export interface StreakState {
  /** Chuỗi đúng liên tiếp đang diễn ra. */
  streak: number;
  /** Kỷ lục cá nhân (đã gồm cả chuỗi đang chạy nếu nó vượt). */
  best: number;
  answered: number;
  correct: number;
  /** Lần trả lời này vừa đẩy kỷ lục lên. */
  isNewBest: boolean;
}

export function initialStreakState(best: number, restored?: { streak: number; answered: number; correct: number } | null): StreakState {
  const streak = Math.max(0, restored?.streak ?? 0);
  return { streak, best: Math.max(best, streak), answered: restored?.answered ?? 0, correct: restored?.correct ?? 0, isNewBest: false };
}

/** Đúng: chuỗi +1 (không giới hạn), vượt kỷ lục thì kỷ lục = chuỗi. Sai: chuỗi về 0, kỷ lục giữ nguyên. */
export function applyStreakAnswer(state: StreakState, isCorrect: boolean): StreakState {
  if (!isCorrect) return { ...state, streak: 0, answered: state.answered + 1, isNewBest: false };
  const streak = state.streak + 1;
  return { streak, best: Math.max(state.best, streak), answered: state.answered + 1, correct: state.correct + 1, isNewBest: streak > state.best };
}

/** Lời động viên ở các mốc (chỉ để khen — không đổi luật chơi, không dừng game). */
export function streakMilestone(streak: number): string | null {
  const lines: Record<number, string> = {
    5: 'Neko đang vào guồng rồi! ✨', 10: 'Siêu trí nhớ! Giữ chuỗi nào! 🔥', 20: 'Wow, bạn giỏi quá! 🏆',
    30: 'Ba mươi câu liền — mèo phục bạn sát đất! 🐾', 50: 'Huyền thoại NekoNeko! 👑', 100: 'Một trăm câu! Trí nhớ không giới hạn! 🌸',
  };
  if (lines[streak]) return lines[streak];
  return streak > 100 && streak % 50 === 0 ? `${streak} câu liên tiếp — chuỗi huyền thoại! 👑` : null;
}

export function bestStreakOf(records: GameRecords): number {
  return Math.max(0, Math.floor(records[STREAK_RECORD_KEY]?.bestStreak ?? 0));
}

/**
 * Ghi kỷ lục: luôn giữ GIÁ TRỊ LỚN NHẤT (gửi lại / gửi lệch thứ tự / hai tab cùng chơi không làm kỷ lục lùi).
 * `newSession`: đầu một phiên chơi → đếm thêm một lượt chơi.
 */
export function mergeStreakRecord(records: GameRecords, streak: number, now: Date, newSession: boolean): { records: GameRecords; record: GameRecord; isNewBest: boolean } {
  const previous = records[STREAK_RECORD_KEY];
  const previousBest = bestStreakOf(records);
  const best = Math.max(previousBest, Math.max(0, Math.floor(streak)));
  const record: GameRecord = {
    bestAccuracy: previous?.bestAccuracy ?? 0, bestTimeMs: previous?.bestTimeMs ?? 0,
    bestStreak: best,
    plays: (previous?.plays ?? 0) + (newSession ? 1 : 0),
    lastPlayedAt: now.toISOString(),
  };
  return { records: { ...records, [STREAK_RECORD_KEY]: record }, record, isNewBest: best > previousBest };
}
