import { z } from 'zod';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { setJourneyStartingPoint } from '@/features/roadmap/journey-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const startingPointSchema = z.object({
  completedThroughDay: z.number().int().min(1).max(JOURNEY_TOTAL_DAYS - 1),
});

/** Tài khoản mới có thể khai báo các ngày đã hoàn thành ở tài khoản cũ. */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/journey/set-starting-point', async () => {
    const { completedThroughDay } = startingPointSchema.parse(await request.json());
    return setJourneyStartingPoint(completedThroughDay);
  });
}
