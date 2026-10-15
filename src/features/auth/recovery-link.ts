/**
 * Đọc liên kết đặt lại mật khẩu Supabase gửi qua email. Có hai dạng:
 *  - implicit (admin gửi từ /admin): #access_token=…&refresh_token=…&type=recovery
 *  - PKCE (người học tự bấm "Quên mật khẩu?" ở trình duyệt này): ?code=…
 * Liên kết hết hạn / đã dùng: #error=…&error_code=otp_expired&error_description=…
 */
export type RecoveryLink =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'code'; code: string }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

export function parseRecoveryLink(search: string, hash: string): RecoveryLink {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search.replace(/^\?/, ''));
  const errorCode = fragment.get('error_code') ?? query.get('error_code') ?? fragment.get('error') ?? query.get('error');
  if (errorCode) {
    return { kind: 'error', message: errorCode === 'otp_expired' ? 'Liên kết đã hết hạn hoặc đã được dùng.' : 'Liên kết không hợp lệ.' };
  }
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (accessToken && refreshToken) return { kind: 'tokens', accessToken, refreshToken };
  const code = query.get('code');
  if (code) return { kind: 'code', code };
  return { kind: 'none' };
}
