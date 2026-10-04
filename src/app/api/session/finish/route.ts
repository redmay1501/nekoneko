import { z } from 'zod';
import { finishLearningSession } from '@/features/learning/session-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const finishSchema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  return handleApiRoute('POST /api/session/finish', async () => {
    const { sessionId } = finishSchema.parse(await request.json());
    return { summary: await finishLearningSession(sessionId) };
  });
}
