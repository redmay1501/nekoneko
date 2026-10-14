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

/** Phạm vi theo trí nhớ; ngoài ra là id một hay nhiều nhóm của knowledgeGroups (nhom-3, phan-8…), cách nhau dấu phẩy. */
export const MEMORY_RANGES = { 'da-hoc': 'Đã học', 'can-on': 'Cần ôn', 'vua-hoc': 'Vừa học', 'tat-ca': 'Tất cả' } as const;

/** Từ ≤ 1 ngày trước được xem là "vừa học" (gợi ý ngay sau phiên học). */
const RECENT_DAYS = 1;
const MIN_POOL = 3;
/** Ghép quá chừng này phần thì nhãn chỉ ghi số phần ("5 bài"). */
const MAX_NAMED_PARTS = 3;
export const RANGE_SEPARATOR = ',';

export interface MatchRangeOption {
  id: string;
  label: string;
  size: number;
}

export interface MatchPool {
  kind: MatchKind;
  /** Một phạm vi theo trí nhớ, hoặc MỘT HAY NHIỀU phần ghép bằng dấu phẩy ("bai-1,bai-3") theo thứ tự trong danh sách. */
  range: string;
  /** Nhãn của phạm vi đang chơi ("Bài 1 + Bài 3", "5 bài"). */
  rangeLabel: string;
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

  // Mỗi phần đều chọn được (kể cả phần nhỏ) — ghép nhiều phần lại là đủ thẻ.
  const options: MatchRangeOption[] = [
    ...(Object.keys(MEMORY_RANGES) as Array<keyof typeof MEMORY_RANGES>)
      .map((id) => ({ id, label: MEMORY_RANGES[id], size: byMemory[id].length }))
      .filter((option) => option.size >= MIN_POOL),
    ...parts.filter((part) => part.keys.length).map((part) => ({ id: part.id, label: part.label, size: part.keys.length })),
  ];
  const partOrder = parts.map((part) => part.id);
  const requestedParts = (requestedRange ?? '').split(RANGE_SEPARATOR).filter((id) => keysByPart.has(id));
  const chosenParts = partOrder.filter((id) => requestedParts.includes(id));
  const chosenKeys = new Set(chosenParts.flatMap((id) => [...keysByPart.get(id)!]));
  const partItems = items.filter((item) => chosenKeys.has(item.key));

  // Phạm vi lạ / không đủ thẻ → mặc định: thứ đã học nếu có, chưa thì phần đầu tiên đủ thẻ.
  const firstPart = options.find((option) => !(option.id in MEMORY_RANGES) && option.size >= MIN_POOL);
  const fallback = byMemory['da-hoc'].length >= MIN_POOL ? 'da-hoc' : firstPart?.id ?? 'tat-ca';
  const isMemoryRange = Boolean(requestedRange && requestedRange in MEMORY_RANGES && options.some((option) => option.id === requestedRange));
  const range = isMemoryRange ? requestedRange! : partItems.length >= MIN_POOL ? chosenParts.join(RANGE_SEPARATOR) : fallback;
  const chosen = range in MEMORY_RANGES
    ? byMemory[range as keyof typeof MEMORY_RANGES]
    : items.filter((item) => range.split(RANGE_SEPARATOR).some((id) => keysByPart.get(id)?.has(item.key)));
  const labelOf = (id: string) => options.find((option) => option.id === id)?.label ?? id;
  const rangeIds = range.split(RANGE_SEPARATOR);
  const rangeLabel = rangeIds.length === 1 ? labelOf(range)
    : rangeIds.length <= MAX_NAMED_PARTS ? rangeIds.map(labelOf).join(' + ')
      : `${rangeIds.length} ${kind === 'tu-vung' ? 'bài' : 'nhóm'}`;
  return { kind, range, rangeLabel, cards: chosen.map(toCard), options };
}
