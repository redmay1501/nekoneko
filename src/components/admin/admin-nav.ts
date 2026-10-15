/** Mục trên thanh bên /admin. Mọi trang vẫn tự kiểm tra quyền ở server — ẩn / hiện menu không phải là bảo vệ. */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
}

export const ADMIN_NAV: Array<{ group: string; items: AdminNavItem[] }> = [
  { group: 'Tổng quan', items: [{ href: '/admin', label: 'Dashboard', icon: '🏠' }] },
  {
    group: 'Nội dung',
    items: [
      { href: '/admin/tu-vung', label: 'Từ vựng', icon: '🌸' },
      { href: '/admin/kanji', label: 'Kanji', icon: '漢' },
      { href: '/admin/bo-thu', label: 'Bộ thủ', icon: '部' },
      { href: '/admin/ngu-phap', label: 'Ngữ pháp', icon: '📐' },
      { href: '/admin/bai-doc', label: 'Bài đọc', icon: '📖' },
      { href: '/admin/lo-trinh', label: 'Lộ trình 90 ngày', icon: '🗺️' },
      { href: '/admin/video', label: 'Nghe & Video', icon: '🎧' },
      { href: '/admin/bai-tap', label: 'Bài tập & Kiểm tra', icon: '✅' },
      { href: '/admin/media', label: 'Media / Hình ảnh', icon: '🖼️' },
    ],
  },
  {
    group: 'Vận hành',
    items: [
      { href: '/admin/nguoi-dung', label: 'Người dùng', icon: '👥' },
      { href: '/admin/chat-luong', label: 'Kiểm tra chất lượng', icon: '🔍' },
      { href: '/admin/nhat-ky', label: 'Nhật ký', icon: '📝' },
      { href: '/admin/cai-dat', label: 'Cài đặt', icon: '⚙️' },
    ],
  },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}
