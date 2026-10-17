import { describe, expect, it } from 'vitest';
import { authErrorMessage, callbackErrorMessage, emailError, normalizeEmail, passwordError, validateCredentials } from './credentials';

describe('kiểm tra email', () => {
  it('nhận email hợp lệ, bỏ khoảng trắng đầu/cuối và chuẩn hoá chữ thường', () => {
    expect(emailError('  Hien@Gmail.com ')).toBeNull();
    expect(normalizeEmail('  Hien@Gmail.com ')).toBe('hien@gmail.com');
    expect(emailError('a.b+tag@sub.example.vn')).toBeNull();
  });

  it('báo lỗi email sai định dạng', () => {
    for (const bad of ['', '   ', 'hien', 'hien@', '@gmail.com', 'hien@gmail', 'hi en@gmail.com', 'hien@@gmail.com', 'hien..x@gmail.com', 'hien@-gmail.com']) {
      expect({ bad, error: emailError(bad) === null }).toEqual({ bad, error: false });
    }
  });
});

describe('kiểm tra mật khẩu', () => {
  it('đăng ký: từ 6 ký tự trở lên, không dấu cách đầu/cuối', () => {
    expect(passwordError('12345', 'sign-up')).toMatch(/6 ký tự/);
    expect(passwordError('123456', 'sign-up')).toBeNull();
    expect(passwordError(' 1234567', 'sign-up')).toMatch(/dấu cách/);
    expect(passwordError('1234567 ', 'sign-up')).toMatch(/dấu cách/);
    expect(passwordError('', 'sign-up')).toMatch(/nhập mật khẩu/);
    expect(passwordError('a'.repeat(73), 'sign-up')).toMatch(/tối đa/);
  });

  it('đăng nhập: không áp quy tắc đăng ký cho tài khoản cũ (mật khẩu 6 ký tự vẫn gửi được)', () => {
    expect(passwordError('123456', 'sign-in')).toBeNull();
    expect(passwordError('', 'sign-in')).not.toBeNull();
  });

  it('gom lỗi theo từng ô; tên chỉ bắt buộc khi đăng ký', () => {
    expect(validateCredentials({ email: 'x', password: '1', displayName: '  ' }, 'sign-up')).toEqual({
      email: expect.any(String), password: expect.any(String), displayName: expect.any(String),
    });
    expect(validateCredentials({ email: 'a@b.co', password: 'secret' }, 'sign-in')).toEqual({});
  });
});

describe('thông báo lỗi', () => {
  it('không tiết lộ email đã có tài khoản hay chưa', () => {
    const message = authErrorMessage({ status: 422, code: 'user_already_exists' }, 'sign-up');
    expect(message).not.toMatch(/đã tồn tại|already/i);
  });
  it('quá nhiều yêu cầu → bảo đợi; lỗi OAuth/huỷ có câu riêng', () => {
    expect(authErrorMessage({ status: 429 }, 'sign-up')).toMatch(/đợi/);
    expect(callbackErrorMessage('huy')).toMatch(/huỷ/);
    expect(callbackErrorMessage('oauth')).toMatch(/Google/);
    expect(callbackErrorMessage(undefined)).toBeNull();
  });
});
