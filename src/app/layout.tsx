import type { Metadata, Viewport } from 'next';
import { type ReactNode, Suspense } from 'react';
import { SvgSprite } from '@/components/common/SvgSprite';
import { APP_NAME, APP_TAGLINE } from '@/config/brand';
import { NavigationProgress } from '@/components/layout/NavigationProgress';
import { Providers } from './providers';
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

/*
 * Font tải bằng thẻ <link> (không dùng next/font) để `npm run build` không cần mạng tới Google Fonts.
 * Font: Nunito (tiếng Việt), Mali (lời chào), Zen Maru Gothic (tiếng Nhật).
 */
const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Mali:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&family=Zen+Maru+Gothic:wght@400;500;700&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_STYLESHEET} />
      </head>
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
