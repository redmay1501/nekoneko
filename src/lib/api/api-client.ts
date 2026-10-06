import { USER_MESSAGES } from '@/lib/constants/messages';

/** Lỗi khi gọi API từ trình duyệt — `message` luôn là câu tiếng Việt hiển thị được. */
export class ApiClientError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Gọi API nội bộ và trả JSON đã kiểu hoá. Dùng trong các file *-api.ts của từng domain. */
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiClientError(USER_MESSAGES.NETWORK_ERROR, 0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error ?? USER_MESSAGES.GENERIC_ERROR;
    throw new ApiClientError(message, response.status);
  }
  return body as T;
}

/**
 * `keepalive`: yêu cầu vẫn chạy hết dù người học chuyển trang ngay sau khi bấm (ghi kết quả luyện tập chạy nền).
 * Mọi POST của app đều nhỏ (dưới giới hạn 64 KB của keepalive) nên bật luôn.
 */
export function postJson<T>(url: string, payload: unknown): Promise<T> {
  return requestJson<T>(url, { method: 'POST', body: JSON.stringify(payload), keepalive: true });
}

/** Khoá chống ghi trùng cho mỗi lần bấm — server bỏ qua nếu nhận lại cùng khoá. */
export function createRequestId(): string {
  return crypto.randomUUID();
}
