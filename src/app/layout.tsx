import type { Metadata, Viewport } from 'next';
import { type ReactNode, Suspense } from 'react';
import { SvgSprite } from '@/components/common/SvgSprite';
import { APP_NAME, APP_TAGLINE } from '@/config/brand';
import { NavigationProgress } from '@/components/layout/NavigationProgress';
import { Providers } from './providers';
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: `Học tiếng Nhật JLPT N5 và giữ lại lâu dài. ${APP_NAME} theo dõi trí nhớ và đưa kiến thức quay lại đúng lúc bạn sắp quên.`,
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFDF8',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <a href="#noi-dung" className="sr-only focus:not-sr-only">Bỏ qua tới nội dung</a>
        <SvgSprite />
        {/* useSearchParams cần Suspense để không kéo cả trang sang render phía trình duyệt. */}
        <Suspense fallback={null}><NavigationProgress /></Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
