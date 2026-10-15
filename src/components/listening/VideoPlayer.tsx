'use client';

import { useState } from 'react';
import { type ListeningVideo, type SubtitleChoice, subtitleChoices, youtubeEmbedUrl } from '@/features/listening/video-library';

const LABELS: Record<SubtitleChoice, string> = { ja: '日本語 Tiếng Nhật', vi: 'Tiếng Việt', off: 'Tắt phụ đề' };

/**
 * Trình phát YouTube + chọn phụ đề. Trình phát chỉ hiện MỘT ngôn ngữ mỗi lúc → học song ngữ bằng cách xem với phụ đề Nhật,
 * chuyển sang tiếng Việt khi cần hiểu nghĩa. Đổi phụ đề = nạp lại trình phát với ngôn ngữ đó (video bắt đầu lại).
 */
export function VideoPlayer({ video }: { video: ListeningVideo }) {
  const choices = subtitleChoices(video);
  const [subtitle, setSubtitle] = useState<SubtitleChoice>(choices[0]);
  if (!video.youtubeId) return null;
  return (
    <div>
      {choices.length > 1 ? (
        <div className="video-cc-switch" role="radiogroup" aria-label="Phụ đề">
          <span className="tiny muted">Phụ đề:</span>
          {choices.map((choice) => (
            <button key={choice} type="button" role="radio" aria-checked={subtitle === choice}
              className={`chip ${subtitle === choice ? 'pink' : ''}`} onClick={() => setSubtitle(choice)}>{LABELS[choice]}</button>
          ))}
        </div>
      ) : null}
      <div className="video-frame mt-2">
        <iframe key={subtitle} src={youtubeEmbedUrl(video.youtubeId, subtitle)} title={video.title} loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" />
      </div>
      <p className="tiny muted mt-1.5">
        Video không phát? <a className="link tiny" href={video.sourceUrl} target="_blank" rel="noopener noreferrer">Mở trên YouTube</a> — kênh có thể đã đổi quyền nhúng.
      </p>
    </div>
  );
}
