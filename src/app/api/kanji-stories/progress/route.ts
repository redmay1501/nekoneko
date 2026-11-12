import { z } from 'zod';
import { applyKanjiStoryAction, kanjiStoryProgressOf } from '@/features/learning/kanji-story-progress';
import { getLearnerContext } from '@/features/learning/learner-context';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';
import { kanjiStoryOf } from '@/lib/data/kanji-stories';

const progressSchema = z.object({
  kanjiId: z.number().int().positive(),
  action: z.enum(['view', 'read', 'unread']),
});

/**
 * Ghi người học đã xem / đã đọc câu chuyện của một Kanji (user_settings.game_records).
 * KHÔNG ghi trí nhớ: đọc chuyện ≠ đã nhớ — điểm trí nhớ chỉ đổi qua câu ôn (memory-service).
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/kanji-stories/progress', async () => {
    // JSON hỏng → null → ZodError → 400 (lỗi đầu vào, không phải lỗi máy chủ).
    const input = progressSchema.parse(await request.json().catch(() => null));
    const context = await getLearnerContext();
    const story = kanjiStoryOf(context.catalog.content, input.kanjiId);
    if (!story) throw new NotFoundError(`kanji-${input.kanjiId}`);
    const gameRecords = applyKanjiStoryAction(context.settings.gameRecords, input.kanjiId, story.version, input.action, new Date());
    await context.source.updateSettings(context.learner.userId, { gameRecords });
    return { progress: kanjiStoryProgressOf(gameRecords, input.kanjiId) };
  });
}
