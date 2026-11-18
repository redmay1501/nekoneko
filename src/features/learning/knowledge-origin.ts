import { lessonNumber } from '@/lib/utils/lesson';
import type { KnowledgeCatalog } from './knowledge-catalog';
import type { ContentType, KnowledgeItem } from './knowledge-types';

/**
 * NGUỒN GỐC của một kiến thức — để mỗi câu ôn / kiểm tra nói rõ "đang ôn gì, thuộc bài nào, ngày nào":
 * "Ôn tập từ vựng · Bài 1 · Ngày 14". Bài lấy từ nhãn bài của chính kiến thức (từ vựng, ngữ pháp); Kanji và bộ thủ không
 * có nhãn bài → lấy theo bài Minna của NGÀY học kiến thức đó (journeyDays.minna "Bài 4 (1/4)"). Không suy ra được → bỏ trống,
 * không đoán.
 */
export interface KnowledgeOrigin {
  type: ContentType;
  /** Bài Minna (1–25); null = giai đoạn chữ cái / không gắn bài. */
  lesson: number | null;
  /** Ngày lộ trình học kiến thức này lần đầu. */
  day: number | null;
}

export const KNOWLEDGE_TYPE_LABEL: Record<ContentType, string> = {
  hiragana: 'Hiragana', katakana: 'Katakana', radical: 'Bộ thủ', kanji: 'Kanji', vocabulary: 'Từ vựng', grammar: 'Ngữ pháp',
};

const lessonByDayCache = new WeakMap<KnowledgeCatalog, ReadonlyMap<number, number>>();

function lessonByDay(catalog: KnowledgeCatalog): ReadonlyMap<number, number> {
  const cached = lessonByDayCache.get(catalog);
  if (cached) return cached;
  const map = new Map<number, number>();
  for (const day of catalog.content.journeyDays) {
    // Chỉ ngày học MỘT bài ("Bài 4 (1/4)") — ngày ôn "Ôn bài 1–3" không gán một bài cụ thể.
    const match = /^Bài (\d+)\b/.exec(day.minna ?? '');
    if (match) map.set(day.day, Number(match[1]));
  }
  lessonByDayCache.set(catalog, map);
  return map;
}

export function knowledgeOrigin(item: KnowledgeItem, catalog: KnowledgeCatalog): KnowledgeOrigin {
  const ownLesson = item.type === 'vocabulary' || item.type === 'grammar' ? lessonNumber(item.content.lesson ?? '') : Number.POSITIVE_INFINITY;
  const lesson = Number.isFinite(ownLesson) && ownLesson >= 1 && ownLesson <= 25
    ? ownLesson
    : item.type === 'hiragana' || item.type === 'katakana' || item.day === null ? null : lessonByDay(catalog).get(item.day) ?? null;
  return { type: item.type, lesson, day: item.day };
}

/** "Từ vựng · Bài 1 · Ngày 14" (bỏ phần không có). */
export function originLabel(origin: KnowledgeOrigin, { withType = true } = {}): string {
  return [withType ? KNOWLEDGE_TYPE_LABEL[origin.type] : '', origin.lesson ? `Bài ${origin.lesson}` : '', origin.day ? `Ngày ${origin.day}` : '']
    .filter(Boolean).join(' · ');
}
