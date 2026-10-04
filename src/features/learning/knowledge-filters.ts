import type { MemoryStatus } from '@/features/memory/memory-types';
import { extractLessonNumber } from '@/lib/utils/text';

/** Bộ lọc theo trạng thái trí nhớ ở các kho Kanji… (prototype filterTabs). */
export const MEMORY_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'learning', label: 'Đang học' },
  { id: 'strong', label: 'Đã nắm' },
  { id: 'weak', label: 'Cần ôn' },
  { id: 'new', label: 'Chưa học' },
] as const;

export type MemoryFilterId = (typeof MEMORY_FILTERS)[number]['id'];

export function matchesMemoryFilter(status: MemoryStatus, filter: MemoryFilterId): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'strong':
      return status === 'strong' || status === 'mastered';
    case 'weak':
      return status === 'fading' || status === 'weak';
    case 'learning':
      return status === 'learning';
    case 'new':
      return status === 'new';
  }
}

export function sameLesson(left: string, right: string): boolean {
  const leftNumber = extractLessonNumber(left);
  return leftNumber !== null && leftNumber === extractLessonNumber(right);
}

/** Ba nhóm chữ trong bảng 104 kana (theo thứ tự file lộ trình). */
export const KANA_GROUPS = [
  { from: 0, to: 46, label: 'Âm cơ bản' },
  { from: 46, to: 71, label: 'Âm đục & bán đục' },
  { from: 71, to: 104, label: 'Âm ghép' },
] as const;
export const BASIC_KANA_COUNT = 46;
