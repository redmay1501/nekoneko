import { z } from 'zod';
import { mergeStreakRecord } from '@/features/games/neko-streak';
import { getLearnerContext } from '@/features/learning/learner-context';
import { handleApiRoute } from '@/lib/api/route-handler';

const streakSchema = z.object({
  /** Chuỗi đúng liên tiếp vừa đạt (server chỉ giữ giá trị lớn nhất — gửi lại / lệch thứ tự không làm kỷ lục lùi). */
  streak: z.number().int().min(0).max(100_000),
  /** Lần gửi đầu của một phiên chơi → đếm một lượt chơi. */
  newSession: z.boolean().optional(),
});

/**
 * Neko Streak — lưu kỷ lục chuỗi đúng của người học (user_settings.game_records, khoá "streak:best").
 * KHÔNG ghi trí nhớ / tiến độ: trả lời đúng trong game không đổi memory_score hay lộ trình.
 */
export async function POST(request: Request) {
  return handleApiRoute('POST /api/games/streak', async () => {
    const input = streakSchema.parse(await request.json());
    const context = await getLearnerContext();
    const merged = mergeStreakRecord(context.settings.gameRecords, input.streak, new Date(), input.newSession ?? false);
    await context.source.updateSettings(context.learner.userId, { gameRecords: merged.records });
    return { best: merged.record.bestStreak ?? 0, isNewBest: merged.isNewBest };
  });
}
