import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { findVideo } from '@/features/listening/video-library';
import { setVideoWatched } from '@/features/listening/video-progress';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

const watchedSchema = z.object({
  videoId: z.string().regex(/^[a-z]+-[\w-]{1,20}$/),
  watched: z.boolean(),
});

/** Đánh dấu / bỏ đánh dấu "đã xem" một video luyện nghe. Không ghi trí nhớ (xem video ≠ đã nhớ). */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/videos/watched', async () => {
    const input = watchedSchema.parse(await request.json());
    if (!findVideo(input.videoId)) throw new NotFoundError(input.videoId);
    const context = await getLearnerContext();
    const gameRecords = setVideoWatched(context.settings.gameRecords, input.videoId, input.watched, new Date());
    await context.source.updateSettings(context.learner.userId, { gameRecords });
    return { watched: input.watched };
  });
}
