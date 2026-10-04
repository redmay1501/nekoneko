/** Điều hướng chính — giữ đúng thứ tự và tên của prototype; biểu tượng là bộ icon mèo Neko Neko ("neko:<slug>"). */
export interface NavigationItem {
  href: string;
  icon: string;
  label: string;
  children?: NavigationItem[];
}

export const LEARNING_LINKS: NavigationItem[] = [
  { href: '/hoc-tap/hiragana', icon: 'neko:hiragana', label: 'Hiragana' },
  { href: '/hoc-tap/katakana', icon: 'neko:katakana', label: 'Katakana' },
  { href: '/hoc-tap/bo-thu', icon: 'neko:radical', label: 'Bộ thủ' },
  { href: '/hoc-tap/kanji', icon: 'neko:kanji', label: 'Kanji' },
  { href: '/hoc-tap/tu-vung', icon: 'neko:vocabulary', label: 'Từ vựng' },
  { href: '/hoc-tap/ngu-phap', icon: '📐', label: 'Ngữ pháp' },
  { href: '/luyen-tap/nghe', icon: 'neko:listening', label: 'Luyện nghe' },
  { href: '/luyen-tap/noi', icon: 'neko:speaking', label: 'Luyện nói' },
  { href: '/luyen-tap/doc', icon: 'neko:reading', label: 'Đọc hiểu' },
  { href: '/luyen-tap/viet', icon: 'neko:writing', label: 'Luyện viết' },
];

export const MAIN_NAVIGATION: NavigationItem[] = [
  { href: '/', icon: 'neko:home', label: 'Trang chủ' },
  { href: '/lo-trinh', icon: 'neko:roadmap', label: 'Lộ trình' },
  { href: '/hoc-tap', icon: 'neko:study', label: 'Học tập', children: LEARNING_LINKS },
  { href: '/tri-nho', icon: 'neko:memory', label: 'Trí nhớ' },
  { href: '/luyen-tap', icon: 'neko:practice', label: 'Luyện tập' },
  { href: '/vuon', icon: 'neko:garden', label: 'Vườn tri thức' },
  { href: '/tien-do', icon: 'neko:progress', label: 'Tiến độ' },
  { href: '/thanh-tich', icon: 'neko:achievements', label: 'Thành tích' },
];

export const FOOTER_NAVIGATION: NavigationItem[] = [
  { href: '/ho-so', icon: 'neko:profile', label: 'Hồ sơ' },
  { href: '/cai-dat', icon: 'neko:settings', label: 'Cài đặt' },
];

export const BOTTOM_NAVIGATION: NavigationItem[] = [
  { href: '/', icon: 'neko:home', label: 'Trang chủ' },
  { href: '/lo-trinh', icon: 'neko:roadmap', label: 'Lộ trình' },
  { href: '/tri-nho', icon: 'neko:memory', label: 'Trí nhớ' },
  { href: '/ho-so', icon: 'neko:profile', label: 'Hồ sơ' },
];

/** Mục đang mở: trùng tuyệt đối, hoặc là trang con (trừ trang chủ). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isInLearningSection(pathname: string): boolean {
  return isActivePath(pathname, '/hoc-tap') || LEARNING_LINKS.some((link) => isActivePath(pathname, link.href));
}
