import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildNotebooks, findNotebookPage } from '@/features/writing/notebook';
import { applyNotebookAction, pageProgressOf } from '@/features/writing/notebook-progress';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const schema = z.object({
  pageId: z.string().regex(/^[a-z-]+-\d{1,3}$/),
  action: z.enum(['start', 'complete', 'uncomplete']),
}).strict();

/**
 * Tiến độ Sổ luyện viết: bắt đầu (nét đầu tiên), đã luyện xong (người học tự bấm), bỏ đánh dấu.
 * Chỉ ghi user_settings.game_records — KHÔNG ghi trí nhớ, KHÔNG đổi ngày lộ trình.
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/writing/notebook', async () => {
    const input = schema.parse(await request.json());
    const context = await getLearnerContext();
    const page = findNotebookPage(buildNotebooks(context.catalog.content), input.pageId);
    if (!page) throw new NotFoundError(input.pageId);
    const gameRecords = applyNotebookAction(context.settings.gameRecords, page.notebookId, page.id, input.action, new Date());
    await context.source.updateSettings(context.learner.userId, { gameRecords });
    return { progress: pageProgressOf(gameRecords, page.notebookId, page.id) };
  });
}
