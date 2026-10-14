'use client';

import { useState } from 'react';
import type { ListeningVideo, VideoSource } from '@/features/listening/video-library';

/** Ảnh 16:9: ảnh YouTube thật (video nhúng); nguồn không cho dùng ảnh / ảnh lỗi → khung chữ của nguồn, không dùng ảnh giả. */
export function VideoThumb({ video, source }: { video: ListeningVideo; source: VideoSource }) {
  const [hasError, setHasError] = useState(false);
  const label = video.title.match(/(?:Bài|Lesson)\s*\d+/)?.[0];
  return (
    <span className={`video-thumb is-${video.source}`}>
      {video.thumbnailUrl && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước chính thức của YouTube (i.ytimg.com), không qua tối ưu ảnh
        <img src={video.thumbnailUrl} alt="" loading="lazy" decoding="async" onError={() => setHasError(true)} />
      ) : (
        <span className="video-thumb-fallback"><b>{source.shortName}</b>{label ? <span>{label}</span> : null}</span>
      )}
      <span className="video-thumb-badge" aria-label={video.embeddable ? 'Xem trong app' : 'Mở tại nguồn'}>
        {video.embeddable ? '▶' : '↗'}<span className="video-thumb-badge-text"> {video.embeddable ? 'Xem trong app' : 'Mở tại nguồn'}</span>
      </span>
    </span>
  );
}
