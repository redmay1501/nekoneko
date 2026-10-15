import 'server-only';
import { ForbiddenError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';
import type { AdminUser } from './admin-access';
import { requireAdminApi, requireAdminWriter } from './admin-guard';

/**
 * Bọc mọi route /api/admin/*: kiểm tra quyền admin Ở SERVER trước khi làm bất cứ gì.
 * Thao tác ghi còn kiểm tra Origin (chống gửi hộ từ trang khác — ngoài cookie SameSite=Lax) và chặn chế độ demo.
 */
export function adminRoute<T>(name: string, request: Request, handler: (admin: AdminUser) => Promise<T>) {
  return handleApiRoute(name, async () => {
    const isWrite = request.method !== 'GET' && request.method !== 'HEAD';
    if (isWrite && !isSameOrigin(request)) throw new ForbiddenError();
    const admin = isWrite ? await requireAdminWriter() : await requireAdminApi();
    return handler(admin);
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Trình duyệt luôn gửi Origin với fetch POST/PATCH/DELETE; công cụ dòng lệnh vẫn phải qua kiểm tra quyền.
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
