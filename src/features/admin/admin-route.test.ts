import { describe, expect, it } from 'vitest';

const { isSameOrigin } = await import('./admin-route');
const request = (headers: Record<string, string>) => new Request('http://localhost:3000/api/admin/media', { method: 'POST', headers });

describe('isSameOrigin', () => {
  it('cùng origin → cho qua; trang khác → chặn; Origin hỏng → chặn', () => {
    expect(isSameOrigin(request({ origin: 'http://localhost:3000', host: 'localhost:3000' }))).toBe(true);
    expect(isSameOrigin(request({ origin: 'https://evil.example', host: 'localhost:3000' }))).toBe(false);
    expect(isSameOrigin(request({ origin: 'null', host: 'localhost:3000' }))).toBe(false);
  });
});
