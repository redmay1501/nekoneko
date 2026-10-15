import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { resendVerification } from '@/features/admin/users-admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute('POST /api/admin/users/:id/resend-verification', request, async (admin) =>
    resendVerification(admin, z.string().uuid().parse((await params).id), new URL(request.url).origin));
}
