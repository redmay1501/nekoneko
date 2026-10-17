import { LottieAnimation } from './LottieAnimation';

/**
 * Hình "đang xử lý" (Lottie loading — cậu bé chạy) cho lúc chờ SAU KHI hoàn thành (lưu tổng kết phiên học, mở ngày mới).
 * Tệp gốc là khung dọc 750×1624 với nhân vật nhỏ ở phía trên → cắt khung quanh nhân vật (viewBox) cho rõ.
 */
export function LoadingRunner({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`loading-runner ${className}`} role="status" aria-live="polite">
      <LottieAnimation src="/animations/loading-runner.json" className="loading-runner-art" viewBox="100 290 550 460" />
      <span className="loading-runner-label">{label}</span>
    </div>
  );
}
