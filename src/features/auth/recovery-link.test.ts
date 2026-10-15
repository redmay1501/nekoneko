import { describe, expect, it } from 'vitest';
import { parseRecoveryLink } from './recovery-link';

describe('parseRecoveryLink', () => {
  it('liên kết implicit (admin gửi) → token', () => {
    expect(parseRecoveryLink('', '#access_token=a&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery'))
      .toEqual({ kind: 'tokens', accessToken: 'a', refreshToken: 'r' });
  });
  it('liên kết PKCE → code', () => {
    expect(parseRecoveryLink('?code=abc', '')).toEqual({ kind: 'code', code: 'abc' });
  });
  it('liên kết hết hạn → báo lỗi thân thiện', () => {
    expect(parseRecoveryLink('', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'))
      .toMatchObject({ kind: 'error', message: expect.stringContaining('hết hạn') });
  });
  it('không có gì → none', () => {
    expect(parseRecoveryLink('', '')).toEqual({ kind: 'none' });
  });
});
