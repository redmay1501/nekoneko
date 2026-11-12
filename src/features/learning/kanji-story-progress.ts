import type { GameRecord, GameRecords } from '@/features/games/match-game';

/**
 * Người học đã TIẾP XÚC với câu chuyện Kanji tới đâu — lưu chung kho user_settings.game_records như "đã xem" video.
 *
 * Bốn mức KHÁC NHAU, và file này chỉ quản hai mức đầu:
 *   1. Đã xem chuyện   (viewed) — mở phần câu chuyện ra đọc.            ← ghi ở đây
 *   2. Đã đọc chuyện   (read)   — người học tự bấm "Đã đọc".            ← ghi ở đây
 *   3. Đã học Kanji             — memory_items có bản ghi (lộ trình gieo / Khám phá).
 *   4. Đã nhớ / thành thạo      — memory_score qua các lần ôn (memory-engine.ts).
 * Đọc chuyện KHÔNG BAO GIỜ ghi vào memory_items / review_events: điểm trí nhớ chỉ đổi khi người học trả lời câu ôn.
 *
 * Khoá "chuyen-kanji<n>:<kanjiId>", n = nhóm 40 chữ: mergeGameRecord giữ tối đa 40 bản ghi cho MỖI tiền tố, nên chia nhóm
 * để chơi trò chơi không đẩy mất tiến độ đọc chuyện (cùng cách notebook-progress.ts chia trang luyện viết).
 */
const PREFIX = 'chuyen-kanji';
const IDS_PER_PREFIX = 40;

export type KanjiStoryAction = 'view' | 'read' | 'unread';

export interface KanjiStoryProgress {
  viewed: boolean;
  read: boolean;
  /** Số lần mở chuyện. */
  views: number;
  /** Phiên bản chuyện lúc đọc gần nhất — chuyện được viết lại thì vẫn biết người học đã đọc bản nào. */
  storyVersion: number | null;
}

export const NO_STORY_PROGRESS: KanjiStoryProgress = { viewed: false, read: false, views: 0, storyVersion: null };

export function kanjiStoryRecordKey(kanjiId: number): string {
  return `${PREFIX}${Math.max(1, Math.ceil(kanjiId / IDS_PER_PREFIX))}:${kanjiId}`;
}

export function kanjiStoryProgressOf(records: GameRecords, kanjiId: number): KanjiStoryProgress {
  const record = records[kanjiStoryRecordKey(kanjiId)];
  if (!record) return NO_STORY_PROGRESS;
  return { viewed: true, read: Boolean(record.readAt), views: record.plays, storyVersion: record.storyVersion ?? null };
}

/** Kanji (id) mà người học đã bấm "Đã đọc chuyện". */
export function readKanjiStoryIds(records: GameRecords): Set<number> {
  return new Set(Object.entries(records)
    .filter(([key, record]) => key.startsWith(PREFIX) && record.readAt)
    .map(([key]) => Number(key.slice(key.indexOf(':') + 1))));
}

/** Hàm thuần: áp một hành động lên kho kỷ lục, không đụng khoá khác. */
export function applyKanjiStoryAction(records: GameRecords, kanjiId: number, storyVersion: number, action: KanjiStoryAction, now: Date): GameRecords {
  const key = kanjiStoryRecordKey(kanjiId);
  const previous = records[key];
  const base: GameRecord = previous ?? { bestAccuracy: 0, bestTimeMs: 0, plays: 0, lastPlayedAt: now.toISOString() };
  const next: GameRecord = { ...base, lastPlayedAt: now.toISOString(), storyVersion };
  if (action === 'view') next.plays = base.plays + 1;
  if (action === 'read') {
    next.readAt = now.toISOString();
    next.bestAccuracy = 100;
    next.plays = Math.max(base.plays, 1);
  }
  if (action === 'unread') {
    delete next.readAt;
    next.bestAccuracy = 0;
  }
  return { ...records, [key]: next };
}
