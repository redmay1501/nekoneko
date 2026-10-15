import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { setEntityDay } from '@/features/admin/content-admin';
import { contentTargetOf as targetOf } from '@/features/admin/route-params';

const schema = z.object({ day: z.number().int().min(1).max(90).nullable() }).strict();

/** Gắn mục vào một ngày của lộ trình, hoặc gỡ (day = null). Không đổi tiến độ của người học. */
export async function PUT(request: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return adminRoute('PUT /api/admin/content/:id/day', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    await setEntityDay(admin, entity, id, schema.parse(await request.json()).day);
    return { ok: true };
  });
}
