import Link from 'next/link';
import { LottieAnimation } from '@/components/common/LottieAnimation';

export default function NotFound() {
  return (
    <main className="view">
      <div className="center" style={{ padding: '40px 0' }}>
        {/* Mèo Luna ngủ trên laptop "404" (Lottie; có lớp chữ Z nên dùng bản player đầy đủ). */}
        <LottieAnimation src="/animations/not-found-luna.json" className="not-found-cat" player="svg" stillFrame={120} />
        <h2 className="mt-2.5">Không tìm thấy trang này</h2>
        <p className="soft sm mt-1.5">Có thể đường dẫn đã thay đổi. Quay lại trang chủ nhé.</p>
        <Link className="btn mt-4" href="/">Về trang chủ</Link>
      </div>
    </main>
  );
}
