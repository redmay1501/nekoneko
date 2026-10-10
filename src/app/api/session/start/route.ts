import { z } from 'zod';
import { MAX_FOCUS_ITEMS, SESSION_MODES } from '@/features/learning/session-modes';
import { startLearningSession } from '@/features/learning/session-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const startSchema = z.object({
  mode: z.nativeEnum(SESSION_MODES),
  /** Chế độ "focus": kiến thức người học chọn (server lọc lại khoá hợp lệ). */
  contentKeys: z.array(z.string().max(40)).max(MAX_FOCUS_ITEMS).optional(),
});

export async function POST(request: Request) {
  return handleApiRoute('POST /api/session/start', async () => {
    const { mode, contentKeys } = startSchema.parse(await request.json());
    return startLearningSession(mode, contentKeys);
  });
}
