import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { setEntityImage } from '@/features/admin/content-admin';
import { contentTargetOf as targetOf } from '@/features/admin/route-params';

const schema = z.object({ assetId: z.string().uuid(), altText: z.string().max(300).default('') }).strict();

/** Gắn hoặc thay ảnh minh hoạ của một mục (ảnh đã có trong thư viện). */
export async function PUT(request: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return adminRoute('PUT /api/admin/content/:id/image', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    const input = schema.parse(await request.json());
    await setEntityImage(admin, entity, id, input.assetId, input.altText);
    return { ok: true };
  });
}

/** Gỡ ảnh khỏi mục — ảnh vẫn còn trong thư viện. */
export async function DELETE(request: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return adminRoute('DELETE /api/admin/content/:id/image', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    await setEntityImage(admin, entity, id, null, '');
    return { ok: true };
  });
}
