/**
 * Nút nổi "Khám phá NekoNeko" (mở lại hướng dẫn 3D) — quyết định ẩn/hiện, thuần dữ liệu để test được.
 *
 * Ẩn khi:
 *  - người học chưa xem hướng dẫn lần đầu (welcomed_at còn trống) — lúc đó hướng dẫn lần đầu đang / sắp phủ màn hình;
 *  - hướng dẫn (lần đầu hoặc xem lại) đang mở;
 *  - đang trong phiên học /hoc/* — nút nổi có thể che đáp án / nút trả lời.
 * Trang đăng nhập / đăng ký / đặt lại mật khẩu thuộc nhóm (auth), không dùng AppShell nên không bao giờ có nút này.
 */
export interface GuideBannerContext {
  pathname: string;
  isWelcomed: boolean;
  isGuideOpen: boolean;
}

/** Tiền tố route mà nút nổi không được che (phiên học toàn màn hình và khu vực Học tập). */
export const GUIDE_BANNER_HIDDEN_PREFIXES: readonly string[] = ['/hoc'];

export function shouldShowGuideBanner({ pathname, isWelcomed, isGuideOpen }: GuideBannerContext): boolean {
  if (!isWelcomed || isGuideOpen) return false;
  return !GUIDE_BANNER_HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Khoá localStorage cho tuỳ chọn thu gọn — chỉ là tuỳ chọn giao diện, không liên quan trạng thái hướng dẫn. */
export const GUIDE_BANNER_COLLAPSED_KEY = 'neko:guide-banner-collapsed';

export function readGuideBannerCollapsed(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(GUIDE_BANNER_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeGuideBannerCollapsed(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, collapsed: boolean): void {
  try {
    if (collapsed) storage?.setItem(GUIDE_BANNER_COLLAPSED_KEY, '1');
    else storage?.removeItem(GUIDE_BANNER_COLLAPSED_KEY);
  } catch {
    // Chế độ riêng tư / bị chặn bộ nhớ: bỏ qua — banner vẫn dùng được, chỉ không nhớ tuỳ chọn.
  }
}
