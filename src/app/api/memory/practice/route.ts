import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { recordMemoryEvent } from '@/features/memory/memory-service';
import { REVIEW_EVENT_TYPES } from '@/features/memory/memory-types';
import { appDateKey } from '@/features/progress/recall-streak';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const practiceSchema = z.object({
  contentKey: z.string().min(3),
  /** Nghĩa người học chọn — SERVER chấm, không tin kết quả đúng/sai từ trình duyệt. */
  answer: z.string().max(200),
  requestId: z.string().min(8).max(100),
});

/**
 * Luyện nghe (ngoài phiên học): nghe từ đã học → chọn nghĩa. Mỗi câu là một lần nhớ lại thật,
 * nên ghi vào trí nhớ như bước Gặp lại. Chỉ nhận từ vựng ĐÃ học (bài nghe chỉ hỏi những từ này).
 *
 * Mỗi từ tính TỐI ĐA MỘT LẦN MỖI NGÀY: bài nghe hỏi cùng vài từ, làm lại liên tục không được "bơm" điểm trí nhớ
 * (mỗi câu đúng +14). Từ đã gặp hôm nay (kể cả trong phiên học) → không ghi, trả `counted: false`.
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/memory/practice', async () => {
    const input = practiceSchema.parse(await request.json());
    const context = await getLearnerContext();
    const item = findKnowledgeItem(context.catalog, input.contentKey);
    const view = item ? context.memoryViews.get(item.key) : undefined;
    if (!item || item.type !== 'vocabulary' || !view?.isLearned) throw new NotFoundError(input.contentKey);

    const now = new Date();
    const existingRecord = context.memoryRecords.get(item.key) ?? null;
    if (existingRecord?.lastSeenAt && appDateKey(new Date(existingRecord.lastSeenAt)) === appDateKey(now)) {
      return { memory: view, counted: false };
    }

    const recorded = await recordMemoryEvent({
      source: context.source,
      userId: context.learner.userId,
      item,
      existingRecord,
      eventType: REVIEW_EVENT_TYPES.RECALL,
      answer: input.answer,
      isCorrect: input.answer === item.meaning,
      requestId: input.requestId,
      now,
    });
    return { memory: recorded.view, counted: true };
  });
}
