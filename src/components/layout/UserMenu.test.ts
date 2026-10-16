import { describe, expect, it } from 'vitest';
import { accountMenuLinks } from './UserMenu';

describe('menu tài khoản', () => {
  it('admin thấy "Quản trị nội dung"', () => {
    expect(accountMenuLinks(true).map((link) => link.href)).toContain('/admin');
  });
  it('tài khoản thường không thấy', () => {
    expect(accountMenuLinks(false).map((link) => link.href)).not.toContain('/admin');
    expect(accountMenuLinks(false)).toHaveLength(2);
  });
});
