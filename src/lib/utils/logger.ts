/**
 * Ghi log cho lập trình viên. Lỗi hiển thị cho người dùng luôn là câu tiếng Việt
 * thân thiện (xem lib/constants/messages.ts) — không bao giờ lộ chi tiết kỹ thuật.
 */
export const logger = {
  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    console.error(`[neko-neko] ${message}`, { error, ...context });
  },
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[neko-neko] ${message}`, context ?? {});
  },
};
