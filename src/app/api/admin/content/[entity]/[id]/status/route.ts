import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { setEntityStatus } from '@/features/admin/content-admin';
import { CONTENT_STATUSES } from '@/features/admin/content-entities';
import { contentTargetOf as targetOf } from '@/features/admin/route-params';

const schema = z.object({ status: z.enum(CONTENT_STATUSES), note: z.string().max(500).default('') }).strict();

export async function PUT(request: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return adminRoute('PUT /api/admin/content/:id/status', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    const input = schema.parse(await request.json());
    await setEntityStatus(admin, entity, id, input.status, input.note);
    return { ok: true };
  });
}
