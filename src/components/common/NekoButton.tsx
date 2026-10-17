'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

/**
 * NekoButton — nút 3D dạng viên thuốc. Mặc định KHÔNG còn mèo ngồi trên nút (rê chuột vào nút đã có vết chân mèo — PawHoverEffect);
 * vẫn bật lại được bằng catPose="peek".
 *
 * Thân nút, chữ, icon là code (responsive, bấm được thật); chỉ con mèo là ảnh. Mèo nằm TRONG nút nên lún theo khi bấm,
 * và không chắn chữ: phần chữ chừa chỗ bên phải cho mèo.
 *
 * ẢNH MÈO HIỆN LÀ ẢNH TẠM: môi trường làm việc không có công cụ tạo ảnh, nên tư thế "peek" được cắt từ icon mèo sẵn có
 * của dự án (public/icons/neko/memory.webp — mèo vẽ màu nước 2D, không phải mascot 3D). Khi có ảnh mascot 3D chính thức
 * (PNG/WebP nền trong suốt, mèo nằm vắt trên mép nút), chỉ cần thay `src` trong NEKO_BUTTON_POSES.
 */

export const NEKO_BUTTON_POSES = {
  peek: { src: '/images/mascot/buttons/neko-peek-placeholder.webp', width: 170, height: 200, isPlaceholder: true },
} as const;

export type NekoButtonPose = keyof typeof NEKO_BUTTON_POSES | 'none';
export type NekoButtonVariant = 'primary' | 'review' | 'quiz' | 'success' | 'game' | 'secondary';
export type NekoButtonSize = 'md' | 'lg';

interface NekoButtonBaseProps {
  /** primary: Bắt đầu học · review: Ôn tập · quiz: Kiểm tra · success: Hoàn thành · game: Chơi game · secondary: Xem chi tiết. */
  variant?: NekoButtonVariant;
  size?: NekoButtonSize;
  catPose?: NekoButtonPose;
  leftIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type NekoButtonProps = NekoButtonBaseProps & (
  | { href: string; prefetch?: boolean; type?: never; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }
  | { href?: undefined; prefetch?: never; type?: 'button' | 'submit'; onClick?: (event: MouseEvent<HTMLButtonElement>) => void }
);

function Spinner() {
  return <span className="neko-btn-spinner" aria-hidden="true" />;
}

export function NekoButton(props: NekoButtonProps) {
  const { variant = 'primary', size = 'md', catPose = 'none', leftIcon, loading = false, disabled = false, fullWidth = false, className, children } = props;
  const pose = catPose === 'none' ? null : NEKO_BUTTON_POSES[catPose];
  const isInactive = disabled || loading;
  const classes = [
    'neko-btn', `neko-btn-${variant}`, `neko-btn-${size}`,
    pose ? 'has-cat' : '', fullWidth ? 'is-full' : '', isInactive ? 'is-inactive' : '', loading ? 'is-loading' : '', className ?? '',
  ].filter(Boolean).join(' ');

  const body = (
    <>
      {pose ? (
        <Image src={pose.src} alt="" width={pose.width} height={pose.height} sizes="72px" aria-hidden="true"
          className={`neko-btn-cat${pose.isPlaceholder ? ' is-placeholder' : ''}`} />
      ) : null}
      <span className="neko-btn-face">
        {loading ? <Spinner /> : leftIcon ? <span className="neko-btn-icon" aria-hidden="true">{leftIcon}</span> : null}
        <span className="neko-btn-label">{children}</span>
      </span>
    </>
  );

  if (props.href !== undefined) {
    // Liên kết không có "disabled" thật → khoá bằng aria-disabled + chặn bấm.
    return (
      <Link href={props.href} prefetch={props.prefetch} className={classes} aria-disabled={isInactive || undefined} aria-busy={loading || undefined}
        tabIndex={isInactive ? -1 : undefined}
        onClick={(event) => { if (isInactive) { event.preventDefault(); return; } props.onClick?.(event); }}>
        {body}
      </Link>
    );
  }
  return (
    <button type={props.type ?? 'button'} className={classes} disabled={isInactive} aria-busy={loading || undefined}
      onClick={props.onClick}>
      {body}
    </button>
  );
}
