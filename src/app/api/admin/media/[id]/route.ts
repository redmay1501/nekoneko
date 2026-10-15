import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { deleteMedia, updateMediaAlt } from '@/features/admin/media-admin';

const idSchema = z.string().uuid();
const altSchema = z.object({ altText: z.string().max(300) }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('PATCH /api/admin/media/:id', request, async (admin) => {
    await updateMediaAlt(admin, idSchema.parse((await params).id), altSchema.parse(await request.json()).altText);
    return { ok: true };
  });
}

/** Xoá ảnh — bị chặn nếu ảnh đang gắn vào bất kỳ mục nội dung nào. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('DELETE /api/admin/media/:id', request, async (admin) => {
    await deleteMedia(admin, idSchema.parse((await params).id));
    return { ok: true };
  });
}
