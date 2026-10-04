import type { CSSProperties, ReactNode } from 'react';

/**
 * Khối xương (skeleton) — hình dạng giữ chỗ khi màn hình đang tải.
 * Các bộ khung trang (PageSkeletons.tsx) ghép từ những khối nhỏ ở đây, dùng lại đúng class bố cục
 * của màn hình thật (card, grid two, daygrid…) để lúc nội dung hiện ra không bị nhảy.
 */

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 14, radius, className = '', style }: SkeletonProps) {
  return <span className={`skeleton ${className}`} style={{ display: 'block', width, height, borderRadius: radius, ...style }} />;
}

/** Vài dòng chữ, dòng cuối ngắn hơn cho giống đoạn văn thật. */
export function SkeletonText({ lines = 2, lineHeight = 12, className = '' }: { lines?: number; lineHeight?: number; className?: string }) {
  return (
    <span className={`stack ${className}`} style={{ gap: 7 }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} height={lineHeight} radius={6} width={index === lines - 1 && lines > 1 ? '62%' : '100%'} />
      ))}
    </span>
  );
}

/** Tiêu đề trang + một dòng mô tả (+ chip bên phải nếu trang thật có). */
export function SkeletonPageHeader({ hasChip = false, descriptionLines = 1 }: { hasChip?: boolean; descriptionLines?: number }) {
  return (
    <div className="mb-4">
      <div className="between">
        <Skeleton width={180} height={26} radius={10} />
        {hasChip ? <Skeleton width={72} height={26} radius={999} /> : null}
      </div>
      <SkeletonText lines={descriptionLines} className="mt-2.5" />
    </div>
  );
}

/** Thẻ có biểu tượng tròn + tiêu đề + mô tả (thẻ module, thẻ chặng, thẻ loại kiến thức). */
export function SkeletonTileCard({ hasProgress = true }: { hasProgress?: boolean }) {
  return (
    <div className="card tight">
      <div className="row">
        <Skeleton width={42} height={42} radius={14} />
        <span style={{ flex: 1 }} className="stack">
          <Skeleton width="55%" height={14} radius={6} />
          <Skeleton width="80%" height={11} radius={6} style={{ marginTop: -6 }} />
        </span>
      </div>
      {hasProgress ? <Skeleton height={6} radius={999} className="mt-2.5" /> : null}
    </div>
  );
}

/** Một hàng trong danh sách kiến thức (giống .list-row). */
export function SkeletonListRow() {
  return (
    <div className="list-row">
      <Skeleton width={34} height={30} radius={8} />
      <span className="mid stack" style={{ gap: 6 }}>
        <Skeleton width="60%" height={13} radius={6} />
        <Skeleton width="40%" height={10} radius={6} />
      </span>
      <Skeleton width={36} height={8} radius={999} />
    </div>
  );
}

export function SkeletonList({ rows = 6, isGrid = false }: { rows?: number; isGrid?: boolean }) {
  return (
    <div className={isGrid ? 'list-grid stack' : 'stack'} style={{ gap: 9 }}>
      {Array.from({ length: rows }, (_, index) => <SkeletonListRow key={index} />)}
    </div>
  );
}

/** Hàng thẻ lọc dạng viên thuốc. */
export function SkeletonPillTabs({ count = 4 }: { count?: number }) {
  return (
    <div className="pill-tabs">
      {Array.from({ length: count }, (_, index) => <Skeleton key={index} width={index === 0 ? 70 : 92} height={38} radius={999} />)}
    </div>
  );
}

export function SkeletonCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/** Vỏ ngoài của mọi bộ khung trang: báo cho trình đọc màn hình biết đang tải. */
export function SkeletonScreen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
