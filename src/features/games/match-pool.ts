import type { MemoryView } from '@/features/memory/memory-types';
import { type KnowledgeCatalog, itemsOfType } from '@/features/learning/knowledge-catalog';
import type { ContentKey, ContentType, KnowledgeItem } from '@/features/learning/knowledge-types';
import { speechTextFor } from '@/features/learning/speech-text';
import { knowledgeGroups, needsReview } from '@/features/learning/study-actions';
import { firstMeaning } from '@/lib/utils/text';
import type { MatchCard } from './match-game';

/**
 * Bộ thẻ cho Ghép thẻ — người chơi CHỌN phạm vi như ở phần học: đã học, cần ôn, vừa học, tất cả, hoặc từng phần
 * (bài từ vựng, nhóm Kanji, nhóm chữ cái) — kể cả phần chưa học tới (ôn trước / làm quen).
 * Loại: từ vựng / Kanji (mặt chữ ↔ nghĩa), Hiragana / Katakana (chữ ↔ romaji).
 */

export const MATCH_KINDS = { 'tu-vung': 'Từ vựng', kanji: 'Kanji', hiragana: 'Hiragana', katakana: 'Katakana' } as const;
export type MatchKind = keyof typeof MATCH_KINDS;

const CONTENT_TYPE: Record<MatchKind, ContentType> = { 'tu-vung': 'vocabulary', kanji: 'kanji', hiragana: 'hiragana', katakana: 'katakana' };

/** Phạm vi theo trí nhớ; ngoài ra là id một nhóm của knowledgeGroups (nhom-3, phan-8…). */
export const MEMORY_RANGES = { 'da-hoc': 'Đã học', 'can-on': 'Cần ôn', 'vua-hoc': 'Vừa học', 'tat-ca': 'Tất cả' } as const;

/** Từ ≤ 1 ngày trước được xem là "vừa học" (gợi ý ngay sau phiên học). */
const RECENT_DAYS = 1;
const MIN_POOL = 3;

export interface MatchRangeOption {
  id: string;
  label: string;
  size: number;
}

export interface MatchPool {
  kind: MatchKind;
  range: string;
  cards: MatchCard[];
  options: MatchRangeOption[];
}

export function parseMatchKind(value: string | undefined): MatchKind {
  return value && value in MATCH_KINDS ? (value as MatchKind) : 'tu-vung';
}

function toCard(item: KnowledgeItem): MatchCard {
  const answer = item.type === 'kanji'
    ? `${item.content.hanViet} · ${firstMeaning(item.content.meaning)}`
    : item.type === 'hiragana' || item.type === 'katakana' ? item.reading : firstMeaning(item.meaning);
  return { contentKey: item.key, face: item.face, answer, audioText: speechTextFor(item) };
}

export function buildMatchPool(
  catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>, kind: MatchKind, requestedRange: string | undefined,
): MatchPool {
  const items = itemsOfType(catalog, CONTENT_TYPE[kind]) as KnowledgeItem[];
  const viewOf = (item: KnowledgeItem) => views.get(item.key);
  const byMemory: Record<keyof typeof MEMORY_RANGES, KnowledgeItem[]> = {
    'da-hoc': items.filter((item) => viewOf(item)?.isLearned),
    'can-on': items.filter((item) => viewOf(item)?.isLearned && needsReview(viewOf(item)!)),
    'vua-hoc': items.filter((item) => {
      const view = viewOf(item);
      return view?.isLearned && view.daysSinceSeen !== null && view.daysSinceSeen <= RECENT_DAYS;
    }),
    'tat-ca': items,
  };
  const parts = knowledgeGroups(CONTENT_TYPE[kind], items).map((group) => ({ id: group.id, label: group.label, keys: group.items.map((item) => item.key) }));
  const keysByPart = new Map(parts.map((part) => [part.id, new Set<string>(part.keys)]));

  const options: MatchRangeOption[] = [
    ...(Object.keys(MEMORY_RANGES) as Array<keyof typeof MEMORY_RANGES>)
      .map((id) => ({ id, label: MEMORY_RANGES[id], size: byMemory[id].length }))
      .filter((option) => option.size >= MIN_POOL),
    ...parts.filter((part) => part.keys.length >= MIN_POOL).map((part) => ({ id: part.id, label: part.label, size: part.keys.length })),
  ];
  // Phạm vi lạ / không đủ thẻ → mặc định: thứ đã học nếu có, chưa thì phần đầu tiên.
  const firstPart = options.find((option) => !(option.id in MEMORY_RANGES));
  const fallback = byMemory['da-hoc'].length >= MIN_POOL ? 'da-hoc' : firstPart?.id ?? 'tat-ca';
  const range = options.some((option) => option.id === requestedRange) ? requestedRange! : fallback;
  const chosen = range in MEMORY_RANGES
    ? byMemory[range as keyof typeof MEMORY_RANGES]
    : items.filter((item) => keysByPart.get(range)?.has(item.key));
  return { kind, range, cards: chosen.map(toCard), options };
}
