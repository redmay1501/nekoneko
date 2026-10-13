import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { STUDY_ASKS, STUDY_TYPES, gradeStudyAnswer } from '@/features/learning/study-grading';
import { recordMemoryEvent } from '@/features/memory/memory-service';
import { REVIEW_EVENT_TYPES } from '@/features/memory/memory-types';
import { appDateKey } from '@/features/progress/recall-streak';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const answerSchema = z.object({
  contentKey: z.string().min(3),
  ask: z.enum(STUDY_ASKS),
  /** Câu trả lời người học chọn / gõ — SERVER chấm. */
  answer: z.string().max(300),
  /** Câu hỏi "từ ghép → cách đọc": từ ghép được hỏi. */
  prompt: z.string().max(60).optional(),
  requestId: z.string().min(8).max(100),
});

/**
 * Quiz trong luồng học theo ngày (Từ vựng · Ngữ pháp · Kanji). Mỗi câu trả lời là một lần nhớ lại thật → ghi vào trí nhớ.
 * Nhận cả mục CHƯA học (đang học lần đầu trong luồng này). Xem flashcard không gọi API này — chỉ trả lời mới ghi.
 * Mỗi mục tính TỐI ĐA MỘT LẦN MỖI NGÀY (làm lại quiz không "bơm" điểm): đã gặp hôm nay → `counted: false`, vẫn trả kết quả chấm.
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/study/answer', async () => {
    const input = answerSchema.parse(await request.json());
    const context = await getLearnerContext();
    const item = findKnowledgeItem(context.catalog, input.contentKey);
    if (!item || !(STUDY_TYPES as readonly string[]).includes(item.type)) throw new NotFoundError(input.contentKey);
    const isCorrect = gradeStudyAnswer(item, input.ask, input.answer, input.prompt);
    if (isCorrect === null) throw new NotFoundError(`${input.contentKey}:${input.ask}`);

    const now = new Date();
    const view = context.memoryViews.get(item.key) ?? null;
    const existingRecord = context.memoryRecords.get(item.key) ?? null;
    if (existingRecord?.lastSeenAt && appDateKey(new Date(existingRecord.lastSeenAt)) === appDateKey(now)) {
      return { isCorrect, memory: view, counted: false };
    }

    const recorded = await recordMemoryEvent({
      source: context.source,
      userId: context.learner.userId,
      item,
      existingRecord,
      eventType: REVIEW_EVENT_TYPES.RECALL,
      answer: input.answer,
      isCorrect,
      requestId: input.requestId,
      now,
    });
    return { isCorrect, memory: recorded.view, counted: true };
  });
}
