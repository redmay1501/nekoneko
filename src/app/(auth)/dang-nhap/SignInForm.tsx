'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { USER_MESSAGES } from '@/lib/constants/messages';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { startNavigation } from '@/stores/navigation-progress-store';

type FormMode = 'sign-in' | 'sign-up';
const MIN_PASSWORD_LENGTH = 6;

/** Đăng nhập bằng email/mật khẩu hoặc Google (Supabase Auth). */
export function SignInForm({ redirectTo, hasConfirmationError }: { redirectTo: string; hasConfirmationError: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(hasConfirmationError ? 'Liên kết xác nhận đã hết hạn. Bạn đăng nhập lại nhé.' : null);
  const [isBusy, setIsBusy] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const callbackUrl = () => `${window.location.origin}/auth/callback?tiep=${encodeURIComponent(redirectTo)}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: callbackUrl() } });
    if (result.error) {
      setIsBusy(false);
      setMessage(mode === 'sign-in' ? 'Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé.' : USER_MESSAGES.GENERIC_ERROR);
      return;
    }
    if (mode === 'sign-up' && !result.data.session) {
      setIsBusy(false);
      setMessage('Mình đã gửi email xác nhận. Mở email và bấm vào liên kết để bắt đầu nhé 🌸');
      return;
    }
    // Đăng nhập xong: giữ nút ở trạng thái bận cho tới khi trang học mở ra.
    startNavigation();
    router.replace(redirectTo);
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } });
    if (error) setMessage(USER_MESSAGES.GENERIC_ERROR);
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <div className="login-tabs" role="tablist" aria-label="Đăng nhập hoặc tạo tài khoản">
        <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'on' : ''} onClick={() => setMode('sign-in')}>
          <MailIcon /> Đăng nhập
        </button>
        <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'on' : ''} onClick={() => setMode('sign-up')}>
          <UserIcon /> Đăng ký
        </button>
      </div>

      {mode === 'sign-up' ? (
        <label className="login-field">
          <span>Tên của bạn</span>
          <span className="login-input"><UserIcon />
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required autoComplete="nickname" placeholder="Bạn muốn Neko gọi bạn là gì?" />
          </span>
        </label>
      ) : null}
      <label className="login-field">
        <span>Email</span>
        <span className="login-input"><MailIcon />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="Nhập email của bạn" />
        </span>
      </label>
      <label className="login-field">
        <span>Mật khẩu</span>
        <span className="login-input"><LockIcon />
          <input type={isPasswordVisible ? 'text' : 'password'} value={password} minLength={MIN_PASSWORD_LENGTH}
            onChange={(event) => setPassword(event.target.value)} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            placeholder={mode === 'sign-in' ? 'Nhập mật khẩu' : `Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} />
          <button type="button" className="login-eye" onClick={() => setIsPasswordVisible((value) => !value)}
            aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={isPasswordVisible}>
            <EyeIcon isOpen={isPasswordVisible} />
          </button>
        </span>
      </label>

      {message ? <p className="login-message" role="status">{message}</p> : null}

      <button type="submit" className="login-submit" disabled={isBusy} aria-busy={isBusy}>
        <PawIcon /> {mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowIcon />
      </button>

      <div className="login-divider"><span>hoặc đăng nhập với</span></div>
      <button type="button" className="login-social" onClick={signInWithGoogle} disabled={isBusy}>
        <GoogleIcon /> Google
      </button>
    </form>
  );
}

/* Icon nét mảnh cho form — vẽ tay bằng SVG để không phải thêm thư viện icon. */
const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

function MailIcon() {
  return <svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>;
}
function LockIcon() {
  return <svg {...iconProps}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
}
function UserIcon() {
  return <svg {...iconProps}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2" /></svg>;
}
function EyeIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg {...iconProps}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" />
      {isOpen ? null : <path d="m4 4 16 16" />}
    </svg>
  );
}
function ArrowIcon() {
  return <svg {...iconProps} className="login-arrow"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
function PawIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4.2" /><circle cx="6" cy="10" r="2.2" /><circle cx="9.5" cy="6.2" r="2.2" />
      <circle cx="14.5" cy="6.2" r="2.2" /><circle cx="18" cy="10" r="2.2" />
    </svg>
  );
}
/** Logo "G" của Google — đúng màu thương hiệu theo hướng dẫn nút "Sign in with Google". */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
