import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { deleteAdminUser, getAdminUserDetail } from '@/features/admin/users-admin';

const idSchema = z.string().uuid();
const deleteSchema = z.object({ confirmEmail: z.string().max(320) }).strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('GET /api/admin/users/:id', request, async () => getAdminUserDetail(idSchema.parse((await params).id)));
}

/** Xoá tài khoản — body phải có email gõ lại đúng; server kiểm tra lại, không xoá chính mình hay admin. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('DELETE /api/admin/users/:id', request, async (admin) => {
    await deleteAdminUser(admin, idSchema.parse((await params).id), deleteSchema.parse(await request.json()).confirmEmail);
    return { ok: true };
  });
}
