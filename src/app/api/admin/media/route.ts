import { adminRoute } from '@/features/admin/admin-route';
import { listMedia, uploadMedia } from '@/features/admin/media-admin';
import { ActionRejectedError } from '@/lib/api/errors';

const MAX_FILES_PER_REQUEST = 10;

export async function GET(request: Request) {
  return adminRoute('GET /api/admin/media', request, async () => {
    const url = new URL(request.url);
    const used = url.searchParams.get('used');
    return { assets: await listMedia({ q: url.searchParams.get('q') ?? '', type: url.searchParams.get('type') ?? 'all', used: used === 'used' || used === 'unused' ? used : 'all' }) };
  });
}

/**
 * Tải ảnh lên (multipart/form-data, trường "files", tối đa 10 ảnh mỗi lần, "altText" tuỳ chọn).
 * Server tự kiểm loại ảnh bằng chữ ký file + kích thước — không tin phần mở rộng hay loại trình duyệt gửi.
 */
export async function POST(request: Request) {
  return adminRoute('POST /api/admin/media', request, async (admin) => {
    const form = await request.formData().catch(() => null);
    if (!form) throw new ActionRejectedError('Không đọc được file gửi lên.', 400);
    const files = form.getAll('files').filter((value): value is File => value instanceof File);
    if (!files.length) throw new ActionRejectedError('Chưa chọn ảnh nào.', 400);
    if (files.length > MAX_FILES_PER_REQUEST) throw new ActionRejectedError(`Tối đa ${MAX_FILES_PER_REQUEST} ảnh mỗi lần.`, 400);
    const altText = String(form.get('altText') ?? '');
    const results = [];
    for (const file of files) {
      try {
        const asset = await uploadMedia(admin, { name: file.name, type: file.type, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) }, altText);
        results.push({ name: file.name, ok: true as const, asset });
      } catch (error) {
        if (!(error instanceof ActionRejectedError)) throw error;
        results.push({ name: file.name, ok: false as const, error: error.message });
      }
    }
    return { results };
  });
}
