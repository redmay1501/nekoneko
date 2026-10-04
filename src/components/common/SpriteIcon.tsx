import type { SpriteSymbolId } from './sprite-markup';

interface SpriteIconProps {
  name: SpriteSymbolId;
  size: number;
  /** Có nhãn → ảnh có nghĩa với trình đọc màn hình. Không có → chỉ để trang trí. */
  label?: string;
  className?: string;
}

export function SpriteIcon({ name, size, label, className }: SpriteIconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
