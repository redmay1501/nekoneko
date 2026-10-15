const SECRET_KEY = /pass(word)?|token|secret|key|authorization|cookie|otp|jwt/i;
const MAX_STRING = 300;

/** Bỏ mọi trường giống bí mật và cắt chuỗi dài — nhật ký không bao giờ chứa mật khẩu, token hay khoá. */
export function sanitizeAuditDetail(detail: Record<string, unknown>): Record<string, unknown> {
  const clean = (value: unknown, depth: number): unknown => {
    if (typeof value === 'string') return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
    if (Array.isArray(value)) return depth > 3 ? '[…]' : value.slice(0, 50).map((item) => clean(item, depth + 1));
    if (value && typeof value === 'object') {
      if (depth > 3) return '{…}';
      return Object.fromEntries(Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SECRET_KEY.test(key))
        .map(([key, item]) => [key, clean(item, depth + 1)]));
    }
    return value;
  };
  return clean(detail, 0) as Record<string, unknown>;
}
