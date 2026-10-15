import Link from 'next/link';
import { AdminPageHeader, EmptyState, formatDateTime, Pager } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { listAdminUsers } from '@/features/admin/users-admin';

type Search = { q?: string; 'trang-thai'?: string; trang?: string };

/** Người dùng thật từ Supabase Auth + hồ sơ. Không có dữ liệu giả; chế độ demo không có tài khoản. */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdminPage();
  const search = await searchParams;
  if (admin.isDemo) {
    return (<><AdminPageHeader crumbs={[{ label: 'Người dùng' }]} title="Người dùng" /><div className="adm-card"><EmptyState title="Chế độ demo không có tài khoản">Cần Supabase Auth.</EmptyState></div></>);
  }
  const result = await listAdminUsers({ q: search.q, state: search['trang-thai'], page: Number(search.trang ?? 1) });
  const hrefFor = (page: number) => `/admin/nguoi-dung?${new URLSearchParams({ ...(search.q ? { q: search.q } : {}), ...(search['trang-thai'] ? { 'trang-thai': search['trang-thai'] } : {}), trang: String(page) })}`;
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Người dùng' }]} title={`Người dùng (${result.total})`} />
      <form className="adm-filters" method="get" role="search">
        <label className="adm-field"><span>Tìm</span><input className="adm-input" name="q" defaultValue={search.q ?? ''} placeholder="Email, tên, id" /></label>
        <label className="adm-field"><span>Lọc</span>
          <select className="adm-select" name="trang-thai" defaultValue={search['trang-thai'] ?? ''}>
            <option value="">Tất cả</option><option value="unconfirmed">Chưa xác minh email</option><option value="locked">Đang khoá</option><option value="admin">Admin</option>
          </select></label>
        <button type="submit" className="adm-btn">Lọc</button>
        {search.q || search['trang-thai'] ? <Link className="adm-btn ghost" href="/admin/nguoi-dung">Bỏ lọc</Link> : null}
      </form>
      {result.users.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Email</th><th>Tên</th><th>Ngày học</th><th>Tạo lúc</th><th>Đăng nhập gần nhất</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {result.users.map((user) => (
                <tr key={user.id}>
                  <td><Link className="adm-row-link" href={`/admin/nguoi-dung/${user.id}`}>{user.email || '(không có email)'}</Link></td>
                  <td>{user.displayName || '—'}</td>
                  <td>{user.currentDay ?? '—'}</td>
                  <td className="adm-sm">{formatDateTime(user.createdAt)}</td>
                  <td className="adm-sm">{formatDateTime(user.lastSignInAt)}</td>
                  <td className="adm-actions" style={{ gap: 4 }}>
                    {user.roles.includes('admin') ? <span className="adm-badge pink">admin</span> : null}
                    {user.isLocked ? <span className="adm-badge red">đang khoá</span> : null}
                    {!user.emailConfirmedAt ? <span className="adm-badge review">chưa xác minh</span> : <span className="adm-badge published">đã xác minh</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="adm-card"><EmptyState title="Không có tài khoản khớp" /></div>}
      <Pager page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </>
  );
}
