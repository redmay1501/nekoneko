'use client';

import { useState } from 'react';
import type { ContentImage } from '@/types/content';

/**
 * Ảnh minh hoạ của một mục học. Ảnh lỗi (đã bị gỡ, mạng chập chờn) → ẩn hẳn khung ảnh, chữ bên cạnh vẫn đủ nghĩa.
 * Kích thước cố định để thẻ không nhảy bố cục khi ảnh tải xong.
 */
export function ContentImageView({ image, size = 64, className = '' }: { image: ContentImage | null | undefined; size?: number; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!image?.url || failedUrl === image.url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ từ Supabase Storage / public, không cần tối ưu qua next/image
    <img src={image.url} alt={image.alt} width={size} height={size} loading="lazy" decoding="async"
      className={`content-image ${className}`} style={{ width: size, height: size }} onError={() => setFailedUrl(image.url)} />
  );
}
