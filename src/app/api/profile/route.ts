import { z } from 'zod';
import { getLearnerContext } from '@/features/learning/learner-context';
import { handleApiRoute } from '@/lib/api/route-handler';

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Tên không được để trống').max(40, 'Tên tối đa 40 ký tự'),
});

/** Đổi tên hiển thị — trong Cài đặt (Hồ sơ đã gộp vào Cài đặt). */
export async function PATCH(request: Request) {
  return handleApiRoute('PATCH /api/profile', async () => {
    const { displayName } = profileSchema.parse(await request.json());
    const context = await getLearnerContext();
    await context.source.updateDisplayName(context.learner.userId, displayName);
    return { displayName };
  });
}
