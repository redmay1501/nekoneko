import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';

export default function NotFound() {
  return (
    <main className="view">
      <div className="center" style={{ padding: '40px 0' }}>
        <SpriteIcon name="noko" size={90} className="mx-auto" />
        <h2 className="mt-2.5">Không tìm thấy trang này</h2>
        <p className="soft sm mt-1.5">Có thể đường dẫn đã thay đổi. Quay lại trang chủ nhé.</p>
        <Link className="btn mt-4" href="/">Về trang chủ</Link>
      </div>
    </main>
  );
}
