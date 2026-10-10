import type { MemoryStatus, MemoryView } from '@/features/memory/memory-types';
import type { ContentKey, ContentType, KnowledgeItem } from './knowledge-types';

/**
 * Một dòng kiến thức gọn nhẹ để gửi xuống Client Component (danh sách, vườn, ra-đa).
 * Chỉ chứa những gì cần hiển thị — không gửi cả danh mục 800 mục xuống trình duyệt.
 */
export interface KnowledgeListEntry {
  contentKey: ContentKey;
  type: ContentType;
  face: string;
  reading: string;
  meaning: string;
  day: number | null;
  status: MemoryStatus;
  memoryScore: number;
  reason: string;
  lastEncounterText: string;
}

export function toKnowledgeListEntry(item: KnowledgeItem, memory: MemoryView | undefined): KnowledgeListEntry {
  return {
    contentKey: item.key,
    type: item.type,
    face: item.face,
    reading: item.reading,
    meaning: item.meaning,
    day: item.day,
    status: memory?.status ?? 'new',
    memoryScore: memory?.memoryScore ?? 0,
    reason: memory?.reason ?? '',
    lastEncounterText: memory?.lastEncounterText ?? '—',
  };
}

export function toKnowledgeListEntries(
  items: readonly KnowledgeItem[],
  views: ReadonlyMap<ContentKey, MemoryView>,
): KnowledgeListEntry[] {
  return items.map((item) => toKnowledgeListEntry(item, views.get(item.key)));
}

/** Một hàng trong các kho kiến thức — tiêu đề/phụ đề đã định dạng theo từng loại. */
export interface KnowledgeListRowData {
  contentKey: string;
  face: string;
  title: string;
  subtitle: string;
  status: MemoryStatus;
  memoryScore: number;
  /** Ghi chú thay cho thanh sức nhớ (ví dụ "4 kanji" ở danh sách bộ thủ). */
  endNote?: string;
  showStatusLabel?: boolean;
  faceSize?: number;
  /** Ngữ pháp không có mặt chữ lớn — tiêu đề là mẫu câu. */
  hideFace?: boolean;
  /** Cách đọc bằng chữ Latinh (Hepburn) cho người mới — dòng nhỏ dưới cách đọc kana. */
  romaji?: string;
}
