import { z } from 'zod';
import { MATCH_GAME, gameRecordKey, mergeGameRecord } from '@/features/games/match-game';
import { getLearnerContext } from '@/features/learning/learner-context';
import { handleApiRoute } from '@/lib/api/route-handler';

const resultSchema = z.object({
  game: z.literal(MATCH_GAME),
  /** Phạm vi ôn (loại + nhóm), ví dụ "tu-vung:tat-ca", "kanji:can-on", "tu-vung:bai-3". */
  scope: z.string().regex(/^[a-z0-9:-]{1,40}$/),
  pairs: z.number().int().min(2).max(12),
  mistakes: z.number().int().min(0).max(200),
  timeMs: z.number().int().min(1000).max(3_600_000),
});

/**
 * Lưu kết quả một ván trò chơi ôn tập → kỷ lục theo phạm vi.
 * KHÔNG ghi trí nhớ: kết quả game không đổi memory_score (xem features/games/match-game.ts).
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/games/result', async () => {
    const input = resultSchema.parse(await request.json());
    const context = await getLearnerContext();
    const merged = mergeGameRecord(context.settings.gameRecords, gameRecordKey(input.game, input.scope), input, new Date());
    await context.source.updateSettings(context.learner.userId, { gameRecords: merged.records });
    return { record: merged.record, isNewBest: merged.isNewBest };
  });
}
