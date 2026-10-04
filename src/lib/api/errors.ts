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
