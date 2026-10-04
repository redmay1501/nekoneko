import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { DAILY_GOAL_OPTIONS, DEFAULT_REMINDER_TIME } from '@/features/progress/settings-options';
import { handleApiRoute } from '@/lib/api/route-handler';

const dailyMinutesValues = DAILY_GOAL_OPTIONS.map((option) => option.minutes) as [number, ...number[]];

const settingsSchema = z
  .object({
    dailyMinutes: z.number().int().refine((value) => dailyMinutesValues.includes(value)),
    autoplayAudio: z.boolean(),
    showFurigana: z.boolean(),
    gentleMode: z.boolean(),
    reminderEnabled: z.boolean(),
    voiceGender: z.enum(['female', 'male']),
    /** Chỉ nhận true: đánh dấu đã đi qua lời chào lần đầu (không có đường "chào lại"). */
    welcomed: z.literal(true),
  })
  .partial();

/** Cài đặt cá nhân. Không phải dữ liệu trí nhớ nên người học được tự đổi. */
export async function PATCH(request: Request) {
  return handleApiRoute('PATCH /api/settings', async () => {
    const { reminderEnabled, welcomed, ...patch } = settingsSchema.parse(await request.json());
    const context = await getLearnerContext();
    const reminderPatch = reminderEnabled === undefined ? {} : { reminderTime: reminderEnabled ? DEFAULT_REMINDER_TIME : null };
    const welcomePatch = welcomed ? { welcomedAt: new Date().toISOString() } : {};
    return context.source.updateSettings(context.learner.userId, { ...patch, ...reminderPatch, ...welcomePatch });
  });
}
