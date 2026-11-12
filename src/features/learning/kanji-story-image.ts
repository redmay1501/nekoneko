import type { KanjiStoryImage } from '@/types/content';

/**
 * Thứ tự thử ảnh của câu chuyện: bản sao trên Storage của app (nếu có) → URL gốc của thư viện. Bỏ trống, bỏ trùng.
 * Hết danh sách mà vẫn lỗi → giao diện hiện khung "chưa tải được" kèm link trang nguồn.
 */
export function storyImageCandidates(image: Pick<KanjiStoryImage, 'hostedUrl' | 'url'>): string[] {
  return [image.hostedUrl, image.url].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);
}
