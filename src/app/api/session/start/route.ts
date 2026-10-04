import { z } from 'zod';
import { SESSION_MODES } from '@/features/learning/session-modes';
import { startLearningSession } from '@/features/learning/session-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const startSchema = z.object({
  mode: z.nativeEnum(SESSION_MODES),
});

export async function POST(request: Request) {
  return handleApiRoute('POST /api/session/start', async () => {
    const { mode } = startSchema.parse(await request.json());
    return startLearningSession(mode);
  });
}
