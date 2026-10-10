import type { MemoryView } from '@/features/memory/memory-types';
import { MIN_ENCOUNTERS_TO_COUNT_AS_MET } from '@/features/roadmap/journey-progress';
import { lessonNumber } from '@/lib/utils/lesson';
import { KANA_GROUPS } from './knowledge-filters';
import type { ContentKey, ContentType, KnowledgeItem } from './knowledge-types';
import { MAX_FOCUS_ITEMS } from './session-modes';

/**
 * Học tập (Kanji, Từ vựng, Ngữ pháp, Bộ thủ, Hiragana, Katakana) — KHÁC lộ trình: người học tự chọn phạm vi.
 * Lộ trình mới dẫn đi theo thứ tự; ở đây người đã học xong muốn ôn lại, hoặc muốn học trước, đều chọn được:
 *  - Tất cả: lần lượt từng lượt ALL_BATCH mục — mục lâu chưa gặp nhất trước, rồi tới mục chưa học;
 *  - Cần ôn: mục đang yếu / sắp quên / đến hạn;
 *  - Từng phần: theo bài (từ vựng, ngữ pháp), theo nhóm chữ (kana), theo nhóm 10 (Kanji, bộ thủ).
 * Mỗi phần mở phiên "Học theo lựa chọn": thứ đã học → hỏi lại; thứ chưa học → giới thiệu rồi luyện (ghi trí nhớ thật).
 */

const ALL_BATCH = 30;
const GROUP_SIZE = 10;
const GRAMMAR_LESSONS_PER_PART = 5;

export interface StudyPart {
  id: string;
  label: string;
  /** Câu giải thích ngắn hiện khi chọn phần này. */
  hint?: string;
  keys: ContentKey[];
  newCount: number;
  learnedCount: number;
}

export interface StudyParts {
  total: number;
  learned: number;
  parts: StudyPart[];
}

/** Đã học nhưng đang yếu / sắp quên / đến hạn gặp lại. */
export function needsReview(view: MemoryView): boolean {
  return view.status === 'weak' || view.status === 'fading' || (view.daysUntilReview !== null && view.daysUntilReview <= 0);
}

const byRoadmapOrder = (left: KnowledgeItem, right: KnowledgeItem) =>
  (left.day ?? Number.POSITIVE_INFINITY) - (right.day ?? Number.POSITIVE_INFINITY) || left.id - right.id;

interface Group { id: string; label: string; items: KnowledgeItem[] }

function chunked(items: KnowledgeItem[], size: number, labelOf: (chunk: KnowledgeItem[], index: number) => string): Group[] {
  const groups: Group[] = [];
  for (let start = 0; start < items.length; start += size) {
    const chunk = items.slice(start, start + size);
    groups.push({ id: `nhom-${groups.length + 1}`, label: labelOf(chunk, groups.length), items: chunk });
  }
  return groups;
}

function byLabel(items: KnowledgeItem[], labelOf: (item: KnowledgeItem) => string): Group[] {
  const groups = new Map<string, KnowledgeItem[]>();
  for (const item of items) groups.set(labelOf(item), [...(groups.get(labelOf(item)) ?? []), item]);
  return [...groups.entries()].map(([label, groupItems], index) => ({ id: `phan-${index + 1}`, label, items: groupItems }));
}

const faces = (chunk: KnowledgeItem[]) => chunk.slice(0, 4).map((item) => item.face).join(' ');

/** Các phần của một loại kiến thức. */
function groupsOf(type: ContentType, items: KnowledgeItem[]): Group[] {
  switch (type) {
    case 'hiragana':
    case 'katakana':
      return KANA_GROUPS.map((group, index) => ({ id: `nhom-${index + 1}`, label: group.label, items: items.slice(group.from, group.to) }));
    case 'kanji':
    case 'radical':
      return chunked(items, GROUP_SIZE, (chunk) => faces(chunk) + (chunk.length > 4 ? ' …' : ''));
    case 'vocabulary':
      // Theo bài 1 → 25 (từ của giai đoạn chữ cái đứng đầu) — không theo ngày học, kẻo "Bài 2" đứng trước "Bài 1".
      return byLabel(items, (item) => (item.type === 'vocabulary' && Number.isFinite(lessonNumber(item.content.lesson))
        ? `Bài ${lessonNumber(item.content.lesson)}` : 'Chào hỏi & Katakana'))
        .sort((left, right) => (Number.isFinite(lessonNumber(left.label)) ? lessonNumber(left.label) : 0)
          - (Number.isFinite(lessonNumber(right.label)) ? lessonNumber(right.label) : 0));
    case 'grammar':
      return byLabel(items, (item) => {
        const lesson = item.type === 'grammar' ? lessonNumber(item.content.lesson) : 0;
        const first = Math.floor((lesson - 1) / GRAMMAR_LESSONS_PER_PART) * GRAMMAR_LESSONS_PER_PART + 1;
        return `Bài ${first}–${first + GRAMMAR_LESSONS_PER_PART - 1}`;
      });
  }
}

export function buildStudyParts(type: ContentType, items: readonly KnowledgeItem[], views: ReadonlyMap<ContentKey, MemoryView>): StudyParts {
  const ordered = [...items].sort(type === 'hiragana' || type === 'katakana' ? (left, right) => left.id - right.id : byRoadmapOrder);
  const viewOf = (item: KnowledgeItem) => views.get(item.key);
  const isMet = (item: KnowledgeItem) => (viewOf(item)?.encounterCount ?? 0) >= MIN_ENCOUNTERS_TO_COUNT_AS_MET;
  const part = (id: string, label: string, partItems: KnowledgeItem[], hint?: string): StudyPart => {
    const capped = partItems.slice(0, MAX_FOCUS_ITEMS);
    return {
      id, label, hint, keys: capped.map((item) => item.key),
      newCount: capped.filter((item) => !isMet(item)).length,
      learnedCount: capped.filter(isMet).length,
    };
  };

  // Tất cả: mục đã gặp lâu nhất trước (ôn lại cả kho), rồi mục chưa học theo thứ tự — mỗi lượt một phần, lượt sau đi tiếp.
  const met = ordered.filter(isMet).sort((left, right) => (viewOf(right)?.daysSinceSeen ?? 0) - (viewOf(left)?.daysSinceSeen ?? 0));
  const all = [...met, ...ordered.filter((item) => !isMet(item))];
  const review = ordered.filter((item) => viewOf(item)?.isLearned && needsReview(viewOf(item)!))
    .sort((left, right) => (viewOf(left)?.memoryScore ?? 0) - (viewOf(right)?.memoryScore ?? 0));

  const parts = [
    part('tat-ca', 'Tất cả', all.slice(0, Math.min(ALL_BATCH, MAX_FOCUS_ITEMS)),
      ordered.length > ALL_BATCH ? `Mỗi lượt ${ALL_BATCH} mục — mục lâu chưa gặp trước. Học xong lượt này, bấm lại để sang lượt tiếp.` : undefined),
    ...(review.length ? [part('can-on', `Cần ôn (${review.length})`, review, 'Những mục đang yếu hoặc sắp quên.')] : []),
    ...groupsOf(type, ordered).filter((group) => group.items.length).map((group) => part(group.id, group.label, group.items)),
  ];
  return { total: ordered.length, learned: ordered.filter((item) => viewOf(item)?.isLearned).length, parts };
}
