'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  LEVEL_LABELS, type ListeningVideo, type VideoFilter, type VideoSource, type VideoSourceId, type VideoTopic, filterVideos, formatDuration,
} from '@/features/listening/video-library';
import { VideoThumb } from './VideoThumb';

interface VideoLibraryProps {
  videos: ListeningVideo[];
  sources: Record<VideoSourceId, VideoSource>;
  topics: VideoTopic[];
  watchedIds: string[];
}

const WATCHED_FILTERS = [
  { id: null, label: 'Tất cả' },
  { id: 'unwatched', label: 'Chưa xem' },
  { id: 'watched', label: 'Đã xem' },
] as const;

/** Thư viện video N5: tìm theo tên (không dấu cũng được), lọc chủ đề / nguồn / đã xem; mỗi thẻ mở trang xem video. */
export function VideoLibrary({ videos, sources, topics, watchedIds }: VideoLibraryProps) {
  const [filter, setFilter] = useState<VideoFilter>({ query: '', topic: null, source: null, watched: null });
  const watched = useMemo(() => new Set(watchedIds), [watchedIds]);
  const results = useMemo(() => filterVideos(videos, filter, watched), [videos, filter, watched]);
  const topicLabel = new Map(topics.map((topic) => [topic.id, topic.label]));
  const usedTopics = topics.filter((topic) => videos.some((video) => video.topics.includes(topic.id)));
  const update = (patch: Partial<VideoFilter>) => setFilter((current) => ({ ...current, ...patch }));
  const isFiltered = Boolean(filter.query || filter.topic || filter.source || filter.watched);

  return (
    <section aria-label="Video tiếng Nhật N5">
      <p className="soft sm" style={{ margin: '4px 0 10px' }}>
        {videos.length} video từ Japan Foundation và NHK cho người mới học · ▶ xem ngay trong app, ↗ mở ở trang gốc. Đã xem {watched.size}/{videos.length}.
      </p>
      <input className="input" type="search" value={filter.query} onChange={(event) => update({ query: event.target.value })}
        placeholder="Tìm video: gọi món, hỏi đường, いくら…" aria-label="Tìm video" />
      <div className="chip-scroll mt-2.5" role="group" aria-label="Chủ đề">
        <button type="button" className={`chip ${filter.topic === null ? 'pink' : ''}`} aria-pressed={filter.topic === null} onClick={() => update({ topic: null })}>Mọi chủ đề</button>
        {usedTopics.map((topic) => (
          <button key={topic.id} type="button" className={`chip ${filter.topic === topic.id ? 'pink' : ''}`} aria-pressed={filter.topic === topic.id}
            onClick={() => update({ topic: filter.topic === topic.id ? null : topic.id })}>{topic.label}</button>
        ))}
      </div>
      <div className="video-filter-row mt-2">
        <div className="chip-scroll" role="group" aria-label="Nguồn">
          <button type="button" className={`chip ${filter.source === null ? 'pink' : ''}`} aria-pressed={filter.source === null} onClick={() => update({ source: null })}>Mọi nguồn</button>
          {(Object.keys(sources) as VideoSourceId[]).map((id) => (
            <button key={id} type="button" className={`chip ${filter.source === id ? 'pink' : ''}`} aria-pressed={filter.source === id}
              onClick={() => update({ source: filter.source === id ? null : id })}>{sources[id].shortName}</button>
          ))}
        </div>
        <div className="chip-scroll" role="group" aria-label="Đã xem">
          {WATCHED_FILTERS.map((option) => (
            <button key={option.label} type="button" className={`chip ${filter.watched === option.id ? 'pink' : ''}`} aria-pressed={filter.watched === option.id}
              onClick={() => update({ watched: option.id })}>{option.label}</button>
          ))}
        </div>
      </div>
      <p className="tiny muted mt-2" aria-live="polite">
        {results.length} video{isFiltered ? ' phù hợp' : ''}
        {isFiltered ? <> · <button type="button" className="link tiny" onClick={() => setFilter({ query: '', topic: null, source: null, watched: null })}>Bỏ lọc</button></> : null}
      </p>
      {results.length ? (
        <ul className="video-grid mt-2">
          {results.map((video) => (
            <li key={video.id}>
              <Link href={`/luyen-tap/nghe/video/${video.id}`} className="video-card" prefetch={false}>
                <VideoThumb video={video} source={sources[video.source]} />
                <span className="video-card-body">
                  <b className="video-card-title jp">{video.title}</b>
                  <span className="video-card-desc">{video.description}</span>
                  <span className="video-card-meta">
                    <span>{sources[video.source].shortName}</span>
                    <span>{video.topics.map((topic) => topicLabel.get(topic)).join(', ')}</span>
                    <span>{LEVEL_LABELS[video.level]}</span>
                    {formatDuration(video.durationSeconds) ? <span>⏱ {formatDuration(video.durationSeconds)}</span> : null}
                    <span>CC {[video.subtitles.ja && 'JP', video.subtitles.vi && 'VI'].filter(Boolean).join(' · ') || 'không có'}</span>
                    {watched.has(video.id) ? <span className="video-watched">✓ Đã xem</span> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card tight mt-2 center">
          <p className="sm">Không có video nào khớp.</p>
          <button type="button" className="btn ghost sm mt-2" onClick={() => setFilter({ query: '', topic: null, source: null, watched: null })}>Xem tất cả video</button>
        </div>
      )}
    </section>
  );
}
