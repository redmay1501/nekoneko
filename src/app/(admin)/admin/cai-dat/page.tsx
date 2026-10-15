import { AdminPageHeader } from '@/components/admin/AdminParts';
import { isSupabaseConfigured, publicEnv } from '@/config/env';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { ADMIN_MIGRATION_FILE, ADMIN_TABLES, getAdminSchema, getMediaBucketStatus, MEDIA_BUCKET } from '@/features/admin/admin-schema';
import { MAX_IMAGE_BYTES } from '@/features/admin/media-validation';

/** Cài đặt / tình trạng hệ thống — chỉ hiện có / không, KHÔNG BAO GIỜ in khoá hay URL bí mật. */
export default async function AdminSettingsPage() {
  const admin = await requireAdminPage();
  const [schema, bucket] = await Promise.all([getAdminSchema(), getMediaBucketStatus()]);
  const check = (ok: boolean, text = ok ? 'Có' : 'Chưa') => <span className={`adm-badge ${ok ? 'published' : 'red'}`}>{text}</span>;
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Cài đặt' }]} title="Cài đặt & tình trạng" />
      <div className="adm-two">
        <section className="adm-card">
          <h2>Kết nối</h2>
          <table className="adm-table"><tbody>
            <tr><th>Môi trường</th><td>{publicEnv.appEnvironment}{admin.isDemo ? ' (demo)' : ''}</td></tr>
            <tr><th>Supabase</th><td>{check(isSupabaseConfigured())}</td></tr>
            <tr><th>Khoá service role (chỉ ở server)</th><td>{check(Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY))}</td></tr>
            <tr><th>Bucket ảnh “{MEDIA_BUCKET}”</th><td>{bucket === 'ok' ? check(true, 'Sẵn sàng (đọc công khai)') : bucket === 'unknown' ? '—' : check(false, bucket === 'missing' ? 'Chưa có — npm run admin:storage' : 'Chưa đọc công khai')}</td></tr>
          </tbody></table>
          <h2 style={{ marginTop: 16 }}>Migration admin</h2>
          <p className="adm-sm adm-muted" style={{ marginBottom: 8 }}>Tệp <code>{ADMIN_MIGRATION_FILE}</code> — chạy trong Supabase SQL Editor (chỉ thêm bảng).</p>
          <table className="adm-table"><tbody>{ADMIN_TABLES.map((table) => <tr key={table}><th>{table}</th><td>{check(schema[table], schema[table] ? 'Đã có' : 'Chưa có')}</td></tr>)}</tbody></table>
        </section>
        <section className="adm-card">
          <h2>Quy tắc đang áp dụng</h2>
          <ul className="adm-list adm-sm">
            <li>• Quyền admin: bảng <code>app_roles</code> (role “admin”), cấp bằng <code>npm run admin:grant -- &lt;email&gt;</code>; không có email admin trong mã.</li>
            <li>• Mọi trang /admin và API /api/admin/* kiểm tra quyền ở server; thao tác ghi kiểm tra thêm Origin.</li>
            <li>• Ảnh: JPEG / PNG / WebP, tối đa {MAX_IMAGE_BYTES / 1024 / 1024} MB, kiểm tra chữ ký file ở server, tên file tự sinh (uuid).</li>
            <li>• Không xoá / ẩn mục đã có thẻ nhớ của người học; không xoá ảnh đang dùng.</li>
            <li>• Mục mới bắt đầu là Nháp (khi đã có bảng trạng thái).</li>
            <li>• Email đặt lại mật khẩu / xác minh do Supabase gửi — mailer mặc định của Supabase giới hạn số email mỗi giờ; cần SMTP riêng nếu gửi nhiều.</li>
            <li>• Liên kết trong email trỏ về <code>/dat-lai-mat-khau</code> và <code>/auth/callback</code> — các URL này phải nằm trong Redirect URLs của Supabase Auth.</li>
            <li>• <code>npm run seed:content</code> ghi đè nội dung theo tệp trong repo → sửa đổi làm ở admin trên cùng id sẽ mất (mục admin thêm mới không bị xoá).</li>
          </ul>
        </section>
      </div>
    </>
  );
}
