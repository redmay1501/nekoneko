import { pickDeterministic } from '@/lib/utils/deterministic-random';
import { speechTextFor } from '@/features/learning/speech-text';
import type { KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { CONTENT_TYPE_LABELS, type ContentKey, type ContentType, type KnowledgeItem } from '@/features/learning/knowledge-types';
import { calculateMemoryHealth, countByStatus, getForgettingRadar, pickMemorySurprise } from './memory-engine';
import type { MemoryStatus, MemoryView } from './memory-types';

/**
 * Các "cách nhìn" tổng hợp trên trạng thái trí nhớ, dùng cho Trang chủ, Trí nhớ, Vườn.
 * Hàm thuần — mọi con số đều suy ra từ MemoryView do Memory Engine tính.
 */

/** Một kiến thức kèm trạng thái trí nhớ — đơn vị hiển thị chung của mọi danh sách. */
export interface KnowledgeWithMemory {
  item: KnowledgeItem;
  memory: MemoryView;
}

export function joinWithKnowledge(catalog: KnowledgeCatalog, views: readonly MemoryView[]): KnowledgeWithMemory[] {
  return views
    .map((memory) => ({ item: catalog.byKey.get(memory.contentKey), memory }))
    .filter((entry): entry is KnowledgeWithMemory => Boolean(entry.item));
}

export interface TypeMemorySummary {
  type: ContentType;
  label: string;
  learned: number;
  total: number;
  averageScore: number;
}

export interface MemoryOverview {
  health: number;
  learnedCount: number;
  notLearnedCount: number;
  counts: Record<MemoryStatus, number>;
  /** Số mục đang ở trạng thái Sắp quên + Chưa vững. */
  needsAttentionCount: number;
  byType: TypeMemorySummary[];
}

const TYPE_ORDER: readonly ContentType[] = ['hiragana', 'katakana', 'radical', 'kanji', 'vocabulary', 'grammar'];

export function buildMemoryOverview(views: ReadonlyMap<ContentKey, MemoryView>): MemoryOverview {
  const all = [...views.values()];
  const learned = all.filter((view) => view.isLearned);
  const counts = countByStatus(all);
  return {
    health: calculateMemoryHealth(all),
    learnedCount: learned.length,
    notLearnedCount: all.length - learned.length,
    counts,
    needsAttentionCount: counts.fading + counts.weak,
    byType: TYPE_ORDER.map((type) => {
      const ofType = all.filter((view) => view.contentType === type);
      const learnedOfType = ofType.filter((view) => view.isLearned);
      return {
        type,
        label: CONTENT_TYPE_LABELS[type],
        learned: learnedOfType.length,
        total: ofType.length,
        averageScore: calculateMemoryHealth(learnedOfType),
      };
    }),
  };
}

/** Câu Noko nói về sức khoẻ trí nhớ — giữ đúng ba mức của prototype. */
export function describeMemoryHealth(health: number): string {
  if (health >= 80) return 'Bạn đang nhớ tốt phần lớn những gì đã học.';
  if (health >= 65) return 'Phần lớn kiến thức vẫn đang nằm yên trong trí nhớ bạn.';
  return 'Một số thứ đang mờ đi — không sao, mình kéo lại từ từ.';
}

export function viewsWithStatus(views: ReadonlyMap<ContentKey, MemoryView>, status: MemoryStatus): MemoryView[] {
  return [...views.values()].filter((view) => view.isLearned && view.status === status);
}

export function forgettingRadarList(views: ReadonlyMap<ContentKey, MemoryView>, limit?: number): MemoryView[] {
  return getForgettingRadar([...views.values()], limit);
}

/** Dữ liệu thẻ "Gặp lại kiến thức" ở Trang chủ. */
export interface SurpriseCardData {
  contentKey: ContentKey;
  face: string;
  reading: string;
  meaning: string;
  /** Chữ Nhật để đọc thành tiếng — không phải romaji. */
  audioText: string;
  lastEncounterText: string;
}

export function buildSurpriseCard(
  catalog: KnowledgeCatalog,
  views: ReadonlyMap<ContentKey, MemoryView>,
  seed: string,
  excludedKeys: readonly ContentKey[] = [],
): SurpriseCardData | null {
  const picked = pickMemorySurprise([...views.values()], seed, excludedKeys);
  const item = picked ? catalog.byKey.get(picked.contentKey) : undefined;
  if (!picked || !item) return null;
  return {
    contentKey: item.key, face: item.face, reading: item.reading, meaning: item.meaning,
    audioText: speechTextFor(item), lastEncounterText: picked.lastEncounterText,
  };
}

/** Chọn một nhóm cây để trưng trong vườn — tất định theo seed để không nhảy lung tung mỗi lần tải. */
export function pickGardenPlants<T extends { status: MemoryStatus }>(
  entries: readonly T[],
  count: number,
  seed: string,
  options: { excludeWeak?: boolean } = {},
): T[] {
  const pool = options.excludeWeak ? entries.filter((entry) => entry.status !== 'weak') : entries;
  return pickDeterministic(pool, count, `garden:${seed}`);
}
