import { describe, expect, it } from 'vitest';
import { accountMenuLinks } from './UserMenu';
import { footerNavigation } from './navigation-items';

describe('menu tài khoản', () => {
  it('admin thấy "Quản trị nội dung"', () => {
    expect(accountMenuLinks(true).map((link) => link.href)).toContain('/admin');
  });
  it('tài khoản thường không thấy', () => {
    expect(accountMenuLinks(false).map((link) => link.href)).not.toContain('/admin');
    expect(accountMenuLinks(false)).toHaveLength(2);
  });
});

describe('thanh bên / khay menu', () => {
  it('admin có mục Quản trị nội dung dưới Cài đặt; tài khoản thường không có', () => {
    expect(footerNavigation(true).map((item) => item.href)).toEqual(['/cai-dat', '/admin']);
    expect(footerNavigation(false).map((item) => item.href)).toEqual(['/cai-dat']);
  });
});
