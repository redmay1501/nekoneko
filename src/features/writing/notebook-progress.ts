import type { GameRecord, GameRecords } from '@/features/games/match-game';
import type { NotebookId } from './notebook';

/**
 * Tiến độ Sổ luyện viết — lưu chung kho user_settings.game_records (không thêm bảng), khoá "<tiền tố sổ>:<mã trang>".
 * Mỗi sổ một tiền tố riêng (viet-hira, viet-kata, viet-kanji, viet-bo) để mỗi loại có ≤ 40 trang, nằm trong giới hạn
 * 40 bản ghi / loại của kho (mergeGameRecord) — chơi trò khác không đẩy mất tiến độ sổ.
 *
 * Ý nghĩa các trường (dùng lại kiểu GameRecord):
 *  - có bản ghi = đã BẮT ĐẦU (người học viết nét đầu tiên trên trang — mở trang thôi KHÔNG tính);
 *  - bestAccuracy 100 = người học tự bấm "Đã luyện xong trang"; 0 = mới bắt đầu / đã bỏ đánh dấu;
 *  - plays = số lần bấm "Đã luyện xong"; lastPlayedAt = lần luyện gần nhất.
 * KHÔNG ghi trí nhớ, KHÔNG đổi ngày lộ trình: viết tay không được chấm nên không phải bằng chứng đã nhớ.
 */
const PREFIX: Record<NotebookId, string> = { hiragana: 'viet-hira', katakana: 'viet-kata', kanji: 'viet-kanji', 'bo-thu': 'viet-bo' };

export const notebookRecordKey = (notebookId: NotebookId, pageId: string) => `${PREFIX[notebookId]}:${pageId}`;

export type PageProgressState = 'new' | 'started' | 'done';
export interface PageProgress {
  state: PageProgressState;
  lastPracticedAt: string | null;
  completions: number;
}

export function pageProgressOf(records: GameRecords, notebookId: NotebookId, pageId: string): PageProgress {
  const record = records[notebookRecordKey(notebookId, pageId)];
  if (!record) return { state: 'new', lastPracticedAt: null, completions: 0 };
  return { state: record.bestAccuracy >= 100 ? 'done' : 'started', lastPracticedAt: record.lastPlayedAt, completions: record.plays };
}

export type NotebookAction = 'start' | 'complete' | 'uncomplete';

export function applyNotebookAction(records: GameRecords, notebookId: NotebookId, pageId: string, action: NotebookAction, now: Date): GameRecords {
  const key = notebookRecordKey(notebookId, pageId);
  const previous = records[key];
  const at = now.toISOString();
  let next: GameRecord;
  switch (action) {
    case 'start':
      // Đã có bản ghi (đang luyện / đã xong) → chỉ cập nhật lần luyện gần nhất, KHÔNG hạ trạng thái "đã xong".
      next = previous ? { ...previous, lastPlayedAt: at } : { bestAccuracy: 0, bestTimeMs: 0, plays: 0, lastPlayedAt: at };
      break;
    case 'complete':
      next = { bestAccuracy: 100, bestTimeMs: 0, plays: (previous?.plays ?? 0) + 1, lastPlayedAt: at };
      break;
    case 'uncomplete':
      if (!previous) return records;
      next = { ...previous, bestAccuracy: 0 };
      break;
  }
  return { ...records, [key]: next };
}

export function notebookProgressMap(records: GameRecords, pages: ReadonlyArray<{ id: string; notebookId: NotebookId }>): Record<string, PageProgress> {
  return Object.fromEntries(pages.map((page) => [page.id, pageProgressOf(records, page.notebookId, page.id)]));
}
