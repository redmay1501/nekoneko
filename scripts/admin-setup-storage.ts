/**
 * Tạo bucket Supabase Storage cho ảnh minh hoạ nội dung (chạy một lần, chạy lại vẫn an toàn).
 *
 *   npm run admin:storage
 *
 * - Bucket "content-media": ĐỌC công khai (ảnh dùng trong bài học), chỉ JPEG / PNG / WebP, tối đa 2 MB.
 * - Không tạo policy ghi cho storage.objects → chỉ server (service role, qua /api/admin/media) tải lên / xoá được.
 */
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv, requireEnv } from './load-env';

const BUCKET = 'content-media';
const OPTIONS = { public: true, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], fileSizeLimit: 2 * 1024 * 1024 };

async function main() {
  loadLocalEnv();
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const existing = await supabase.storage.getBucket(BUCKET);
  const result = existing.data
    ? await supabase.storage.updateBucket(BUCKET, OPTIONS)
    : await supabase.storage.createBucket(BUCKET, OPTIONS);
  if (result.error) throw new Error(result.error.message);
  const check = await supabase.storage.getBucket(BUCKET);
  console.log(`✓ bucket ${BUCKET}: ${existing.data ? 'đã cập nhật' : 'đã tạo'} — public=${check.data?.public}, giới hạn=${check.data?.file_size_limit} byte, loại=${check.data?.allowed_mime_types?.join(', ')}`);
}

main().catch((error: unknown) => {
  console.error('✗ Không tạo được bucket', error instanceof Error ? error.message : error);
  process.exit(1);
});
