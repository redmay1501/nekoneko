import type { ReactNode } from 'react';
import { SakuraFall } from '@/components/layout/SakuraFall';

/** Trang đăng nhập tự dựng khung toàn màn hình (nền tranh) — layout chỉ thêm hoa anh đào rơi. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SakuraFall />
      {children}
    </>
  );
}
