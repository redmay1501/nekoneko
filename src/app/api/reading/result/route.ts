import { z } from 'zod';
import { mergeGameRecord } from '@/features/games/match-game';
import { readingRecordKey } from '@/features/games/reading-progress';
import { getLearnerContext } from '@/features/learning/learner-context';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const resultSchema = z.object({
  passageId: z.number().int().min(1),
  correct: z.number().int().min(0).max(10),
  timeMs: z.number().int().min(1000).max(3_600_000),
});

/**
 * Lưu kết quả một bài đọc hiểu (điểm cao nhất, số lần làm) — để danh sách bài biết bài nào đã làm và gợi ý bài tiếp theo.
 * Không ghi trí nhớ (giống trò chơi): câu hỏi đọc hiểu không gắn với một từ / mẫu câu cụ thể.
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/reading/result', async () => {
    const input = resultSchema.parse(await request.json());
    const context = await getLearnerContext();
    const passage = context.catalog.content.readingPassages.find((candidate) => candidate.id === input.passageId);
    if (!passage) throw new NotFoundError(`reading-${input.passageId}`);
    const correct = Math.min(input.correct, passage.questions.length);
    const merged = mergeGameRecord(context.settings.gameRecords, readingRecordKey(passage.id), {
      pairs: correct, mistakes: passage.questions.length - correct, timeMs: input.timeMs,
    }, new Date());
    await context.source.updateSettings(context.learner.userId, { gameRecords: merged.records });
    return { record: merged.record, isNewBest: merged.isNewBest };
  });
}
