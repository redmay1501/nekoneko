import type { MemoryView } from '@/features/memory/memory-types';
import { MIN_ENCOUNTERS_TO_COUNT_AS_MET } from '@/features/roadmap/journey-progress';
import { lessonNumber } from '@/lib/utils/lesson';
import { KANA_GROUPS } from './knowledge-filters';
import type { ContentKey, ContentType, KnowledgeItem } from './knowledge-types';
import { firstMeaning } from '@/lib/utils/text';

/**
 * "Kiểm tra" ở các trang Học tập (Kanji, Từ vựng, Ngữ pháp, Bộ thủ, Hiragana, Katakana): MỘT nút → bảng chọn,
 * người học chọn tất cả, cả nhóm hoặc từng chữ rồi bắt đầu. Lộ trình mới dẫn học theo thứ tự; ở đây tự chọn.
 * Bài kiểm tra là phiên "Học theo lựa chọn": thứ đã học → hỏi lại (ghi trí nhớ thật); thứ chưa học → giới thiệu rồi hỏi.
 * Nhóm: theo nhóm chữ (kana), theo nhóm 10 (Kanji, bộ thủ), theo bài (từ vựng), theo 5 bài (ngữ pháp).
 */

const GROUP_SIZE = 10;
const GRAMMAR_LESSONS_PER_PART = 5;

export interface TestEntry {
  key: ContentKey;
  face: string;
  /** Dòng nhỏ dưới mặt chữ: nghĩa ngắn / romaji. */
  caption: string;
  isLearned: boolean;
}

export interface TestGroup {
  id: string;
  label: string;
  entries: TestEntry[];
}

/** Đã học nhưng đang yếu / sắp quên / đến hạn gặp lại. */
export function needsReview(view: MemoryView): boolean {
  return view.status === 'weak' || view.status === 'fading' || (view.daysUntilReview !== null && view.daysUntilReview <= 0);
}

const byRoadmapOrder = (left: KnowledgeItem, right: KnowledgeItem) =>
  (left.day ?? Number.POSITIVE_INFINITY) - (right.day ?? Number.POSITIVE_INFINITY) || left.id - right.id;

interface Group { id: string; label: string; items: KnowledgeItem[] }

function chunked(items: KnowledgeItem[], size: number): Group[] {
  const groups: Group[] = [];
  for (let start = 0; start < items.length; start += size) {
    const chunk = items.slice(start, start + size);
    groups.push({ id: `nhom-${groups.length + 1}`, label: `Nhóm ${groups.length + 1}`, items: chunk });
  }
  return groups;
}

function byLabel(items: KnowledgeItem[], labelOf: (item: KnowledgeItem) => string): Group[] {
  const groups = new Map<string, KnowledgeItem[]>();
  for (const item of items) groups.set(labelOf(item), [...(groups.get(labelOf(item)) ?? []), item]);
  return [...groups.entries()].map(([label, groupItems], index) => ({ id: `phan-${index + 1}`, label, items: groupItems }));
}

/** Các nhóm của một loại kiến thức (thứ tự: kana theo bảng, còn lại theo lộ trình / số bài). */
export function knowledgeGroups(type: ContentType, items: readonly KnowledgeItem[]): Group[] {
  const ordered = [...items].sort(type === 'hiragana' || type === 'katakana' ? (left, right) => left.id - right.id : byRoadmapOrder);
  switch (type) {
    case 'hiragana':
    case 'katakana':
      return KANA_GROUPS.map((group, index) => ({ id: `nhom-${index + 1}`, label: group.label, items: ordered.slice(group.from, group.to) }))
        .filter((group) => group.items.length);
    case 'kanji':
    case 'radical':
      return chunked(ordered, GROUP_SIZE);
    case 'vocabulary':
      // Theo bài 1 → 25 (từ của giai đoạn chữ cái đứng đầu) — không theo ngày học, kẻo "Bài 2" đứng trước "Bài 1".
      return byLabel(ordered, (item) => (item.type === 'vocabulary' && Number.isFinite(lessonNumber(item.content.lesson))
        ? `Bài ${lessonNumber(item.content.lesson)}` : 'Chào hỏi & Katakana'))
        .sort((left, right) => (Number.isFinite(lessonNumber(left.label)) ? lessonNumber(left.label) : 0)
          - (Number.isFinite(lessonNumber(right.label)) ? lessonNumber(right.label) : 0));
    case 'grammar':
      return byLabel(ordered, (item) => {
        const lesson = item.type === 'grammar' ? lessonNumber(item.content.lesson) : 0;
        const first = Math.floor((lesson - 1) / GRAMMAR_LESSONS_PER_PART) * GRAMMAR_LESSONS_PER_PART + 1;
        return `Bài ${first}–${first + GRAMMAR_LESSONS_PER_PART - 1}`;
      });
  }
}

function captionOf(item: KnowledgeItem): string {
  switch (item.type) {
    case 'hiragana':
    case 'katakana':
      return item.reading;
    case 'kanji':
      return item.content.hanViet;
    default:
      return firstMeaning(item.meaning);
  }
}

export function buildTestGroups(type: ContentType, items: readonly KnowledgeItem[], views: ReadonlyMap<ContentKey, MemoryView>): TestGroup[] {
  return knowledgeGroups(type, items).map((group) => ({
    id: group.id,
    label: group.label,
    entries: group.items.map((item) => ({
      key: item.key, face: item.face, caption: captionOf(item),
      isLearned: (views.get(item.key)?.encounterCount ?? 0) >= MIN_ENCOUNTERS_TO_COUNT_AS_MET,
    })),
  }));
}
