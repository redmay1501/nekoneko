'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch, useAdminUi } from './AdminUi';

interface UserActionTarget {
  id: string;
  email: string;
  isLocked: boolean;
  isConfirmed: boolean;
  isAdmin: boolean;
  isSelf: boolean;
  memoryItems: number;
}

/** Thao tác tài khoản — server kiểm tra lại mọi quy tắc (không tự khoá / xoá mình, không xoá admin, email phải khớp). */
export function UserActions({ user }: { user: UserActionTarget }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(name: string, url: string, body: unknown, success: string) {
    setBusy(name);
    const result = await adminFetch(url, { method: name === 'delete' ? 'DELETE' : 'POST', body: JSON.stringify(body) });
    setBusy(null);
    if (!result.ok) { toast(result.error, 'error'); return false; }
    toast(success);
    return true;
  }

  async function sendReset() {
    if (!(await confirm({ title: 'Gửi email đặt lại mật khẩu?', body: <>Supabase gửi liên kết tới <b>{user.email}</b>. Người dùng tự đặt mật khẩu mới ở trang NekoNeko. Admin không thấy mật khẩu.</>, confirmLabel: 'Gửi email' }))) return;
    await run('reset', `/api/admin/users/${user.id}/reset-password`, {}, `Đã yêu cầu Supabase gửi email tới ${user.email}.`);
  }
  async function resend() {
    await run('resend', `/api/admin/users/${user.id}/resend-verification`, {}, `Đã gửi lại email xác minh tới ${user.email}.`);
  }
  async function toggleLock() {
    const locking = !user.isLocked;
    const ok = await confirm({
      title: locking ? 'Khoá tài khoản này?' : 'Mở khoá tài khoản?', tone: locking ? 'danger' : 'default', confirmLabel: locking ? 'Khoá' : 'Mở khoá',
      body: locking ? 'Người dùng không đăng nhập lại / làm mới phiên được nữa. Phiên đang mở có thể còn dùng tối đa ~1 giờ (tới khi token hết hạn). Dữ liệu học giữ nguyên.' : 'Người dùng đăng nhập lại được bình thường.',
    });
    if (!ok) return;
    if (await run('lock', `/api/admin/users/${user.id}/lock`, { locked: locking }, locking ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.')) router.refresh();
  }
  async function remove() {
    const first = await confirm({
      title: 'Xoá hẳn tài khoản này?', tone: 'danger', confirmLabel: 'Tiếp tục',
      body: <>Xoá tài khoản <b>{user.email}</b> sẽ xoá luôn hồ sơ, {user.memoryItems} thẻ nhớ, lịch sử ôn tập và tiến độ lộ trình của người này. <b>Không hoàn tác được.</b></>,
    });
    if (!first) return;
    const second = await confirm({ title: 'Xác nhận lần cuối', tone: 'danger', confirmLabel: 'Xoá vĩnh viễn', typeToConfirm: user.email, body: 'Gõ lại đúng email để xoá.' });
    if (!second) return;
    if (await run('delete', `/api/admin/users/${user.id}`, { confirmEmail: user.email }, `Đã xoá tài khoản ${user.email}.`)) {
      router.push('/admin/nguoi-dung');
      router.refresh();
    }
  }

  const disabledReason = user.isSelf ? 'Đây là tài khoản của bạn.' : user.isAdmin ? 'Tài khoản admin — gỡ quyền bằng script trước.' : null;
  return (
    <section className="adm-card">
      <h2>Thao tác</h2>
      <div className="adm-list">
        <div><button type="button" className="adm-btn ghost" disabled={busy !== null || !user.email} onClick={sendReset}>Gửi email đặt lại mật khẩu</button>
          <p className="adm-sm adm-muted" style={{ marginTop: 4 }}>Qua email của Supabase; liên kết mở trang /dat-lai-mat-khau.</p></div>
        <div><button type="button" className="adm-btn ghost" disabled={busy !== null || user.isConfirmed || !user.email} onClick={resend}>Gửi lại email xác minh</button>
          {user.isConfirmed ? <p className="adm-sm adm-muted" style={{ marginTop: 4 }}>Email đã xác minh.</p> : null}</div>
        <div><button type="button" className={`adm-btn ${user.isLocked ? 'ghost' : 'danger'}`} disabled={busy !== null || Boolean(disabledReason)} onClick={toggleLock}>{user.isLocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}</button>
          {disabledReason ? <p className="adm-sm adm-muted" style={{ marginTop: 4 }}>{disabledReason}</p> : null}</div>
        <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 12 }}>
          <button type="button" className="adm-btn danger" disabled={busy !== null || Boolean(disabledReason)} onClick={remove}>Xoá tài khoản…</button>
          <p className="adm-sm adm-muted" style={{ marginTop: 4 }}>Hai bước xác nhận + gõ lại email. Server kiểm tra lại.</p>
        </div>
      </div>
    </section>
  );
}
