import { describe, expect, it } from 'vitest';
import { type GameRecords, gameRecordKey, mergeGameRecord } from '@/features/games/match-game';
import { toMemoryView } from '@/features/memory/memory-engine';
import { DemoDataSource } from '@/lib/data/demo-data-source';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildDayStudy } from './day-study';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { buildKnowledgeDetail } from './knowledge-detail';
import { applyKanjiStoryAction, kanjiStoryProgressOf, kanjiStoryRecordKey, readKanjiStoryIds } from './kanji-story-progress';
import { toContentKey } from './knowledge-types';

const NOW = new Date('2026-11-12T09:00:00+07:00');

describe('kanji-story-progress — "đã xem" / "đã đọc" chuyện', () => {
  it('mở chuyện = đã xem (chưa phải đã đọc); bấm Đã đọc = đã đọc; bỏ đánh dấu = về đã xem', () => {
    let records: GameRecords = {};
    records = applyKanjiStoryAction(records, 5, 9, 'view', NOW);
    expect(kanjiStoryProgressOf(records, 5)).toEqual({ viewed: true, read: false, views: 1, storyVersion: 9 });
    records = applyKanjiStoryAction(records, 5, 9, 'view', NOW);
    records = applyKanjiStoryAction(records, 5, 9, 'read', NOW);
    expect(kanjiStoryProgressOf(records, 5)).toEqual({ viewed: true, read: true, views: 2, storyVersion: 9 });
    records = applyKanjiStoryAction(records, 5, 9, 'unread', NOW);
    expect(kanjiStoryProgressOf(records, 5)).toMatchObject({ viewed: true, read: false });
    expect(kanjiStoryProgressOf(records, 6)).toMatchObject({ viewed: false, read: false });
  });

  it('không đụng kỷ lục khác (trò chơi, video, luyện viết)', () => {
    const others: GameRecords = {
      'match:tu-vung:tat-ca': { bestAccuracy: 90, bestTimeMs: 4000, plays: 3, lastPlayedAt: '2026-11-01T00:00:00Z' },
      'video:yt-abc': { bestAccuracy: 100, bestTimeMs: 0, plays: 1, lastPlayedAt: '2026-11-01T00:00:00Z' },
    };
    const next = applyKanjiStoryAction(others, 5, 9, 'read', NOW);
    expect(Object.keys(next).sort()).toEqual([...Object.keys(others), kanjiStoryRecordKey(5)].sort());
    for (const key of Object.keys(others)) expect(next[key]).toEqual(others[key]);
  });

  it('đọc cả 103 chuyện rồi chơi trò chơi — giới hạn 40 kỷ lục mỗi loại không xoá mất tiến độ đọc chuyện', () => {
    const content = loadSeedContent();
    let records: GameRecords = {};
    for (const kanji of content.kanji) records = applyKanjiStoryAction(records, kanji.id, 9, 'read', NOW);
    for (let round = 0; round < 50; round++) {
      records = mergeGameRecord(records, gameRecordKey('match', `pham-vi-${round}`), { pairs: 6, mistakes: 1, timeMs: 30000 },
        new Date(NOW.getTime() + (round + 1) * 60000)).records;
    }
    expect(readKanjiStoryIds(records).size).toBe(103);
  });
});

describe('đọc chuyện KHÔNG đổi trí nhớ', () => {
  it('ghi "đã đọc" qua cài đặt người học không tạo / sửa bản ghi trí nhớ nào', async () => {
    const source = new DemoDataSource();
    const userId = `story-${Math.random()}`;
    const before = await source.listMemoryRecords(userId);
    const settings = await source.getSettings(userId);
    await source.updateSettings(userId, { gameRecords: applyKanjiStoryAction(settings.gameRecords, 2, 9, 'read', NOW) });
    expect(await source.listMemoryRecords(userId)).toEqual(before);
    expect(kanjiStoryProgressOf((await source.getSettings(userId)).gameRecords, 2).read).toBe(true);
  });

  it('chi tiết Kanji: đã đọc chuyện nhưng trạng thái nhớ vẫn là "Mới" — không bao giờ tự thành thạo', () => {
    const catalog = buildKnowledgeCatalog(loadSeedContent());
    const kanji = catalog.content.kanji[0];
    const key = toContentKey('kanji', kanji.id);
    const item = catalog.byKey.get(key)!;
    const memory = toMemoryView(key, 'kanji', null, NOW);
    const records = applyKanjiStoryAction({}, kanji.id, 9, 'read', NOW);
    const detail = buildKnowledgeDetail(item, memory, catalog, records);
    expect(detail.story?.kanjiId).toBe(kanji.id);
    expect(detail.storyProgress.read).toBe(true);
    expect(detail.memory).toBe(memory);
    expect(detail.memory.status).toBe('new');
    expect(detail.memory.isLearned).toBe(false);
  });

  it('thẻ học của ngày có chuyện, nhưng số Kanji, thứ tự và "đã học" của ngày giữ nguyên', () => {
    const catalog = buildKnowledgeCatalog(loadSeedContent());
    const day = catalog.content.kanji.find((kanji) => kanji.day !== null)!.day!;
    const journey = { currentDay: day, isJourneyComplete: false };
    const without = buildDayStudy(catalog, day, journey, new Map());
    const readAll = catalog.content.kanji.reduce<GameRecords>((records, kanji) => applyKanjiStoryAction(records, kanji.id, 9, 'read', NOW), {});
    const withStories = buildDayStudy(catalog, day, journey, new Map(), readAll);
    expect(withStories.kanji.map((card) => card.key)).toEqual(without.kanji.map((card) => card.key));
    expect(withStories.learned).toEqual(without.learned);
    expect(withStories.weakestKeys).toEqual(without.weakestKeys);
    expect(withStories.kanji.every((card) => card.story && card.storyProgress.read)).toBe(true);
    expect(without.kanji.every((card) => card.story && !card.storyProgress.read)).toBe(true);
  });
});
