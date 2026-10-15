import { AdminPageHeader, EmptyState, formatDateTime, MigrationNotice, Pager } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminSchema } from '@/features/admin/admin-schema';
import { AUDIT_ACTIONS, describeAuditAction } from '@/features/admin/audit-labels';
import type { AuditLogRow } from '@/features/admin/dashboard';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const PAGE_SIZE = 50;

/** Nhật ký thao tác admin (bảng admin_audit_log — chỉ server đọc được). Không chứa mật khẩu / token. */
export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<{ hanh?: string; trang?: string }> }) {
  const admin = await requireAdminPage();
  const search = await searchParams;
  const schema = await getAdminSchema();
  if (admin.isDemo || !schema.admin_audit_log) {
    return (<><AdminPageHeader crumbs={[{ label: 'Nhật ký' }]} title="Nhật ký" />{admin.isDemo ? <div className="adm-card"><EmptyState title="Chế độ demo không ghi nhật ký" /></div> : <MigrationNotice feature="nhật ký thao tác" />}</>);
  }
  const page = Math.max(1, Number(search.trang) || 1);
  let query = createAdminSupabaseClient().from('admin_audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (search.hanh && AUDIT_ACTIONS.includes(search.hanh)) query = query.eq('action', search.hanh);
  const { data, count, error } = await query;
  if (error) throw new Error(`Supabase: đọc nhật ký — ${error.message}`);
  const rows = (data ?? []) as AuditLogRow[];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Nhật ký' }]} title={`Nhật ký (${count ?? 0})`} />
      <form className="adm-filters" method="get">
        <label className="adm-field"><span>Hành động</span>
          <select className="adm-select" name="hanh" defaultValue={search.hanh ?? ''}><option value="">Tất cả</option>{AUDIT_ACTIONS.map((action) => <option key={action} value={action}>{describeAuditAction(action)}</option>)}</select></label>
        <button type="submit" className="adm-btn">Lọc</button>
      </form>
      {rows.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Thời gian</th><th>Admin</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="adm-sm" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(row.created_at)}</td>
                  <td className="adm-sm">{row.actor_email || '—'}</td>
                  <td>{describeAuditAction(row.action)}</td>
                  <td className="adm-sm">{row.target_type}{row.target_id ? ` #${row.target_id}` : ''}</td>
                  <td className="adm-sm" style={{ maxWidth: 380 }}><code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(row.detail)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="adm-card"><EmptyState title="Chưa có thao tác nào" /></div>}
      <Pager page={page} pageCount={pageCount} hrefFor={(target) => `/admin/nhat-ky?${new URLSearchParams({ ...(search.hanh ? { hanh: search.hanh } : {}), trang: String(target) })}`} />
    </>
  );
}
