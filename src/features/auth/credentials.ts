/**
 * Kiểm tra email / mật khẩu / tên trước khi gửi tới Supabase Auth — dùng chung cho form và test.
 *
 * Lưu ý về ranh giới tin cậy: form gọi thẳng Supabase Auth bằng khoá công khai, nên kiểm tra ở đây chỉ để người học
 * thấy lỗi sớm và rõ. Lớp chặn THẬT nằm ở cấu hình Supabase (Authentication → Providers → Email):
 * "Confirm email" bật, "Minimum password length" = MIN_SIGN_UP_PASSWORD_LENGTH, CAPTCHA, rate limit — xem docs/AUTH_SECURITY.md.
 */

/** "Trên 6 ký tự" → tối thiểu 7. Chỉ áp cho ĐĂNG KÝ: tài khoản cũ đặt mật khẩu 6 ký tự vẫn đăng nhập được. */
export const MIN_SIGN_UP_PASSWORD_LENGTH = 7;
export const MAX_PASSWORD_LENGTH = 72; // giới hạn của bcrypt mà Supabase Auth dùng
export const MAX_DISPLAY_NAME_LENGTH = 40;

// Đủ chặt cho lỗi gõ phổ biến (thiếu @, thiếu tên miền, có dấu cách, hai dấu chấm liền) — không cố mô phỏng RFC 5322.
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export type CredentialField = 'email' | 'password' | 'displayName';
export type CredentialErrors = Partial<Record<CredentialField, string>>;
export type AuthMode = 'sign-in' | 'sign-up';

/** Email chuẩn hoá để gửi đi: bỏ khoảng trắng đầu/cuối, chữ thường. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function emailError(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return 'Bạn nhập email nhé.';
  if (email.length > 254 || !EMAIL_PATTERN.test(email) || email.includes('..')) return 'Email chưa đúng định dạng — ví dụ: ten@gmail.com.';
  return null;
}

export function passwordError(password: string, mode: AuthMode): string | null {
  if (!password) return 'Bạn nhập mật khẩu nhé.';
  if (mode === 'sign-in') return null; // đăng nhập: không đoán quy tắc cũ, để Supabase trả lời
  if (password !== password.trim()) return 'Mật khẩu không được bắt đầu hoặc kết thúc bằng dấu cách.';
  if ([...password].length < MIN_SIGN_UP_PASSWORD_LENGTH) return `Mật khẩu cần ít nhất ${MIN_SIGN_UP_PASSWORD_LENGTH} ký tự.`;
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_LENGTH) return `Mật khẩu dài quá — tối đa ${MAX_PASSWORD_LENGTH} ký tự.`;
  return null;
}

export function displayNameError(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'Bạn cho Neko biết tên để gọi nhé.';
  if ([...name].length > MAX_DISPLAY_NAME_LENGTH) return `Tên dài quá — tối đa ${MAX_DISPLAY_NAME_LENGTH} ký tự.`;
  return null;
}

/** Mọi lỗi theo từng ô. Rỗng = hợp lệ. */
export function validateCredentials(input: { email: string; password: string; displayName?: string }, mode: AuthMode): CredentialErrors {
  const errors: CredentialErrors = {};
  const email = emailError(input.email);
  const password = passwordError(input.password, mode);
  if (email) errors.email = email;
  if (password) errors.password = password;
  if (mode === 'sign-up') {
    const name = displayNameError(input.displayName ?? '');
    if (name) errors.displayName = name;
  }
  return errors;
}

/**
 * Lỗi từ Supabase Auth → câu cho người học. Không nói email đã có tài khoản hay chưa (chống dò tài khoản);
 * không đưa nguyên văn lỗi kỹ thuật.
 */
export function authErrorMessage(error: { status?: number; code?: string; message?: string }, mode: AuthMode | 'reset' | 'resend'): string {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return 'Bạn thao tác hơi nhanh — đợi vài phút rồi thử lại nhé.';
  }
  if (error.code === 'captcha_failed') return 'Chưa xác minh được bạn không phải máy — làm lại ô xác minh rồi thử lại nhé.';
  if (error.code === 'email_not_confirmed') return 'Email này chưa được xác nhận. Mở thư xác nhận Neko đã gửi, hoặc bấm “Gửi lại email xác nhận”.';
  if (error.code === 'weak_password') return `Mật khẩu chưa đủ mạnh — cần ít nhất ${MIN_SIGN_UP_PASSWORD_LENGTH} ký tự.`;
  if (mode === 'sign-in') return 'Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé.';
  if (mode === 'sign-up') return 'Chưa tạo được tài khoản với email này. Nếu bạn đã có tài khoản, hãy đăng nhập hoặc dùng “Quên mật khẩu?”.';
  return 'Chưa gửi được email. Bạn thử lại sau ít phút nhé.';
}

/** Lỗi OAuth / xác nhận trả về trang đăng nhập (?loi=…) → câu cho người học. */
export function callbackErrorMessage(code: string | undefined): string | null {
  if (code === 'huy') return 'Bạn đã huỷ đăng nhập bằng Google. Có thể thử lại bất cứ lúc nào.';
  if (code === 'oauth') return 'Đăng nhập bằng Google chưa thành công. Bạn thử lại, hoặc đăng nhập bằng email nhé.';
  if (code === 'xac-nhan') return 'Liên kết xác nhận đã hết hạn hoặc đã được dùng. Bạn đăng nhập lại nhé.';
  return null;
}
