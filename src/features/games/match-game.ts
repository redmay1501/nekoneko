/**
 * Trò chơi Ghép thẻ — ôn kiến thức ĐÃ HỌC bằng cách ghép mặt chữ tiếng Nhật với nghĩa.
 *
 * Kết quả game (số lần sai, thời gian, kỷ lục) KHÔNG đổi điểm trí nhớ: ghép đúng nhờ loại trừ / đoán nhanh
 * không có nghĩa là đã nhớ vững. Game nối với hệ thống Memory bằng cách khác: thứ ghép sai được gợi ý
 * "Ôn ngay" — mở phiên Học theo lựa chọn, nơi câu trả lời được ghi vào trí nhớ như mọi bước Gặp lại.
 */

export const MATCH_GAME = 'match';
export const MATCH_PAIRS = 6;
export const MIN_MATCH_POOL = 3;

export interface MatchCard {
  contentKey: string;
  face: string;
  /** Mặt bên phải: nghĩa tiếng Việt (Kanji: "HÁN VIỆT · nghĩa"). */
  answer: string;
  audioText: string;
}

export interface GameResult {
  pairs: number;
  mistakes: number;
  timeMs: number;
}

export interface GameRecord {
  bestAccuracy: number;
  /** Thời gian của lần đạt độ chính xác cao nhất (cùng độ chính xác thì nhanh hơn là tốt hơn). */
  bestTimeMs: number;
  plays: number;
  lastPlayedAt: string;
}

export type GameRecords = Record<string, GameRecord>;

/** Tối đa chừng này kỷ lục mỗi người (mỗi phạm vi một kỷ lục) — bỏ phạm vi chơi lâu nhất khi vượt. */
const MAX_RECORDS = 40;

export function gameRecordKey(game: string, scope: string): string {
  return `${game}:${scope}`;
}

/** Độ chính xác: số cặp / số lần ghép (mỗi lần sai là một lần ghép hụt). */
export function accuracyOf(result: GameResult): number {
  return Math.round((result.pairs / (result.pairs + result.mistakes)) * 100);
}

function isBetter(result: GameResult, record: GameRecord | undefined): boolean {
  if (!record) return true;
  const accuracy = accuracyOf(result);
  return accuracy > record.bestAccuracy || (accuracy === record.bestAccuracy && result.timeMs < record.bestTimeMs);
}

export function mergeGameRecord(records: GameRecords, key: string, result: GameResult, now: Date): { records: GameRecords; record: GameRecord; isNewBest: boolean } {
  const previous = records[key];
  const isNewBest = isBetter(result, previous);
  const record: GameRecord = {
    bestAccuracy: isNewBest ? accuracyOf(result) : previous!.bestAccuracy,
    bestTimeMs: isNewBest ? result.timeMs : previous!.bestTimeMs,
    plays: (previous?.plays ?? 0) + 1,
    lastPlayedAt: now.toISOString(),
  };
  const merged = { ...records, [key]: record };
  const kept = Object.entries(merged).sort(([, left], [, right]) => right.lastPlayedAt.localeCompare(left.lastPlayedAt)).slice(0, MAX_RECORDS);
  return { records: Object.fromEntries(kept), record, isNewBest };
}

/**
 * Chọn một ván: tối đa MATCH_PAIRS thẻ ngẫu nhiên, không trùng mặt chữ và không trùng nghĩa
 * (hai thẻ cùng nghĩa thì ghép kiểu nào cũng "đúng" — người chơi bị chấm sai oan).
 */
export function pickMatchRound(pool: readonly MatchCard[], random: () => number = Math.random, size = MATCH_PAIRS): MatchCard[] {
  const shuffled = shuffle(pool, random);
  const faces = new Set<string>();
  const answers = new Set<string>();
  const round: MatchCard[] = [];
  for (const card of shuffled) {
    const answerKey = card.answer.trim().toLowerCase();
    if (faces.has(card.face) || answers.has(answerKey)) continue;
    faces.add(card.face);
    answers.add(answerKey);
    round.push(card);
    if (round.length === size) break;
  }
  return round;
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function formatDuration(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
