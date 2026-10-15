/**
 * Icon "hoàn thành / kiểm tra" của NekoNeko: vòng tròn nét mảnh + dấu tích, màu theo currentColor (mặc định hồng thương hiệu).
 * `filled` = trạng thái đã chọn / đã xong (nền hồng, tích trắng) — phân biệt với trạng thái chưa xong bằng hình, không chỉ bằng màu.
 */
export function CheckCircleIcon({ size = 18, filled = false, className = '' }: { size?: number; filled?: boolean; className?: string }) {
  return (
    <svg className={`check-circle-icon ${filled ? 'is-filled' : ''} ${className}`} width={size} height={size} viewBox="0 0 24 24"
      aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.25" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.9 12.3 10.7 15.1 16.2 9.4" fill="none" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
