import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminPage } from '@/features/admin/admin-guard';
import './admin.css';

export const metadata: Metadata = { title: 'Admin Studio — NekoNeko', robots: { index: false, follow: false } };
/** Luôn kiểm quyền theo từng request — không bao giờ dựng sẵn lúc build. */
export const dynamic = 'force-dynamic';

/**
 * Khu /admin. Kiểm tra quyền ở SERVER trước khi vẽ bất cứ gì: chưa đăng nhập → trang đăng nhập; không phải admin → 404.
 * (Mỗi trang con và mọi API /api/admin/* cũng tự kiểm tra lại — layout không phải lớp bảo vệ duy nhất.)
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell email={admin.email} isDemo={admin.isDemo}>{children}</AdminShell>;
}
