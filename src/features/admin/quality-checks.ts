import type { ListeningVideo } from '@/features/listening/video-library';
import type { N5Content } from '@/types/content';
import { ENTITY_CONFIG } from './content-entities';
import { auditRoadmap } from './roadmap-audit';

/**
 * Kiểm tra chất lượng nội dung — chỉ đọc, chỉ báo (không tự sửa). Mỗi lỗi kèm đường dẫn tới chỗ sửa trong /admin.
 */
export type IssueSeverity = 'error' | 'warning';
export interface QualityIssue {
  severity: IssueSeverity;
  area: string;
  message: string;
  href?: string;
}

const blank = (value: string | null | undefined) => !value || !value.trim();
const editHref = (entity: keyof typeof ENTITY_CONFIG, id: number) => `/admin/${ENTITY_CONFIG[entity].slug}/${id}`;

export function runQualityChecks(content: N5Content, videos: readonly ListeningVideo[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (severity: IssueSeverity, area: string, message: string, href?: string) => issues.push({ severity, area, message, href });
  const outOfRange = (day: number | null) => day !== null && (day < 1 || day > 90);

  for (const word of content.vocabulary) {
    const name = word.kanji || word.kana || `#${word.id}`;
    if (blank(word.kana)) add('error', 'Từ vựng', `${name}: thiếu cách đọc kana`, editHref('vocabulary', word.id));
    if (blank(word.meaning)) add('error', 'Từ vựng', `${name}: thiếu nghĩa`, editHref('vocabulary', word.id));
    if (outOfRange(word.day)) add('error', 'Từ vựng', `${name}: ngày ${word.day} nằm ngoài 1–90`, editHref('vocabulary', word.id));
  }
  for (const kanji of content.kanji) {
    if (blank(kanji.meaning)) add('error', 'Kanji', `${kanji.character}: thiếu nghĩa`, editHref('kanji', kanji.id));
    if (blank(kanji.onReading) && blank(kanji.kunReading)) add('error', 'Kanji', `${kanji.character}: thiếu cả âm On và Kun`, editHref('kanji', kanji.id));
    if (blank(kanji.hanViet)) add('warning', 'Kanji', `${kanji.character}: thiếu âm Hán Việt`, editHref('kanji', kanji.id));
    if (kanji.strokes === null) add('warning', 'Kanji', `${kanji.character}: thiếu số nét`, editHref('kanji', kanji.id));
    if (outOfRange(kanji.day)) add('error', 'Kanji', `${kanji.character}: ngày ${kanji.day} nằm ngoài 1–90`, editHref('kanji', kanji.id));
  }
  for (const radical of content.radicals) {
    if (blank(radical.meaning)) add('error', 'Bộ thủ', `${radical.radical}: thiếu nghĩa`, editHref('radical', radical.id));
    if (outOfRange(radical.day)) add('error', 'Bộ thủ', `${radical.radical}: ngày ${radical.day} nằm ngoài 1–90`, editHref('radical', radical.id));
  }
  for (const pattern of content.grammar) {
    if (blank(pattern.usage)) add('error', 'Ngữ pháp', `${pattern.pattern}: thiếu cách dùng`, editHref('grammar', pattern.id));
    if (blank(pattern.exampleJp)) add('warning', 'Ngữ pháp', `${pattern.pattern}: chưa có câu ví dụ`, editHref('grammar', pattern.id));
    else if (blank(pattern.exampleVi)) add('error', 'Ngữ pháp', `${pattern.pattern}: câu ví dụ thiếu nghĩa tiếng Việt`, editHref('grammar', pattern.id));
    if (!blank(pattern.example2Jp) && blank(pattern.example2Vi)) add('error', 'Ngữ pháp', `${pattern.pattern}: ví dụ 2 thiếu nghĩa tiếng Việt`, editHref('grammar', pattern.id));
    if (outOfRange(pattern.day)) add('error', 'Ngữ pháp', `${pattern.pattern}: ngày ${pattern.day} nằm ngoài 1–90`, editHref('grammar', pattern.id));
  }

  const roadmap = auditRoadmap(content);
  for (const day of roadmap.days) for (const message of day.missing) add('warning', 'Lộ trình', `Ngày ${day.day}: ${message}`, `/admin/lo-trinh?ngay=${day.day}`);
  for (const group of roadmap.duplicates) {
    const where = group.items.map((item) => `#${item.id}${item.day ? ` (ngày ${item.day})` : ''}`).join(', ');
    add('warning', 'Trùng lặp', `${ENTITY_CONFIG[group.entity].label} "${group.key.split('|').filter(Boolean).join(' / ')}" xuất hiện ${group.items.length} lần: ${where}`,
      editHref(group.entity, group.items[0].id));
  }

  for (const passage of content.readingPassages) {
    const name = `Bài đọc ${passage.id}${passage.title ? ` "${passage.title}"` : ''}`;
    if (blank(passage.textJp)) add('error', 'Bài đọc', `${name}: thiếu đoạn văn`);
    if (blank(passage.textVi)) add('warning', 'Bài đọc', `${name}: thiếu bản dịch tiếng Việt`);
    if (!passage.questions.length) add('warning', 'Bài đọc', `${name}: chưa có câu hỏi`);
    passage.questions.forEach((question, index) => {
      if (question.options.length < 2) add('error', 'Bài đọc', `${name}, câu ${index + 1}: ít hơn 2 lựa chọn`);
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) add('error', 'Bài đọc', `${name}, câu ${index + 1}: đáp án đúng trỏ ra ngoài danh sách lựa chọn`);
      if (new Set(question.options).size !== question.options.length) add('warning', 'Bài đọc', `${name}, câu ${index + 1}: có lựa chọn trùng nhau`);
    });
  }

  for (const video of videos) {
    if (video.status !== 'published') continue;
    if (!video.bilingual) add('error', 'Video', `"${video.title}": đang xuất bản nhưng chưa có cách học song ngữ (bilingual)`, '/admin/video');
    if (!video.verifiedAt) add('error', 'Video', `"${video.title}": chưa có ngày xác minh`, '/admin/video');
    if (video.bilingual === 'switchable' && !(video.subtitles.ja && video.subtitles.vi)) add('error', 'Video', `"${video.title}": ghi "phụ đề chuyển được" nhưng thiếu phụ đề ${video.subtitles.ja ? 'Việt' : 'Nhật'}`, '/admin/video');
    if (video.embeddable && !video.youtubeId) add('error', 'Video', `"${video.title}": cho nhúng nhưng thiếu mã YouTube`, '/admin/video');
  }
  return issues;
}
