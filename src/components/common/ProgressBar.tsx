interface ProgressBarProps {
  percent: number;
  variant?: 'default' | 'thin' | 'mint' | 'thin-mint';
  label: string;
  className?: string;
}

/** Thanh tiến độ. Luôn có nhãn cho trình đọc màn hình — không chỉ dựa vào màu. */
export function ProgressBar({ percent, variant = 'default', label, className }: ProgressBarProps) {
  const variantClass = { default: '', thin: 'thin', mint: 'mint', 'thin-mint': 'thin mint' }[variant];
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className={`bar ${variantClass} ${className ?? ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${value}%` }} />
    </div>
  );
}
