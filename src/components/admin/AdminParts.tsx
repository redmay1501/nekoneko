import Link from 'next/link';
import type { ReactNode } from 'react';
import { ADMIN_MIGRATION_FILE } from '@/features/admin/admin-schema';

/** Phần dùng chung cho trang admin (server component). */
export function AdminPageHeader({ crumbs, title, actions }: { crumbs: Array<{ href?: string; label: string }>; title: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <nav className="adm-crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Admin</Link>
        {crumbs.map((crumb) => (
          <span key={crumb.label}> / {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</span>
        ))}
      </nav>
      <div className="adm-title">
        <h1>{title}</h1>
        {actions ? <div className="adm-actions">{actions}</div> : null}
      </div>
    </>
  );
}

export function MigrationNotice({ feature }: { feature: string }) {
  return (
    <div className="adm-notice" role="status">
      <span aria-hidden="true">🧩</span>
      <div>
        <b>Cần áp dụng migration</b> để dùng {feature}.<br />
        Mở Supabase → SQL Editor, dán nội dung tệp <code>{ADMIN_MIGRATION_FILE}</code> và bấm Run (chỉ thêm bảng mới, không sửa dữ liệu cũ).
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="adm-empty"><span style={{ fontSize: 28 }} aria-hidden="true">🌸</span><b>{title}</b>{children}</div>;
}

export function DemoNotice() {
  return (
    <div className="adm-notice info" role="status">
      <span aria-hidden="true">👀</span>
      <div><b>Chế độ demo (máy dev, không có Supabase):</b> xem bằng dữ liệu mẫu trong repo. Lưu, tải ảnh, quản lý tài khoản cần Supabase.</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: 'draft' | 'review' | 'published' | 'archived' }) {
  const labels = { draft: 'Nháp', review: 'Chờ duyệt', published: 'Đã xuất bản', archived: 'Lưu trữ' };
  return <span className={`adm-badge ${status}`}>{labels[status]}</span>;
}

export function Pager({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="adm-pager" aria-label="Phân trang">
      {page > 1 ? <Link className="adm-btn ghost sm" href={hrefFor(page - 1)}>← Trước</Link> : <span className="adm-btn ghost sm" aria-disabled="true" style={{ opacity: .45 }}>← Trước</span>}
      <span>Trang <b>{page}</b> / {pageCount}</span>
      {page < pageCount ? <Link className="adm-btn ghost sm" href={hrefFor(page + 1)}>Sau →</Link> : <span className="adm-btn ghost sm" aria-disabled="true" style={{ opacity: .45 }}>Sau →</span>}
    </nav>
  );
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}
