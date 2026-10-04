import Link from 'next/link';
import { BrandLogo } from '@/components/common/BrandLogo';
import { APP_NAME } from '@/config/brand';
import { isDemoMode } from '@/config/env';
import { SignInForm } from './SignInForm';

/** Bố cục "thẻ khớp khung tranh" chỉ cho máy tính có chuột — phải giống hệt điều kiện @media trong globals.css (.login-*). */
const DESKTOP_LOGIN_MEDIA = '(min-width: 1100px) and (max-aspect-ratio: 2/1) and (hover: hover) and (pointer: fine)';

/**
 * SC-02 · Đăng nhập / Đăng ký.
 * Máy tính có chuột: nền login-bg-*.webp có sẵn một khung thẻ trống bên phải — khung cảnh phóng như object-fit: cover
 * và thẻ đăng nhập đặt đúng toạ độ khung đó. iPad / điện thoại: nền login-touch-*.webp (không khung), thẻ kính
 * trong suốt nằm giữa màn hình. Chi tiết ở globals.css (.login-*).
 */
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ tiep?: string; loi?: string }> }) {
  const { tiep, loi } = await searchParams;
  return (
    <main className="login-page">
      <div className="login-scene">
        {/* Hai tranh nền, trình duyệt chỉ tải một: máy tính có chuột → tranh có khung thẻ vẽ sẵn (thẻ đặt khớp vào);
            iPad / điện thoại → tranh không khung, nhìn xuyên qua thẻ trong suốt. Điều kiện media khớp với globals.css. */}
        <picture>
          <source media={DESKTOP_LOGIN_MEDIA} sizes="100vw"
            srcSet="/brand/login-bg-1100.webp 1100w, /brand/login-bg-1920.webp 1920w, /brand/login-bg-2560.webp 2560w" />
          <img className="login-bg" src="/brand/login-touch-1600.webp" sizes="(orientation: portrait) 178vh, 100vw"
            srcSet="/brand/login-touch-1000.webp 1000w, /brand/login-touch-1600.webp 1600w, /brand/login-touch-2560.webp 2560w"
            alt="" aria-hidden="true" fetchPriority="high" />
        </picture>

        <section className="login-card" aria-labelledby="login-title">
          <h1 id="login-title" className="sr-only">{APP_NAME}</h1>
          <BrandLogo width={260} className="login-logo" />
          <p className="login-subtitle">Học tiếng Nhật nhẹ nhàng cùng Neko</p>
          {isDemoMode() ? (
            <div className="login-demo">
              <b>Đang chạy chế độ demo</b>
              <p>Chưa cấu hình Supabase nên không cần đăng nhập.</p>
              <Link className="login-submit" href="/">🐾 Vào học ngay</Link>
            </div>
          ) : (
            <SignInForm redirectTo={tiep && tiep.startsWith('/') && !tiep.startsWith('//') ? tiep : '/'} hasConfirmationError={loi === 'xac-nhan'} />
          )}
        </section>
      </div>
    </main>
  );
}
