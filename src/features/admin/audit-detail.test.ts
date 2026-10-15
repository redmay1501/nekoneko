import { describe, expect, it } from 'vitest';
import { sanitizeAuditDetail } from './audit-detail';

describe('sanitizeAuditDetail', () => {
  it('bỏ mật khẩu, token, khoá ở mọi cấp', () => {
    const clean = sanitizeAuditDetail({
      email: 'a@b.c', password: 'x', nested: { accessToken: 't', refresh_token: 'r', apiKey: 'k', ok: 1 }, list: [{ secret: 's', name: 'n' }],
    });
    expect(clean).toEqual({ email: 'a@b.c', nested: { ok: 1 }, list: [{ name: 'n' }] });
    expect(JSON.stringify(clean)).not.toMatch(/"x"|"t"|"r"|"k"|"s"/);
  });
  it('cắt chuỗi quá dài', () => {
    const clean = sanitizeAuditDetail({ text: 'a'.repeat(1000) });
    expect((clean.text as string).length).toBeLessThan(310);
  });
});
