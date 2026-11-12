import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameRecords } from '@/features/games/match-game';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { loadSeedContent } from '@/lib/data/seed-content';

/** Route thật với ngữ cảnh người học giả: kiểm tra đầu vào, 401 / 404, và chỉ ghi user_settings (không ghi trí nhớ). */
const state = vi.hoisted(() => ({
  signedIn: true,
  gameRecords: {} as GameRecords,
  updates: [] as Array<{ userId: string; patch: Record<string, unknown> }>,
  memoryWrites: 0,
}));

vi.mock('@/features/learning/learner-context', async () => {
  const { UnauthenticatedError } = await import('@/lib/api/errors');
  const catalog = buildKnowledgeCatalog(loadSeedContent());
  return {
    getLearnerContext: async () => {
      if (!state.signedIn) throw new UnauthenticatedError();
      return {
        learner: { userId: 'u1' },
        catalog,
        settings: { gameRecords: state.gameRecords },
        source: {
          updateSettings: async (userId: string, patch: Record<string, unknown>) => {
            state.updates.push({ userId, patch });
            state.gameRecords = patch.gameRecords as GameRecords;
          },
          applyMemoryUpdate: async () => { state.memoryWrites++; },
          saveMemoryRecord: async () => { state.memoryWrites++; },
        },
      };
    },
  };
});

const { POST } = await import('./route');

const post = (body: unknown) => POST(new Request('http://x/api/kanji-stories/progress', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body),
}));

describe('POST /api/kanji-stories/progress', () => {
  beforeEach(() => { state.signedIn = true; state.gameRecords = {}; state.updates = []; state.memoryWrites = 0; });

  it('xem rồi đọc: trả tiến độ, chỉ ghi gameRecords, không ghi trí nhớ', async () => {
    const view = await post({ kanjiId: 2, action: 'view' });
    expect(view.status).toBe(200);
    expect((await view.json()).progress).toEqual({ viewed: true, read: false, views: 1, storyVersion: 9 });
    const read = await post({ kanjiId: 2, action: 'read' });
    expect((await read.json()).progress).toMatchObject({ viewed: true, read: true, views: 1 });
    expect(state.updates.map((update) => Object.keys(update.patch))).toEqual([['gameRecords'], ['gameRecords']]);
    expect(state.updates.every((update) => update.userId === 'u1')).toBe(true);
    expect(state.memoryWrites).toBe(0);
  });

  it('bỏ đánh dấu đã đọc giữ lại "đã xem"', async () => {
    await post({ kanjiId: 2, action: 'read' });
    const unread = await post({ kanjiId: 2, action: 'unread' });
    expect((await unread.json()).progress).toMatchObject({ viewed: true, read: false });
  });

  it.each([
    ['thiếu action', { kanjiId: 2 }],
    ['action lạ', { kanjiId: 2, action: 'master' }],
    ['kanjiId âm', { kanjiId: -1, action: 'read' }],
    ['kanjiId thập phân', { kanjiId: 2.5, action: 'read' }],
    ['kanjiId là chuỗi', { kanjiId: '2', action: 'read' }],
  ])('đầu vào sai (%s) → 400, không ghi gì', async (_label, body) => {
    expect((await post(body)).status).toBe(400);
    expect(state.updates).toHaveLength(0);
  });

  it('JSON hỏng → 400, không ghi gì', async () => {
    expect((await post('{oops')).status).toBe(400);
    expect(state.updates).toHaveLength(0);
  });

  it('kanji không có chuyện → 404, không ghi gì', async () => {
    expect((await post({ kanjiId: 999999, action: 'read' })).status).toBe(404);
    expect(state.updates).toHaveLength(0);
  });

  it('chưa đăng nhập → 401, không ghi gì', async () => {
    state.signedIn = false;
    expect((await post({ kanjiId: 2, action: 'read' })).status).toBe(401);
    expect(state.updates).toHaveLength(0);
  });
});
