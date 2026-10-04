import { APP_NAME, LOGO_ASPECT_RATIO, LOGO_SRC } from '@/config/brand';

/** Logo Neko Neko. Ảnh có chữ tên app nên alt = tên app; tải sớm vì nằm ở khung trên cùng. */
export function BrandLogo({ width, className = '' }: { width: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo WebP tĩnh trong public/, đã tối ưu sẵn.
    <img src={LOGO_SRC} alt={APP_NAME} width={width} height={Math.round(width / LOGO_ASPECT_RATIO)}
      className={`brand-logo ${className}`} fetchPriority="high" draggable={false} />
  );
}
