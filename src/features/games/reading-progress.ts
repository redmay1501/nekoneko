import { type GameRecord, type GameRecords, gameRecordKey } from './match-game';

/** Kết quả bài đọc lưu chung kho kỷ lục (user_settings.game_records), khoá "doc:bai-<id>". */
export const READING_GAME = 'doc';

export const readingRecordKey = (passageId: number) => gameRecordKey(READING_GAME, `bai-${passageId}`);

export function readingRecordOf(records: GameRecords, passageId: number): GameRecord | null {
  return records[readingRecordKey(passageId)] ?? null;
}
