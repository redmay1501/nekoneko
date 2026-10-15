import { AdminPageHeader, DemoNotice, MigrationNotice } from '@/components/admin/AdminParts';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminSchema, getMediaBucketStatus, MEDIA_BUCKET } from '@/features/admin/admin-schema';
import { listMedia } from '@/features/admin/media-admin';

/** Thư viện ảnh: lưới, tìm, lọc, xem lớn, tải nhiều ảnh, sao chép URL, sửa mô tả, xem nơi dùng, chặn xoá ảnh đang dùng. */
export default async function AdminMediaPage() {
  const admin = await requireAdminPage();
  const [schema, bucket] = await Promise.all([getAdminSchema(), getMediaBucketStatus()]);
  const isReady = schema.media_assets && schema.content_images;
  const assets = isReady ? await listMedia() : [];
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Media / Hình ảnh' }]} title={`Media / Hình ảnh${isReady ? ` (${assets.length})` : ''}`} />
      {admin.isDemo ? <DemoNotice /> : null}
      {!admin.isDemo && !isReady ? <MigrationNotice feature="thư viện ảnh" /> : null}
      {!admin.isDemo && bucket !== 'ok' ? (
        <div className="adm-notice error" style={{ marginBottom: 12 }}>Bucket Storage “{MEDIA_BUCKET}” {bucket === 'missing' ? 'chưa có' : 'chưa ở chế độ đọc công khai'} — chạy <code>npm run admin:storage</code>.</div>
      ) : null}
      {isReady ? <MediaLibrary initialAssets={assets} /> : null}
    </>
  );
}
