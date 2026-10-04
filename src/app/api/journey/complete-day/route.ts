import { z } from 'zod';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { completeJourneyDayManually } from '@/features/roadmap/journey-service';
import { handleApiRoute } from '@/lib/api/route-handler';

const completeDaySchema = z.object({
  day: z.number().int().min(1).max(JOURNEY_TOTAL_DAYS),
});

/** Người học bấm "Hoàn thành ngày X" → mở ngày kế tiếp ngay. */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/journey/complete-day', async () => {
    const { day } = completeDaySchema.parse(await request.json());
    return completeJourneyDayManually(day);
  });
}
