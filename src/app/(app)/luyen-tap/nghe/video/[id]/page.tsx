import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VideoPlayer } from '@/components/listening/VideoPlayer';
import { WatchedToggle } from '@/components/listening/WatchedToggle';
import { getLearnerContext } from '@/features/learning/learner-context';
import {
  LEVEL_LABELS, VIDEO_SOURCES, VIDEO_STYLE_LABELS, VIDEO_TOPICS, findVideo, formatDuration, nextVideoOf,
} from '@/features/listening/video-library';
import { watchedVideoIds } from '@/features/listening/video-progress';

const LIST_HREF = '/luyen-tap/nghe?muc=video';

/** Xem một video luyện nghe: trình phát YouTube chính thức (nếu nguồn cho nhúng) hoặc nút mở trang gốc; phụ đề ghi đúng sự thật. */
export default async function ListeningVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const video = findVideo((await params).id);
  if (!video) notFound();
  const { settings } = await getLearnerContext();
  const source = VIDEO_SOURCES[video.source];
  const isWatched = watchedVideoIds(settings.gameRecords).includes(video.id);
  const next = nextVideoOf(video.id);
  const topics = VIDEO_TOPICS.filter((topic) => video.topics.includes(topic.id)).map((topic) => topic.label);
  const duration = formatDuration(video.durationSeconds);

  return (
    <>
      <Link className="link" href={LIST_HREF}>← Video N5</Link>
      <div className="video-detail mt-2">
        {video.embeddable && video.youtubeId ? (
          <VideoPlayer video={video} />
        ) : (
          <div className="card video-external">
            <p className="sm">Video này phát trên trang <b>{source.name}</b> — nguồn không cho nhúng vào ứng dụng khác.</p>
            <a className="btn mt-3" href={video.sourceUrl} target="_blank" rel="noopener noreferrer">↗ Xem tại nguồn</a>
            <p className="tiny muted mt-2">Mở trong thẻ mới. Xem xong quay lại đây để đánh dấu “đã xem”.</p>
          </div>
        )}
        <div className="video-info">
          <h1 className="jp video-title">{video.title}</h1>
          <p className="soft sm mt-1">{video.description}</p>
          <div className="row wrap mt-2" style={{ gap: 6 }}>
            <span className="chip lav">{source.shortName}</span>
            {video.style !== 'unknown' ? <span className="chip">{VIDEO_STYLE_LABELS[video.style]}</span> : null}
            {topics.map((label) => <span key={label} className="chip">{label}</span>)}
            <span className="chip mint">{LEVEL_LABELS[video.level]}</span>
            {duration ? <span className="chip">⏱ {duration}</span> : null}
          </div>
          <div className="card tight mt-3 video-subtitles">
            <b className="sm">Phụ đề</b>
            <ul className="sm mt-1.5">
              <li>Tiếng Nhật: {video.subtitles.ja ? (video.embeddable ? 'có — chọn “日本語” phía trên video.' : 'có trên trang nguồn.') : 'không có.'}</li>
              <li>Tiếng Việt: {video.subtitles.vi ? (video.embeddable ? 'có — chọn “Tiếng Việt” phía trên video.' : 'bản dịch có trên trang nguồn.') : 'nguồn chưa có phụ đề tiếng Việt.'}</li>
              {video.subtitles.other.length ? <li>Khác: {video.subtitles.other.join(', ')}.</li> : null}
            </ul>
            {video.subtitleNote ? <p className="tiny muted mt-1">{video.subtitleNote}</p> : null}
          </div>
          <p className="tiny muted mt-2">Trình độ: {video.levelBasis}</p>
          <div className="row wrap mt-3" style={{ gap: 8, alignItems: 'center' }}>
            <WatchedToggle videoId={video.id} initialWatched={isWatched} />
            {video.embeddable ? <a className="btn ghost sm" href={video.sourceUrl} target="_blank" rel="noopener noreferrer">↗ Mở trên YouTube</a> : null}
          </div>
          <p className="tiny muted mt-3">Nguồn: <a className="link tiny" href={source.homeUrl} target="_blank" rel="noopener noreferrer">{source.name}</a> · {source.license} · Kiểm tra ngày {video.verifiedAt}.</p>
          <div className="row mt-4" style={{ gap: 8, justifyContent: 'space-between' }}>
            <Link className="btn quiet sm" href={LIST_HREF}>← Danh sách video</Link>
            {next ? <Link className="btn quiet sm" href={`/luyen-tap/nghe/video/${next.id}`}>Video tiếp →</Link> : <span />}
          </div>
        </div>
      </div>
    </>
  );
}
