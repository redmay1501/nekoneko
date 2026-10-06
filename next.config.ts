import type { NextConfig } from 'next';

/**
 * Đường dẫn cũ → trang mới, chuyển ngay ở server (không phải vẽ khung chờ rồi mới chuyển):
 *  - Theo dõi gộp Tiến độ · Trí nhớ · Thành tích thành một trang có tab (trang con /tri-nho/... vẫn giữ);
 *  - Hồ sơ gộp vào Cài đặt;
 *  - các chế độ học cũ nay ở /hoc/<chế độ>.
 */
const LEGACY_REDIRECTS: ReadonlyArray<[string, string]> = [
  ['/tri-nho', '/theo-doi?tab=tri-nho'],
  ['/tien-do', '/theo-doi?tab=tien-do'],
  ['/thanh-tich', '/theo-doi?tab=thanh-tich'],
  ['/ho-so', '/cai-dat'],
  ['/gap-lai', '/hoc/recall'],
  ['/kham-pha', '/hoc/discover'],
  ['/thuc-hanh', '/hoc/use'],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return LEGACY_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
