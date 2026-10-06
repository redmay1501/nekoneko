import { pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import type { KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import {
  type ContextSentence,
  type RescueHint,
  buildContextSentence,
  buildRescueHint,
} from '@/features/learning/knowledge-presenter';
import type { ContentKey, KnowledgeItem } from '@/features/learning/knowledge-types';
import { getForgettingRadar } from './memory-engine';
import type { MemoryView } from './memory-types';

/**
 * Dữ liệu cho luồng "Cứu một kiến thức" (SC-30):
 *   Sắp quên → Gợi ý → Nhớ lại → Ngữ cảnh → Đã cứu.
 * Câu hỏi "nó nghĩa là gì" chỉ để người học tự kiểm tra; điểm trí nhớ được Memory Engine
 * ở server cập nhật một lần khi cứu xong (luôn tính như nhớ đúng — sheet 5).
 */
export interface RescueView {
  contentKey: ContentKey;
  face: string;
  reading: string;
  meaning: string;
  reason: string;
  lastEncounterText: string;
  encounterCount: number;
  scoreBefore: number;
  hint: RescueHint;
  meaningOptions: string[];
  context: ContextSentence;
  nextAtRisk: { contentKey: ContentKey; face: string } | null;
}

const MEANING_DISTRACTORS = 3;

export function buildRescueView(
  item: KnowledgeItem,
  memory: MemoryView,
  catalog: KnowledgeCatalog,
  views: ReadonlyMap<ContentKey, MemoryView>,
  journeyDay: number,
): RescueView {
  // Phương án nhiễu chỉ từ thứ đã học (chưa đủ 2 thì mới mượn thứ cùng loại) — không đoán được bằng cách loại chữ lạ.
  const sameType = catalog.items.filter((other) => other.type === item.type && other.key !== item.key && other.meaning !== item.meaning);
  const learnedSameType = sameType.filter((other) => views.get(other.key)?.isLearned);
  const sameTypeMeanings = (learnedSameType.length >= 2 ? learnedSameType : sameType).map((other) => other.meaning);
  const nextView = getForgettingRadar([...views.values()]).find((view) => view.contentKey !== item.key);
  const nextItem = nextView ? catalog.byKey.get(nextView.contentKey) : undefined;

  return {
    contentKey: item.key,
    face: item.face,
    reading: item.reading,
    meaning: item.meaning,
    reason: memory.reason,
    lastEncounterText: memory.lastEncounterText,
    encounterCount: memory.encounterCount,
    scoreBefore: memory.memoryScore,
    hint: buildRescueHint(item, catalog),
    meaningOptions: shuffleDeterministic(
      [item.meaning, ...pickDeterministic([...new Set(sameTypeMeanings)], MEANING_DISTRACTORS, `rescue-options:${item.key}`)],
      `rescue-order:${item.key}`,
    ),
    context: buildContextSentence(item, catalog, journeyDay),
    nextAtRisk: nextItem ? { contentKey: nextItem.key, face: nextItem.face } : null,
  };
}
