import Link from 'next/link';
import { AdminPageHeader, DemoNotice, MigrationNotice, formatDateTime } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { ADMIN_ENTITIES, ENTITY_CONFIG } from '@/features/admin/content-entities';
import { loadDashboard } from '@/features/admin/dashboard';
import { describeAuditAction } from '@/features/admin/audit-labels';

/** Dashboard — chỉ số liệu thật (đếm từ database / tệp nội dung). */
export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();
  const data = await loadDashboard();
  const missingTables = Object.entries(data.schema).filter(([, exists]) => !exists).map(([table]) => table);

  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Dashboard' }]} title="Dashboard" actions={(
        <>
          <Link className="adm-btn" href="/admin/tu-vung/moi">+ Thêm từ vựng</Link>
          <Link className="adm-btn ghost" href="/admin/media">Tải ảnh lên</Link>
          <Link className="adm-btn ghost" href="/admin/chat-luong">Kiểm tra chất lượng</Link>
        </>
      )} />
      {admin.isDemo ? <DemoNotice /> : null}
      {!admin.isDemo && missingTables.length ? <MigrationNotice feature={`ảnh minh hoạ, trạng thái nội dung và nhật ký (thiếu bảng: ${missingTables.join(', ')})`} /> : null}

      <section className="adm-grid" style={{ marginTop: 14 }} aria-label="Nội dung">
        {ADMIN_ENTITIES.map((entity) => {
          const stats = data.contentStats[entity];
          const hidden = stats.byStatus.draft + stats.byStatus.review + stats.byStatus.archived;
          return (
            <Link key={entity} href={`/admin/${ENTITY_CONFIG[entity].slug}`} className="adm-card adm-stat">
              <span>{ENTITY_CONFIG[entity].label}</span>
              <b>{stats.total}</b>
              <span>{stats.byStatus.published} đang hiện{hidden ? ` · ${hidden} ẩn` : ''}{stats.withImage ? ` · ${stats.withImage} có ảnh` : ''}</span>
            </Link>
          );
        })}
        <Link href="/admin/bai-doc" className="adm-card adm-stat"><span>Bài đọc</span><b>{data.readingPassages}</b><span>trong tệp nội dung</span></Link>
        <Link href="/admin/video" className="adm-card adm-stat"><span>Video luyện nghe</span><b>{data.videos.published}</b><span>đang hiện / {data.videos.total} trong tệp</span></Link>
        <Link href="/admin/lo-trinh" className="adm-card adm-stat"><span>Lộ trình</span><b>{data.journeyDays}/90</b><span>{data.daysWithGaps} ngày cần xem · {data.duplicates} nhóm trùng</span></Link>
        <Link href="/admin/media" className="adm-card adm-stat"><span>Ảnh trong thư viện</span><b>{data.mediaCount ?? '—'}</b><span>{data.mediaCount === null ? 'chưa có bảng media' : 'ảnh đã tải lên'}</span></Link>
      </section>

      <div className="adm-two" style={{ marginTop: 16 }}>
        <section className="adm-card">
          <h2>Người dùng</h2>
          {data.users ? (
            <div className="adm-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
              <Link href="/admin/nguoi-dung" className="adm-stat"><b>{data.users.total}</b><span>tài khoản</span></Link>
              <Link href="/admin/nguoi-dung?trang-thai=unconfirmed" className="adm-stat"><b>{data.users.unconfirmed}</b><span>chưa xác minh email</span></Link>
              <Link href="/admin/nguoi-dung?trang-thai=locked" className="adm-stat"><b>{data.users.locked}</b><span>đang khoá</span></Link>
              <Link href="/admin/nguoi-dung?trang-thai=admin" className="adm-stat"><b>{data.users.admins}</b><span>admin</span></Link>
            </div>
          ) : <p className="adm-muted adm-sm">Cần Supabase để xem tài khoản.</p>}
          <h2 style={{ marginTop: 18 }}>Chất lượng nội dung</h2>
          <p className="adm-sm"><b style={{ color: data.issues.errors ? '#B0213A' : undefined }}>{data.issues.errors} lỗi</b> · {data.issues.warnings} cảnh báo — <Link href="/admin/chat-luong" style={{ textDecoration: 'underline' }}>xem chi tiết</Link></p>
        </section>
        <section className="adm-card">
          <h2>Thao tác gần đây</h2>
          {data.recentLogs.length ? (
            <ul className="adm-list">
              {data.recentLogs.map((log) => (
                <li key={log.id}><span className="adm-muted adm-sm" style={{ flex: '0 0 auto' }}>{formatDateTime(log.created_at)}</span><span className="adm-sm">{describeAuditAction(log.action)} <span className="adm-muted">{log.target_type}{log.target_id ? ` #${log.target_id}` : ''}</span></span></li>
              ))}
            </ul>
          ) : <p className="adm-muted adm-sm">{data.schema.admin_audit_log ? 'Chưa có thao tác nào.' : 'Nhật ký cần migration admin.'}</p>}
          <p style={{ marginTop: 10 }}><Link className="adm-btn ghost sm" href="/admin/nhat-ky">Xem nhật ký</Link></p>
        </section>
      </div>
    </>
  );
}
