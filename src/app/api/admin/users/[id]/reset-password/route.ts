import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { sendPasswordReset } from '@/features/admin/users-admin';

/** Gửi email đặt lại mật khẩu (luồng Supabase) — admin không bao giờ thấy hay đặt mật khẩu. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('POST /api/admin/users/:id/reset-password', request, async (admin) =>
    sendPasswordReset(admin, z.string().uuid().parse((await params).id), new URL(request.url).origin));
}
