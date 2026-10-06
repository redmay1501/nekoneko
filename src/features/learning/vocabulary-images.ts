import rawVocabularyImages from '@content/seed/vocabulary-images.json';

/**
 * Ảnh minh hoạ cho DANH TỪ CỤ THỂ (đồ vật, con vật, đồ ăn, phương tiện…): icon 3D Microsoft Fluent Emoji (MIT),
 * tải sẵn vào public/icons/vocab bằng `npm run icons:fetch`. Từ trừu tượng / động từ không có ảnh — không tạo ảnh giả.
 * Khoá = mặt chữ của từ (kanji, hoặc kana nếu không có kanji).
 */
export const VOCABULARY_IMAGE_SOURCES: Readonly<Record<string, string>> = (rawVocabularyImages as { images: Record<string, string> }).images;

export function vocabularyImageFile(fluentPath: string): string {
  return fluentPath.split('/').at(-1)!.replace(/_3d(_default)?\.png$/, '.png');
}

/** Đường dẫn ảnh của một từ, hoặc null nếu từ đó không có ảnh phù hợp. */
export function vocabularyImageOf(face: string): string | null {
  const source = VOCABULARY_IMAGE_SOURCES[face];
  return source ? `/icons/vocab/${vocabularyImageFile(source)}` : null;
}
