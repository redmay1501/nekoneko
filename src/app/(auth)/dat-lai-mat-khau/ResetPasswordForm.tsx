'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { parseRecoveryLink } from '@/features/auth/recovery-link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const MIN_PASSWORD_LENGTH = 6;
type Stage = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * Đặt mật khẩu mới từ liên kết trong email: đổi liên kết lấy phiên (token hoặc code), xoá token khỏi thanh địa chỉ,
 * rồi updateUser({ password }). Mật khẩu đi thẳng từ trình duyệt tới Supabase Auth — không qua server NekoNeko.
 */
export function ResetPasswordForm() {
  const [stage, setStage] = useState<Stage>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const link = parseRecoveryLink(window.location.search, window.location.hash);
    // Không để token nằm lại trong thanh địa chỉ / lịch sử trình duyệt.
    window.history.replaceState(null, '', window.location.pathname);
    const supabase = createBrowserSupabaseClient();
    (async () => {
      if (link.kind === 'error') { setMessage(link.message); setStage('invalid'); return; }
      if (link.kind === 'tokens') {
        const { error } = await supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken });
        setStage(error ? 'invalid' : 'ready');
        if (error) setMessage('Liên kết đã hết hạn hoặc đã được dùng.');
        return;
      }
      if (link.kind === 'code') {
        const { error } = await supabase.auth.exchangeCodeForSession(link.code);
        setStage(error ? 'invalid' : 'ready');
        if (error) setMessage('Liên kết đã hết hạn, đã được dùng, hoặc được mở ở trình duyệt khác với nơi bạn yêu cầu.');
        return;
      }
      // Không có liên kết: có thể đã đổi phiên trước đó (tải lại trang) — còn phiên thì cho đặt mật khẩu.
      const { data } = await supabase.auth.getUser();
      setStage(data.user ? 'ready' : 'invalid');
      if (!data.user) setMessage('Mở trang này từ liên kết trong email đặt lại mật khẩu nhé.');
    })();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) { setMessage(`Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`); return; }
    if (password !== confirm) { setMessage('Hai ô mật khẩu chưa khớp.'); return; }
    setIsBusy(true);
    setMessage(null);
    const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
    setIsBusy(false);
    if (error) {
      setMessage(/same|different/i.test(error.message) ? 'Mật khẩu mới cần khác mật khẩu cũ.' : /weak|short|length/i.test(error.message)
        ? 'Mật khẩu chưa đủ mạnh theo yêu cầu. Thử mật khẩu dài hơn nhé.' : 'Chưa đổi được mật khẩu. Bạn thử lại nhé.');
      return;
    }
    setStage('done');
  }

  if (stage === 'checking') return <p className="login-demo" role="status">Đang kiểm tra liên kết…</p>;
  if (stage === 'invalid') {
    return (
      <div className="login-demo">
        <p className="login-message" role="alert">{message}</p>
        <p>Bạn có thể yêu cầu liên kết mới ở trang đăng nhập (Quên mật khẩu?).</p>
        <Link className="login-submit" href="/dang-nhap">Về trang đăng nhập</Link>
      </div>
    );
  }
  if (stage === 'done') {
    return (
      <div className="login-demo">
        <b>Đã đổi mật khẩu 🌸</b>
        <p>Từ giờ bạn đăng nhập bằng mật khẩu mới.</p>
        <Link className="login-submit" href="/">🐾 Vào học</Link>
      </div>
    );
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <label className="login-field">
        <span>Mật khẩu mới</span>
        <span className="login-input">
          <input type="password" value={password} minLength={MIN_PASSWORD_LENGTH} onChange={(event) => setPassword(event.target.value)}
            required autoComplete="new-password" placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} />
        </span>
      </label>
      <label className="login-field">
        <span>Nhập lại mật khẩu mới</span>
        <span className="login-input">
          <input type="password" value={confirm} minLength={MIN_PASSWORD_LENGTH} onChange={(event) => setConfirm(event.target.value)}
            required autoComplete="new-password" />
        </span>
      </label>
      {message ? <p className="login-message" role="alert">{message}</p> : null}
      <button type="submit" className="login-submit" disabled={isBusy} aria-busy={isBusy}>Lưu mật khẩu mới</button>
    </form>
  );
}
