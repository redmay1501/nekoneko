import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { SELF_REPORT_ANSWERS } from '@/features/learning/session-types';
import { recordMemoryEvent } from '@/features/memory/memory-service';
import { REVIEW_EVENT_TYPES } from '@/features/memory/memory-types';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const answerSchema = z.object({
  contentKey: z.string().min(3),
  selfReport: z.enum([SELF_REPORT_ANSWERS.REMEMBERED, SELF_REPORT_ANSWERS.FORGOT]),
  requestId: z.string().min(8).max(100),
});

/** "Tôi nhớ" / "Chưa nhớ" ở thẻ Gặp lại kiến thức (ngoài phiên học). */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/memory/answer', async () => {
    const input = answerSchema.parse(await request.json());
    const context = await getLearnerContext();
    const item = findKnowledgeItem(context.catalog, input.contentKey);
    if (!item) throw new NotFoundError(input.contentKey);

    const recorded = await recordMemoryEvent({
      source: context.source,
      userId: context.learner.userId,
      item,
      existingRecord: context.memoryRecords.get(item.key) ?? null,
      eventType: REVIEW_EVENT_TYPES.SURPRISE,
      answer: input.selfReport,
      isCorrect: input.selfReport === SELF_REPORT_ANSWERS.REMEMBERED,
      requestId: input.requestId,
      now: new Date(),
    });
    return { memory: recorded.view };
  });
}
