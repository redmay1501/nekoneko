import { z } from 'zod';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { recordMemoryEvent } from '@/features/memory/memory-service';
import { REVIEW_EVENT_TYPES } from '@/features/memory/memory-types';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const rescueSchema = z.object({
  contentKey: z.string().min(3),
  requestId: z.string().min(8).max(100),
});

/** Kết thúc luồng "Cứu kiến thức" — Memory Engine tính như một lần nhớ đúng. */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/memory/rescue', async () => {
    const input = rescueSchema.parse(await request.json());
    const context = await getLearnerContext();
    const item = findKnowledgeItem(context.catalog, input.contentKey);
    if (!item) throw new NotFoundError(input.contentKey);

    const recorded = await recordMemoryEvent({
      source: context.source,
      userId: context.learner.userId,
      item,
      existingRecord: context.memoryRecords.get(item.key) ?? null,
      eventType: REVIEW_EVENT_TYPES.RESCUE,
      answer: null,
      isCorrect: true,
      requestId: input.requestId,
      now: new Date(),
    });
    return { memory: recorded.view };
  });
}
