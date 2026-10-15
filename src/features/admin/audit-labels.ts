/** Nhãn tiếng Việt cho hành động trong nhật ký admin. */
const LABELS: Record<string, string> = {
  'content.create': 'Thêm nội dung',
  'content.update': 'Sửa nội dung',
  'content.delete': 'Xoá nội dung',
  'content.status': 'Đổi trạng thái',
  'content.image.set': 'Gắn ảnh',
  'content.image.replace': 'Thay ảnh',
  'content.image.remove': 'Gỡ ảnh',
  'roadmap.link': 'Gắn vào ngày',
  'roadmap.unlink': 'Gỡ khỏi ngày',
  'media.upload': 'Tải ảnh lên',
  'media.alt': 'Sửa mô tả ảnh',
  'media.delete': 'Xoá ảnh',
  'user.reset_password_email': 'Gửi email đặt lại mật khẩu',
  'user.resend_verification': 'Gửi lại email xác minh',
  'user.lock': 'Khoá tài khoản',
  'user.unlock': 'Mở khoá tài khoản',
  'user.delete': 'Xoá tài khoản',
};

export function describeAuditAction(action: string): string {
  return LABELS[action] ?? action;
}

export const AUDIT_ACTIONS = Object.keys(LABELS);
