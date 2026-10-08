import { APP_NAME, LOGO_ASPECT_RATIO, LOGO_BAR_SRC, LOGO_LOGIN_SRC } from '@/config/brand';

/** Logo Neko Neko. Ảnh có chữ tên app nên alt = tên app. priority khi logo cần tới trước nền. */
export function BrandLogo({ width, className = '', priority = false }: { width: number; className?: string; priority?: boolean }) {
  const isBar = width <= 120;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo WebP đã đúng cỡ hiển thị, không cần next/image nén thêm.
    <img src={isBar ? LOGO_BAR_SRC : LOGO_LOGIN_SRC} alt={APP_NAME} width={width} height={Math.round(width / LOGO_ASPECT_RATIO)}
      className={`brand-logo ${className}`} fetchPriority={priority ? 'high' : 'auto'} draggable={false} />
  );
}
