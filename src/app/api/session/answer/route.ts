import { z } from 'zod';
import { answerSessionStep } from '@/features/learning/session-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  stepIndex: z.number().int().min(0).max(100),
  answer: z.string().min(1).max(500),
});

/** Trả lời một bước trong phiên — server chấm và Memory Engine cập nhật trí nhớ. */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/session/answer', async () => {
    const input = answerSchema.parse(await request.json());
    return answerSessionStep(input);
  });
}
