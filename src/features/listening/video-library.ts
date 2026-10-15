import rawLibrary from '@content/seed/listening-videos.json';

/**
 * Thư viện video luyện nghe N5 (content/seed/listening-videos.json) — CHỈ video thật đã xác minh (ngày verifiedAt):
 *  - nhúng (`embeddable`) chỉ khi nguồn cho phép: video YouTube do CHÍNH kênh sản xuất, playableInEmbed=true → trình phát
 *    YouTube (không dùng bản người khác đăng lại); thứ tự trong file: xem được ngay + hoạt hình trước;
 *  - còn lại (NHK, Erin) mở tại trang gốc — không lấy luồng video, không dùng ảnh của nguồn.
 * Trình độ luôn kèm cơ sở đánh giá (`levelBasis`). Xem video KHÔNG đổi điểm trí nhớ.
 */

export type VideoSourceId = 'chibi' | 'aiu' | 'oyasumi' | 'irodori' | 'nhk' | 'erin';
/** Kiểu hình: hoạt hình · truyện tranh minh hoạ · quay thật · chưa biết (xem trên trang nguồn). */
export type VideoStyle = 'animation' | 'illustrated' | 'live' | 'unknown';
export type VideoLevel = 'N5' | 'N5-N4';

export interface VideoSource {
  name: string;
  shortName: string;
  homeUrl: string;
  license: string;
}

export interface VideoTopic {
  id: string;
  label: string;
}

export interface ListeningVideo {
  id: string;
  title: string;
  description: string;
  source: VideoSourceId;
  sourceUrl: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  topics: string[];
  style: VideoStyle;
  level: VideoLevel;
  levelBasis: string;
  subtitles: { ja: boolean; vi: boolean; other: string[] };
  subtitleNote?: string;
  embeddable: boolean;
  /**
   * Cách học song ngữ: switchable = phụ đề Nhật và Việt chuyển được trong trình phát (một ngôn ngữ mỗi lúc);
   * source-transcript = trang nguồn có lời thoại Nhật kèm bản dịch Việt. Không có → video không vào danh sách chính.
   */
  bilingual?: 'switchable' | 'source-transcript';
  status: 'published' | 'review' | 'archived';
  /** Vì sao video đang chờ duyệt (không hiện cho người học). */
  reviewReason?: string;
  verifiedAt: string;
  verification: string;
}

interface VideoLibraryFile {
  sources: Record<VideoSourceId, VideoSource>;
  topics: VideoTopic[];
  styles: Array<{ id: VideoStyle; label: string }>;
  videos: ListeningVideo[];
}

const library = rawLibrary as unknown as VideoLibraryFile;
const YOUTUBE_ID = /^[\w-]{11}$/;

export const VIDEO_SOURCES = library.sources;
export const VIDEO_TOPICS = library.topics;
export const VIDEO_STYLE_LABELS = Object.fromEntries(library.styles.map((style) => [style.id, style.label])) as Record<VideoStyle, string>;
export const LEVEL_LABELS: Record<VideoLevel, string> = { N5: 'N5', 'N5-N4': 'N5 – có phần N4' };

/** Mọi video trong tệp, kể cả đang chờ duyệt / lưu trữ — chỉ dùng cho trang admin. */
export const ALL_LISTENING_VIDEOS: readonly ListeningVideo[] = library.videos;

/** Video người học thấy: đã xuất bản; video nhúng phải có mã YouTube hợp lệ. */
export const LISTENING_VIDEOS: readonly ListeningVideo[] = library.videos.filter((video) =>
  video.status === 'published' && (!video.embeddable || (video.youtubeId !== null && YOUTUBE_ID.test(video.youtubeId))));

export function findVideo(id: string): ListeningVideo | undefined {
  return LISTENING_VIDEOS.find((video) => video.id === id);
}

export type SubtitleChoice = 'ja' | 'vi' | 'off';

/** Trình phát YouTube chính thức (chế độ riêng tư nâng cao), giao diện tiếng Việt; bật phụ đề theo ngôn ngữ người học chọn. */
export function youtubeEmbedUrl(youtubeId: string, subtitle: SubtitleChoice): string {
  const params = new URLSearchParams({ rel: '0', hl: 'vi', playsinline: '1' });
  if (subtitle !== 'off') {
    params.set('cc_load_policy', '1');
    params.set('cc_lang_pref', subtitle);
  }
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`;
}

/** Các lựa chọn phụ đề thật sự có cho video (chỉ ngôn ngữ kênh đã tải lên). */
export function subtitleChoices(video: ListeningVideo): SubtitleChoice[] {
  return [...(video.subtitles.ja ? ['ja' as const] : []), ...(video.subtitles.vi ? ['vi' as const] : []), 'off'];
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface VideoFilter {
  query: string;
  topic: string | null;
  source: VideoSourceId | null;
  /** 'watched' | 'unwatched' | null (tất cả). */
  watched: 'watched' | 'unwatched' | null;
  /** 'in-app' = xem ngay trong app · 'animation' = hoạt hình · null = tất cả. */
  view: 'in-app' | 'animation' | null;
}

const fold = (text: string) => text.normalize('NFKC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/** Lọc theo tên / mô tả (không dấu cũng tìm được), chủ đề, nguồn, đã xem. */
export function filterVideos(videos: readonly ListeningVideo[], filter: VideoFilter, watchedIds: ReadonlySet<string>): ListeningVideo[] {
  const query = fold(filter.query.trim());
  return videos.filter((video) =>
    (!query || fold(`${video.title} ${video.description}`).includes(query))
    && (!filter.topic || video.topics.includes(filter.topic))
    && (!filter.source || video.source === filter.source)
    && (filter.watched === null || (filter.watched === 'watched') === watchedIds.has(video.id))
    && (filter.view === null || (filter.view === 'in-app' ? video.embeddable : video.style === 'animation')));
}

/** Video kế tiếp cùng nguồn (theo thứ tự thư viện) — để xem liền mạch. */
export function nextVideoOf(id: string): ListeningVideo | null {
  const index = LISTENING_VIDEOS.findIndex((video) => video.id === id);
  const next = LISTENING_VIDEOS[index + 1];
  return index >= 0 && next && next.source === LISTENING_VIDEOS[index].source ? next : null;
}
