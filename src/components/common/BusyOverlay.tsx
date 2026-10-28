import { LottieAnimation } from './LottieAnimation';

/**
 * Lớp phủ "đang xử lý" nổi trên MỘT khu vực (thẻ xác nhận, chân hộp thoại…) — đặt trong phần tử cha `position: relative`.
 * Nằm ngoài luồng bố cục (absolute) nên các nút bên dưới giữ nguyên kích thước và vị trí; chặn bấm trong khu vực đó,
 * phần còn lại của app vẫn dùng được. Ẩn = không render (cha quyết định theo trạng thái gửi yêu cầu).
 */
export function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="busy-overlay" role="status" aria-live="polite">
      <div className="busy-overlay-card">
        <LottieAnimation src="/animations/loading-runner.json" className="busy-overlay-art" viewBox="100 290 550 460" />
        <span>{label}</span>
      </div>
    </div>
  );
}
