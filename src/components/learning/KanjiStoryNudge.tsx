'use client';

import { useKnowledgeDetail } from '@/features/learning/hooks/useKnowledgeDetail';
import { parseContentKey } from '@/features/learning/knowledge-types';
import { useSheetStore } from '@/stores/sheet-store';

/**
 * Gợi ý xem lại câu chuyện khi người học trả lời SAI một Kanji (hoặc bấm "Chưa nhớ").
 * Chỉ là gợi ý: không đổi điểm, không chặn "Tiếp tục". Kiến thức không phải Kanji / Kanji chưa có chuyện → không hiện gì.
 * Dữ liệu lấy từ chi tiết kiến thức (đã được tải sẵn cho thẻ đang hiện) — không có bản sao chuyện thứ hai.
 */
export function KanjiStoryNudge({ contentKey }: { contentKey: string }) {
  const isKanji = parseContentKey(contentKey)?.type === 'kanji';
  const { data } = useKnowledgeDetail(isKanji ? contentKey : null);
  const openKnowledge = useSheetStore((store) => store.openKnowledge);
  const story = data?.story;
  if (!isKanji || !story?.memoryTip) return null;
  return (
    <div className="kanji-story-nudge fade-in" role="note">
      <p className="sm"><b>💡 Nhớ lại câu chốt:</b> {story.memoryTip}</p>
      <button type="button" className="btn ghost sm mt-2" onClick={() => openKnowledge(contentKey)}>Xem lại Kanji &amp; câu chuyện</button>
    </div>
  );
}
