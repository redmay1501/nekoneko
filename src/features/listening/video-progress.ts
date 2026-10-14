import type { GameRecords } from '@/features/games/match-game';

/**
 * "Đã xem" của video luyện nghe — lưu chung kho user_settings.game_records (khoá "video:<id>"), giới hạn kỷ lục tính riêng
 * từng loại nên không đẩy mất kỷ lục trò chơi / bài đọc. Chỉ người học tự bấm mới ghi; KHÔNG đổi điểm trí nhớ.
 */
const PREFIX = 'video:';

export const videoRecordKey = (videoId: string) => `${PREFIX}${videoId}`;

export function watchedVideoIds(records: GameRecords): string[] {
  return Object.keys(records).filter((key) => key.startsWith(PREFIX)).map((key) => key.slice(PREFIX.length));
}

export function setVideoWatched(records: GameRecords, videoId: string, isWatched: boolean, now: Date): GameRecords {
  const key = videoRecordKey(videoId);
  if (!isWatched) {
    return Object.fromEntries(Object.entries(records).filter(([recordKey]) => recordKey !== key));
  }
  return { ...records, [key]: { bestAccuracy: 100, bestTimeMs: 0, plays: (records[key]?.plays ?? 0) + 1, lastPlayedAt: now.toISOString() } };
}
