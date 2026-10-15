/** Lỗi nghiệp vụ có chủ đích — route handler đổi chúng thành mã HTTP phù hợp. */
export class UnauthenticatedError extends Error {
  constructor() {
    super('Chưa đăng nhập');
    this.name = 'UnauthenticatedError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`Không tìm thấy: ${what}`);
    this.name = 'NotFoundError';
  }
}

/** Đã đăng nhập nhưng không có quyền (ví dụ: không phải admin). */
export class ForbiddenError extends Error {
  constructor() {
    super('Không có quyền');
    this.name = 'ForbiddenError';
  }
}

/**
 * Thao tác bị từ chối có lý do người dùng cần biết (ảnh đang được dùng, thiếu migration…).
 * `message` là câu tiếng Việt hiển thị thẳng cho admin — không chứa chi tiết kỹ thuật hay bí mật.
 */
export class ActionRejectedError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 413 | 415 | 422 | 503 = 409) {
    super(message);
    this.name = 'ActionRejectedError';
  }
}
