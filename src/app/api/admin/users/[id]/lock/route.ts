import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { setUserLocked } from '@/features/admin/users-admin';

const schema = z.object({ locked: z.boolean() }).strict();

/** Khoá / mở khoá đăng nhập (Supabase Auth ban_duration). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('POST /api/admin/users/:id/lock', request, async (admin) => {
    await setUserLocked(admin, z.string().uuid().parse((await params).id), schema.parse(await request.json()).locked);
    return { ok: true };
  });
}
