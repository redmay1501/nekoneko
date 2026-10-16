import { describe, expect, it } from 'vitest';
import { mergeGameRecord } from '@/features/games/match-game';
import { applyNotebookAction, notebookRecordKey, pageProgressOf } from './notebook-progress';

const now = new Date('2026-10-16T10:00:00Z');
const later = new Date('2026-10-17T10:00:00Z');

describe('tiến độ Sổ luyện viết', () => {
  it('chưa làm gì → new (mở trang không ghi gì)', () => {
    expect(pageProgressOf({}, 'hiragana', 'hiragana-1')).toEqual({ state: 'new', lastPracticedAt: null, completions: 0 });
  });
  it('viết nét đầu → started; bấm xong → done; bỏ đánh dấu → started', () => {
    let records = applyNotebookAction({}, 'hiragana', 'hiragana-1', 'start', now);
    expect(pageProgressOf(records, 'hiragana', 'hiragana-1').state).toBe('started');
    records = applyNotebookAction(records, 'hiragana', 'hiragana-1', 'complete', later);
    expect(pageProgressOf(records, 'hiragana', 'hiragana-1')).toEqual({ state: 'done', lastPracticedAt: later.toISOString(), completions: 1 });
    records = applyNotebookAction(records, 'hiragana', 'hiragana-1', 'uncomplete', later);
    expect(pageProgressOf(records, 'hiragana', 'hiragana-1').state).toBe('started');
  });
  it('luyện lại trang đã xong (start) không hạ trạng thái "đã xong"', () => {
    let records = applyNotebookAction({}, 'kanji', 'kanji-2', 'complete', now);
    records = applyNotebookAction(records, 'kanji', 'kanji-2', 'start', later);
    expect(pageProgressOf(records, 'kanji', 'kanji-2')).toMatchObject({ state: 'done', lastPracticedAt: later.toISOString() });
  });
  it('không đụng bản ghi khác (trò chơi, bài đọc, video)', () => {
    const others = { 'match:bai-1': { bestAccuracy: 80, bestTimeMs: 9000, plays: 2, lastPlayedAt: 'x' }, 'video:nhk-1': { bestAccuracy: 100, bestTimeMs: 0, plays: 1, lastPlayedAt: 'y' } };
    const records = applyNotebookAction(others, 'bo-thu', 'bo-thu-1', 'complete', now);
    expect(records['match:bai-1']).toEqual(others['match:bai-1']);
    expect(records['video:nhk-1']).toEqual(others['video:nhk-1']);
  });
  it('khoá mỗi sổ một tiền tố → chơi Ghép thẻ không đẩy mất tiến độ sổ', () => {
    let records = {};
    for (let page = 1; page <= 21; page += 1) records = applyNotebookAction(records, 'hiragana', `hiragana-${page}`, 'complete', now);
    for (let round = 0; round < 45; round += 1) records = mergeGameRecord(records, `match:r-${round}`, { pairs: 6, mistakes: 0, timeMs: 1000 }, later).records;
    expect(Object.keys(records).filter((key) => key.startsWith('viet-hira:'))).toHaveLength(21);
    expect(notebookRecordKey('katakana', 'katakana-1')).toBe('viet-kata:katakana-1');
  });
});
