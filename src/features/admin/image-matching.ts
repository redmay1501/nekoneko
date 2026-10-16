import { foldSearch } from './content-entities';

/**
 * Gợi ý ghép ảnh với nội dung theo TÊN FILE — chỉ gợi ý, người dùng xác nhận. Không bao giờ ghép theo thứ tự file.
 *  1. Tên là mã: "123", "#123", "id-123", "tu-vung-123", "vocab_123" → mục có id đó (nếu có).
 *  2. Tên trùng đúng chữ Kanji / kana / nghĩa của DUY NHẤT một mục → ghép.
 *  3. Trùng nhiều mục (đồng âm, cùng nghĩa) → "nhiều khả năng", để người dùng chọn.
 */
export interface MatchCandidate {
  id: number;
  /** Các cách gọi mục: chữ, cách đọc, nghĩa… */
  keys: string[];
}

export type MatchSuggestion =
  | { kind: 'id'; id: number }
  | { kind: 'exact'; id: number; key: string }
  | { kind: 'ambiguous'; ids: number[] }
  | { kind: 'none' };

export function normalizeFileStem(fileName: string): string {
  const stem = fileName.replace(/\.[a-z0-9]{2,5}$/i, '');
  return foldSearch(stem.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' '));
}

const ID_PATTERN = /^(?:#|id|tu vung|vocab(?:ulary)?|kanji|bo thu|radical|ngu phap|grammar)?\s*#?(\d{1,6})$/;

export function suggestMatch(fileName: string, candidates: readonly MatchCandidate[]): MatchSuggestion {
  const stem = normalizeFileStem(fileName);
  if (!stem) return { kind: 'none' };
  const idMatch = ID_PATTERN.exec(stem);
  if (idMatch) {
    const id = Number(idMatch[1]);
    if (candidates.some((candidate) => candidate.id === id)) return { kind: 'id', id };
  }
  const hits = candidates.filter((candidate) => candidate.keys.some((key) => key && foldSearch(key) === stem));
  if (hits.length === 1) return { kind: 'exact', id: hits[0].id, key: stem };
  if (hits.length > 1) return { kind: 'ambiguous', ids: hits.map((hit) => hit.id) };
  return { kind: 'none' };
}

/** Mục được nhiều file cùng nhắm tới → báo trùng, chưa cho xác nhận tới khi sửa. */
export function duplicateTargets(assignments: ReadonlyArray<{ key: string; targets: readonly number[] }>): Map<number, string[]> {
  const byTarget = new Map<number, string[]>();
  for (const assignment of assignments) {
    for (const target of new Set(assignment.targets)) byTarget.set(target, [...(byTarget.get(target) ?? []), assignment.key]);
  }
  return new Map([...byTarget].filter(([, keys]) => keys.length > 1));
}
