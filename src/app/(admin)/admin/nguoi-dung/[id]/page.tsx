import { notFound } from 'next/navigation';
import { AdminPageHeader, formatDateTime } from '@/components/admin/AdminParts';
import { UserActions } from '@/components/admin/UserActions';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminUserDetail } from '@/features/admin/users-admin';
import { NotFoundError } from '@/lib/api/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (admin.isDemo || !UUID.test(id)) notFound();
  const user = await getAdminUserDetail(id).catch((error: unknown) => { if (error instanceof NotFoundError) notFound(); throw error; });
  const rows: Array<[string, string]> = [
    ['Email', user.email || '—'], ['Tên hiển thị', user.displayName || '—'], ['ID', user.id],
    ['Đăng nhập bằng', user.providers.join(', ') || '—'], ['Vai trò', user.roles.join(', ') || 'learner'],
    ['Tạo lúc', formatDateTime(user.createdAt)], ['Đăng nhập gần nhất', formatDateTime(user.lastSignInAt)],
    ['Xác minh email', user.emailConfirmedAt ? formatDateTime(user.emailConfirmedAt) : 'Chưa'],
    ['Khoá', user.isLocked ? `Đang khoá (tới ${formatDateTime(user.bannedUntil)})` : 'Không'],
    ['Ngày bắt đầu học', user.startDate ?? '—'], ['Đang ở ngày', user.currentDay ? `${user.currentDay}/90` : '—'],
    ['Hoàn thành lộ trình', user.journeyCompletedAt ? formatDateTime(user.journeyCompletedAt) : '—'],
  ];
  return (
    <>
      <AdminPageHeader crumbs={[{ href: '/admin/nguoi-dung', label: 'Người dùng' }, { label: user.email || user.id }]} title={user.email || user.id} />
      <div className="adm-two">
        <section className="adm-card">
          <h2>Thông tin</h2>
          <table className="adm-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th style={{ width: 190 }}>{label}</th><td style={{ wordBreak: 'break-all' }}>{value}</td></tr>)}</tbody></table>
          <h2 style={{ marginTop: 16 }}>Dữ liệu học (chỉ đếm)</h2>
          <div className="adm-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
            <div className="adm-stat"><b>{user.counts.memoryItems}</b><span>thẻ nhớ</span></div>
            <div className="adm-stat"><b>{user.counts.reviewEvents}</b><span>lượt trả lời</span></div>
            <div className="adm-stat"><b>{user.counts.sessions}</b><span>phiên học</span></div>
            <div className="adm-stat"><b>{user.counts.completedDays}</b><span>ngày đã xong</span></div>
          </div>
          <p className="adm-sm adm-muted" style={{ marginTop: 10 }}>Admin không sửa tiến độ, trí nhớ hay mật khẩu của người học.</p>
        </section>
        <UserActions user={{ id: user.id, email: user.email, isLocked: user.isLocked, isConfirmed: Boolean(user.emailConfirmedAt), isAdmin: user.roles.includes('admin'), isSelf: user.id === admin.userId, memoryItems: user.counts.memoryItems }} />
      </div>
    </>
  );
}
