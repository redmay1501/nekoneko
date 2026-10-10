import type { MemoryView } from '@/features/memory/memory-types';
import { type KnowledgeCatalog, itemsOfType } from '@/features/learning/knowledge-catalog';
import type { ContentKey, KnowledgeItem } from '@/features/learning/knowledge-types';
import { speechTextFor } from '@/features/learning/speech-text';
import { needsReview } from '@/features/learning/study-actions';
import { lessonNumber } from '@/lib/utils/lesson';
import { firstMeaning } from '@/lib/utils/text';
import type { MatchCard } from './match-game';

/**
 * Bộ thẻ cho Ghép thẻ — CHỈ kiến thức người học ĐÃ HỌC (không lấy thứ chưa học làm câu đố).
 * Loại: từ vựng (mặt chữ ↔ nghĩa) hoặc Kanji (chữ ↔ Hán Việt · nghĩa).
 * Phạm vi: tất cả đã học · cần ôn · vừa học (≤ 1 ngày) · một bài (từ vựng).
 */

export const MATCH_KINDS = { 'tu-vung': 'Từ vựng', kanji: 'Kanji' } as const;
export type MatchKind = keyof typeof MATCH_KINDS;

export const MATCH_RANGES = { 'tat-ca': 'Tất cả đã học', 'can-on': 'Cần ôn', 'vua-hoc': 'Vừa học' } as const;
export type MatchRange = keyof typeof MATCH_RANGES | `bai-${number}`;

/** Từ ≤ 1 ngày trước được xem là "vừa học" (gợi ý ngay sau phiên học). */
const RECENT_DAYS = 1;

export function parseMatchKind(value: string | undefined): MatchKind {
  return value === 'kanji' ? 'kanji' : 'tu-vung';
}

export function parseMatchRange(value: string | undefined, kind: MatchKind): MatchRange {
  if (value && value in MATCH_RANGES) return value as MatchRange;
  if (kind === 'tu-vung' && value && /^bai-\d{1,2}$/.test(value)) return value as MatchRange;
  return 'tat-ca';
}

export function matchRangeLabel(range: MatchRange): string {
  return range.startsWith('bai-') ? `Bài ${range.slice(4)}` : MATCH_RANGES[range as keyof typeof MATCH_RANGES];
}

function toCard(item: KnowledgeItem): MatchCard {
  const answer = item.type === 'kanji'
    ? `${item.content.hanViet} · ${firstMeaning(item.content.meaning)}`
    : firstMeaning(item.meaning);
  return { contentKey: item.key, face: item.face, answer, audioText: speechTextFor(item) };
}

function learnedItems(catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>, kind: MatchKind): KnowledgeItem[] {
  return itemsOfType(catalog, kind === 'kanji' ? 'kanji' : 'vocabulary').filter((item) => views.get(item.key)?.isLearned);
}

export function buildMatchPool(
  catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>, kind: MatchKind, range: MatchRange,
): MatchCard[] {
  const learned = learnedItems(catalog, views, kind);
  const inRange = learned.filter((item) => {
    const view = views.get(item.key)!;
    if (range === 'can-on') return needsReview(view);
    if (range === 'vua-hoc') return view.daysSinceSeen !== null && view.daysSinceSeen <= RECENT_DAYS;
    if (range.startsWith('bai-')) return item.type === 'vocabulary' && lessonNumber(item.content.lesson) === Number(range.slice(4));
    return true;
  });
  return inRange.map(toCard);
}

/** Các bài (từ vựng) đã học đủ từ để chơi — để người học chọn bài. */
export function playableLessons(catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>, minimum: number): number[] {
  const counts = new Map<number, number>();
  for (const item of learnedItems(catalog, views, 'tu-vung')) {
    if (item.type !== 'vocabulary') continue;
    const lesson = lessonNumber(item.content.lesson);
    if (Number.isFinite(lesson)) counts.set(lesson, (counts.get(lesson) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count >= minimum).map(([lesson]) => lesson).sort((a, b) => a - b);
}
