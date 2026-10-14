import { describe, expect, it } from 'vitest';
import rawLibrary from '@content/seed/listening-videos.json';
import { LISTENING_VIDEOS, VIDEO_SOURCES, VIDEO_TOPICS, filterVideos, formatDuration, nextVideoOf, youtubeEmbedUrl } from './video-library';

const ALL = { query: '', topic: null, source: null, watched: null, view: null } as const;
const YOUTUBE_SOURCES = ['chibi', 'aiu', 'oyasumi', 'irodori'];

describe('thư viện video luyện nghe', () => {
  it('mọi video có nguồn, chủ đề hợp lệ, link https của đúng nguồn, ngày xác minh và cơ sở trình độ', () => {
    const topics = new Set(VIDEO_TOPICS.map((topic) => topic.id));
    const hosts: Record<string, string> = { chibi: 'www.youtube.com', aiu: 'www.youtube.com', oyasumi: 'www.youtube.com', irodori: 'www.youtube.com', nhk: 'www3.nhk.or.jp', erin: 'www.erin.jpf.go.jp' };
    expect(new Set(LISTENING_VIDEOS.map((video) => video.id)).size).toBe(LISTENING_VIDEOS.length);
    for (const video of LISTENING_VIDEOS) {
      expect(VIDEO_SOURCES[video.source]).toBeDefined();
      expect(video.topics.every((topic) => topics.has(topic))).toBe(true);
      expect(new URL(video.sourceUrl).host).toBe(hosts[video.source]);
      expect(video.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(video.levelBasis.length).toBeGreaterThan(10);
    }
  });

  it('chỉ video YouTube (của chính kênh) mới nhúng; NHK / Erin luôn mở tại nguồn và không dùng ảnh của nguồn', () => {
    for (const video of LISTENING_VIDEOS) {
      if (video.embeddable) {
        expect(YOUTUBE_SOURCES).toContain(video.source);
        expect(video.sourceUrl).toBe(`https://www.youtube.com/watch?v=${video.youtubeId}`);
        expect(video.youtubeId).toMatch(/^[\w-]{11}$/);
        expect(video.durationSeconds).toBeGreaterThan(0);
        expect(video.thumbnailUrl).toBe(`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`);
      } else {
        expect(video.youtubeId).toBeNull();
        expect(video.thumbnailUrl).toBeNull();
      }
    }
    expect(LISTENING_VIDEOS.filter((video) => video.embeddable)).toHaveLength(65);
    // Xem được ngay đứng trước video mở tại nguồn; hoạt hình đứng đầu.
    const firstExternal = LISTENING_VIDEOS.findIndex((video) => !video.embeddable);
    expect(LISTENING_VIDEOS.slice(firstExternal).every((video) => !video.embeddable)).toBe(true);
    expect(LISTENING_VIDEOS[0].style).toBe('animation');
  });

  it('không có phụ đề tiếng Việt thì không ghi là có (IRODORI chỉ có Nhật / Anh / Khmer)', () => {
    for (const video of LISTENING_VIDEOS.filter((entry) => entry.source === 'irodori')) {
      expect(video.subtitles).toMatchObject({ ja: true, vi: false });
    }
  });

  it('lọc "Xem trong app" và "Hoạt hình"; phụ đề tiếng Việt chỉ ghi có khi kênh thật sự tải lên', () => {
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, view: 'in-app' }, new Set()).every((video) => video.embeddable)).toBe(true);
    const animated = filterVideos(LISTENING_VIDEOS, { ...ALL, view: 'animation' }, new Set());
    expect(animated.length).toBe(31);
    expect(animated.every((video) => video.style === 'animation' && video.embeddable)).toBe(true);
    for (const video of LISTENING_VIDEOS.filter((entry) => entry.source === 'oyasumi')) expect(video.subtitles.vi).toBe(true);
    for (const video of LISTENING_VIDEOS.filter((entry) => entry.source === 'chibi' || entry.source === 'aiu')) expect(video.subtitles.vi).toBe(false);
  });

  it('video "review" không hiện cho người học', () => {
    const file = rawLibrary as unknown as { videos: Array<{ status: string }> };
    expect(LISTENING_VIDEOS.length).toBe(file.videos.filter((video) => video.status === 'published').length);
  });

  it('tìm không dấu, lọc chủ đề / nguồn / đã xem', () => {
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, query: 'goi mon' }, new Set()).every((video) => /gọi món/i.test(`${video.title} ${video.description}`))).toBe(true);
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, query: 'お願いします' }, new Set()).length).toBeGreaterThan(0);
    const food = filterVideos(LISTENING_VIDEOS, { ...ALL, topic: 'an-uong' }, new Set());
    expect(food.length).toBeGreaterThan(0);
    expect(food.every((video) => video.topics.includes('an-uong'))).toBe(true);
    const watched = new Set([LISTENING_VIDEOS[0].id]);
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, watched: 'watched' }, watched).map((video) => video.id)).toEqual([LISTENING_VIDEOS[0].id]);
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, watched: 'unwatched' }, watched)).toHaveLength(LISTENING_VIDEOS.length - 1);
    expect(filterVideos(LISTENING_VIDEOS, { ...ALL, query: 'zzzz không có' }, new Set())).toEqual([]);
  });

  it('trình phát nhúng dùng youtube-nocookie và bật phụ đề tiếng Nhật; tiện ích nhỏ', () => {
    expect(youtubeEmbedUrl('3stbOEUrCE4', true)).toBe('https://www.youtube-nocookie.com/embed/3stbOEUrCE4?rel=0&hl=vi&playsinline=1&cc_load_policy=1&cc_lang_pref=ja');
    expect(formatDuration(69)).toBe('1:09');
    expect(formatDuration(null)).toBeNull();
    expect(nextVideoOf('nhk-01')?.id).toBe('nhk-02');
    expect(nextVideoOf('nhk-48')).toBeNull();
  });
});

describe('đã xem', () => {
  it('đánh dấu rồi bỏ đánh dấu, không đụng kỷ lục khác', async () => {
    const { setVideoWatched, watchedVideoIds } = await import('./video-progress');
    const other = { 'match:tu-vung:da-hoc:6': { bestAccuracy: 90, bestTimeMs: 1, plays: 1, lastPlayedAt: 'x' } };
    const on = setVideoWatched(other, 'nhk-01', true, new Date('2026-10-14T00:00:00Z'));
    expect(watchedVideoIds(on)).toEqual(['nhk-01']);
    const off = setVideoWatched(on, 'nhk-01', false, new Date());
    expect(off).toEqual(other);
  });
});
