import type { MemoryView } from '@/features/memory/memory-types';
import { MIN_ENCOUNTERS_TO_COUNT_AS_MET } from '@/features/roadmap/journey-progress';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import type { ContentKey, KnowledgeItem } from './knowledge-types';
import { DAY_CHUNK_SIZE } from './session-modes';

/**
 * Hành động học ở các trang Học tập (Kanji, Từ vựng, Ngữ pháp, Bộ thủ, Hiragana, Katakana) — theo trạng thái THẬT:
 *  - Bắt đầu học / Học tiếp: chặng kế tiếp (5 thứ) chưa gặp, theo thứ tự lộ trình — không cần chờ tới ngày;
 *  - Ôn tập: thứ đã học đang yếu / sắp quên / đến hạn;
 *  - Kiểm tra: một nhóm thứ đã học.
 * Mỗi hành động mở phiên "Học theo lựa chọn" (/hoc/focus) — dùng Session Engine và ghi trí nhớ như phiên thường.
 */

const REVIEW_LIMIT = 10;
const TEST_LIMIT = 10;

export interface StudyActions {
  total: number;
  learned: number;
  /** Chặng kế tiếp chưa gặp. Rỗng = đã gặp hết. */
  next: ContentKey[];
  /** true khi người học chưa gặp thứ nào trong nhóm → "Bắt đầu học"; ngược lại "Học tiếp". */
  isFirstStart: boolean;
  review: ContentKey[];
  test: ContentKey[];
}

const byRoadmapOrder = (left: KnowledgeItem, right: KnowledgeItem) =>
  (left.day ?? Number.POSITIVE_INFINITY) - (right.day ?? Number.POSITIVE_INFINITY) || left.id - right.id;

/** Đã học nhưng đang yếu / sắp quên / đến hạn gặp lại. */
export function needsReview(view: MemoryView): boolean {
  return view.status === 'weak' || view.status === 'fading' || (view.daysUntilReview !== null && view.daysUntilReview <= 0);
}

export function buildStudyActions(items: readonly KnowledgeItem[], views: ReadonlyMap<ContentKey, MemoryView>, seed: string): StudyActions {
  const ordered = [...items].sort(byRoadmapOrder);
  const isMet = (item: KnowledgeItem) => (views.get(item.key)?.encounterCount ?? 0) >= MIN_ENCOUNTERS_TO_COUNT_AS_MET;
  const learnedViews = ordered.map((item) => views.get(item.key)).filter((view): view is MemoryView => Boolean(view?.isLearned));
  return {
    total: ordered.length,
    learned: learnedViews.length,
    next: ordered.filter((item) => !isMet(item)).slice(0, DAY_CHUNK_SIZE).map((item) => item.key),
    isFirstStart: !ordered.some(isMet),
    review: learnedViews.filter(needsReview).sort((left, right) => left.memoryScore - right.memoryScore)
      .slice(0, REVIEW_LIMIT).map((view) => view.contentKey),
    test: pickDeterministic(learnedViews, TEST_LIMIT, `test:${seed}`).map((view) => view.contentKey),
  };
}
