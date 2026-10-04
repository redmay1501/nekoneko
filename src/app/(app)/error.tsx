'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { USER_MESSAGES } from '@/lib/constants/messages';
import { logger } from '@/lib/utils/logger';

/** SC-40 · Hỏng cũng phải nói rõ và chỉ đường quay lại. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Lỗi khi hiển thị màn hình', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="center" style={{ padding: '40px 0' }} role="alert">
      <SpriteIcon name="noko" size={90} className="mx-auto" />
      <h2 className="mt-2.5">{USER_MESSAGES.GENERIC_ERROR}</h2>
      <p className="soft sm mt-1.5">Dữ liệu học của bạn vẫn an toàn. Thử tải lại màn hình này nhé.</p>
      <div className="row mt-4" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={reset}>Thử lại</button>
        <Link className="btn quiet" href="/">Về trang chủ</Link>
      </div>
    </div>
  );
}
