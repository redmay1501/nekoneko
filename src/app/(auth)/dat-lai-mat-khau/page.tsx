import type { Metadata } from 'next';
import { BrandLogo } from '@/components/common/BrandLogo';
import { isDemoMode } from '@/config/env';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = { title: 'Đặt lại mật khẩu', robots: { index: false } };

/** Trang mở từ email đặt lại mật khẩu (Supabase Auth). Không cần đăng nhập — liên kết mang phiên tạm thời. */
export default function ResetPasswordPage() {
  return (
    <main className="login-page">
      <div className="login-scene">
        {/* Cùng tranh nền với trang đăng nhập: máy tính có chuột → tranh có khung thẻ vẽ sẵn (xem globals.css .login-*). */}
        <picture>
          <source media="(min-width: 1100px) and (hover: hover) and (pointer: fine)" sizes="100vw"
            srcSet="/brand/login-bg-1100.webp 1100w, /brand/login-bg-1920.webp 1920w, /brand/login-bg-2560.webp 2560w" />
          <img className="login-bg" src="/brand/login-touch-1600.webp" sizes="(orientation: portrait) 178vh, 100vw"
            srcSet="/brand/login-touch-1000.webp 1000w, /brand/login-touch-1600.webp 1600w, /brand/login-touch-2560.webp 2560w"
            alt="" aria-hidden="true" />
        </picture>
        <section className="login-card" aria-labelledby="reset-title">
          <BrandLogo width={220} priority className="login-logo" />
          <h1 id="reset-title" className="login-subtitle">Đặt mật khẩu mới</h1>
          {isDemoMode() ? <p className="login-demo">Chế độ demo không có tài khoản nên không cần đặt lại mật khẩu.</p> : <ResetPasswordForm />}
        </section>
      </div>
    </main>
  );
}
