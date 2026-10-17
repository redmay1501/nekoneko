'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import {
  type AuthMode, type CredentialErrors, type CredentialField, MIN_SIGN_UP_PASSWORD_LENGTH, authErrorMessage, emailError,
  normalizeEmail, validateCredentials,
} from '@/features/auth/credentials';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { startNavigation } from '@/stores/navigation-progress-store';
import { TurnstileWidget } from './TurnstileWidget';

/** Chờ chừng này giây giữa hai lần gửi email (đăng ký / gửi lại xác nhận / quên mật khẩu) — chặn bấm liên tục. */
const EMAIL_COOLDOWN_SECONDS = 60;

interface SignInFormProps {
  redirectTo: string;
  /** Câu báo lỗi từ trang callback (huỷ Google, link xác nhận hết hạn…). */
  initialMessage: string | null;
  /** Google chỉ hiện khi đã bật thật trong Supabase Auth. */
  isGoogleEnabled: boolean;
  /** Có khoá Turnstile thì hiện ô xác minh; token gửi kèm mọi yêu cầu tới Supabase Auth. */
  turnstileSiteKey: string | null;
}

/** Đăng nhập / đăng ký bằng email + mật khẩu hoặc Google (Supabase Auth). Kiểm tra từng ô trước khi gửi. */
export function SignInForm({ redirectTo, initialMessage, isGoogleEnabled, turnstileSiteKey }: SignInFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [isBusy, setIsBusy] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  /** Email vừa đăng ký nhưng chưa xác nhận — hiện nút "Gửi lại email xác nhận". */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const callbackUrl = () => `${window.location.origin}/auth/callback?tiep=${encodeURIComponent(redirectTo)}`;
  const isCaptchaMissing = Boolean(turnstileSiteKey) && !captchaToken;
  /** Token CAPTCHA dùng một lần — sau mỗi yêu cầu xin token mới. */
  const takeCaptchaToken = () => {
    const token = captchaToken ?? undefined;
    if (turnstileSiteKey) setCaptchaResetKey((key) => key + 1);
    return token;
  };

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrors({});
    setMessage(null);
  }

  function clearFieldError(field: CredentialField) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    const found = validateCredentials({ email, password, displayName }, mode);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length) return;
    if (mode === 'sign-up' && cooldown > 0) { setMessage(`Đợi ${cooldown} giây rồi thử lại nhé.`); return; }
    if (isCaptchaMissing) { setMessage('Hoàn tất ô xác minh bên dưới trước nhé.'); return; }

    setIsBusy(true);
    const supabase = createBrowserSupabaseClient();
    const cleanEmail = normalizeEmail(email);
    const captcha = takeCaptchaToken();
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password, options: { captchaToken: captcha } })
      : await supabase.auth.signUp({
        email: cleanEmail, password,
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: callbackUrl(), captchaToken: captcha },
      });
    if (result.error) {
      setIsBusy(false);
      setMessage(authErrorMessage(result.error, mode));
      if (result.error.code === 'email_not_confirmed') setPendingEmail(cleanEmail);
      if (mode === 'sign-up') setCooldown(EMAIL_COOLDOWN_SECONDS);
      return;
    }
    if (mode === 'sign-up' && !result.data.session) {
      setIsBusy(false);
      setPendingEmail(cleanEmail);
      setCooldown(EMAIL_COOLDOWN_SECONDS);
      setMessage('Neko đã gửi email xác nhận. Mở email và bấm vào liên kết để bắt đầu học nhé 🌸');
      return;
    }
    // Đăng nhập xong: giữ nút ở trạng thái bận cho tới khi trang học mở ra.
    startNavigation();
    router.replace(redirectTo);
    router.refresh();
  }

  async function resendConfirmation() {
    if (!pendingEmail || cooldown > 0 || isBusy) return;
    if (isCaptchaMissing) { setMessage('Hoàn tất ô xác minh bên dưới trước nhé.'); return; }
    setIsBusy(true);
    const { error } = await createBrowserSupabaseClient().auth.resend({
      type: 'signup', email: pendingEmail, options: { emailRedirectTo: callbackUrl(), captchaToken: takeCaptchaToken() },
    });
    setIsBusy(false);
    setCooldown(EMAIL_COOLDOWN_SECONDS);
    // Không cho biết email có tài khoản hay không.
    setMessage(error ? authErrorMessage(error, 'resend') : 'Nếu email này đang chờ xác nhận, Neko đã gửi lại thư. Kiểm tra cả mục Spam nhé.');
  }

  async function sendResetLink() {
    const problem = emailError(email);
    if (problem) { setErrors({ email: problem }); setMessage('Nhập email của bạn trước, rồi bấm "Quên mật khẩu?" nhé.'); return; }
    if (cooldown > 0 || isBusy) { setMessage(`Đợi ${cooldown} giây rồi thử lại nhé.`); return; }
    if (isCaptchaMissing) { setMessage('Hoàn tất ô xác minh bên dưới trước nhé.'); return; }
    setIsBusy(true);
    const { error } = await createBrowserSupabaseClient().auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: `${window.location.origin}/dat-lai-mat-khau`, captchaToken: takeCaptchaToken(),
    });
    setIsBusy(false);
    setCooldown(EMAIL_COOLDOWN_SECONDS);
    // Không cho biết email có tài khoản hay không.
    setMessage(error?.status === 429 || error?.code === 'captcha_failed' ? authErrorMessage(error, 'reset')
      : 'Nếu email này có tài khoản, Neko đã gửi liên kết đặt lại mật khẩu. Mở email trên chính trình duyệt này nhé 🌸');
  }

  async function signInWithGoogle() {
    if (isBusy) return;
    setIsBusy(true);
    setMessage(null);
    const { error } = await createBrowserSupabaseClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } });
    // Thành công thì trình duyệt chuyển sang Google — giữ trạng thái bận; lỗi thì mở lại form.
    if (error) {
      setIsBusy(false);
      setMessage('Chưa mở được đăng nhập Google. Bạn thử lại, hoặc đăng nhập bằng email nhé.');
    }
  }

  const fieldError = (field: CredentialField) => errors[field]
    ? <span id={`login-${field}-error`} className="login-field-error" role="alert">{errors[field]}</span> : null;
  const invalidProps = (field: CredentialField) => (errors[field]
    ? { 'aria-invalid': true, 'aria-describedby': `login-${field}-error` } : {});

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      <div className="login-tabs" role="tablist" aria-label="Đăng nhập hoặc tạo tài khoản">
        <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'on' : ''} onClick={() => switchMode('sign-in')}>
          <MailIcon /> Đăng nhập
        </button>
        <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'on' : ''} onClick={() => switchMode('sign-up')}>
          <UserIcon /> Đăng ký
        </button>
      </div>

      {mode === 'sign-up' ? (
        <label className="login-field">
          <span>Tên của bạn</span>
          <span className={`login-input ${errors.displayName ? 'is-invalid' : ''}`}><UserIcon />
            <input value={displayName} onChange={(event) => { setDisplayName(event.target.value); clearFieldError('displayName'); }}
              autoComplete="nickname" placeholder="Bạn muốn Neko gọi bạn là gì?" maxLength={60} {...invalidProps('displayName')} />
          </span>
          {fieldError('displayName')}
        </label>
      ) : null}
      <label className="login-field">
        <span>Email</span>
        <span className={`login-input ${errors.email ? 'is-invalid' : ''}`}><MailIcon />
          <input type="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }}
            onBlur={() => { if (email.trim()) setErrors((current) => ({ ...current, email: emailError(email) ?? undefined })); }}
            autoComplete="email" placeholder="Nhập email của bạn" {...invalidProps('email')} />
        </span>
        {fieldError('email')}
      </label>
      <label className="login-field">
        <span>Mật khẩu</span>
        <span className={`login-input ${errors.password ? 'is-invalid' : ''}`}><LockIcon />
          <input type={isPasswordVisible ? 'text' : 'password'} value={password}
            onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            placeholder={mode === 'sign-in' ? 'Nhập mật khẩu' : `Ít nhất ${MIN_SIGN_UP_PASSWORD_LENGTH} ký tự`} {...invalidProps('password')} />
          <button type="button" className="login-eye" onClick={() => setIsPasswordVisible((value) => !value)}
            aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={isPasswordVisible}>
            <EyeIcon isOpen={isPasswordVisible} />
          </button>
        </span>
        {fieldError('password')}
      </label>

      {mode === 'sign-in' ? (
        <button type="button" className="login-forgot" onClick={sendResetLink} disabled={isBusy}>Quên mật khẩu?</button>
      ) : null}
      {turnstileSiteKey ? <TurnstileWidget siteKey={turnstileSiteKey} onToken={setCaptchaToken} resetKey={captchaResetKey} /> : null}
      {message ? <p className="login-message" role="status">{message}</p> : null}
      {pendingEmail ? (
        <button type="button" className="login-forgot" onClick={resendConfirmation} disabled={isBusy || cooldown > 0}>
          {cooldown > 0 ? `Gửi lại email xác nhận (${cooldown}s)` : 'Gửi lại email xác nhận'}
        </button>
      ) : null}

      <button type="submit" className="login-submit" disabled={isBusy} aria-busy={isBusy}>
        <PawIcon /> {mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowIcon />
      </button>

      {isGoogleEnabled ? (
        <>
          <div className="login-divider"><span>hoặc {mode === 'sign-in' ? 'đăng nhập' : 'đăng ký'} với</span></div>
          <button type="button" className="login-social" onClick={signInWithGoogle} disabled={isBusy} aria-busy={isBusy}>
            <GoogleIcon /> Google
          </button>
        </>
      ) : null}
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
