import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import type { KnowledgeListEntry } from '@/features/learning/knowledge-list';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const PLOT_FACE_MAX_CHARS = 3;

/** Mỗi kiến thức đã ở lại là một cái cây. Chạm vào cây để xem nó đã ở lại thế nào. */
export function GardenPlots({ entries }: { entries: KnowledgeListEntry[] }) {
  return (
    <div className="plots">
      {entries.map((entry) => (
        <KnowledgeChipButton key={entry.contentKey} contentKey={entry.contentKey} className="plot"
          label={`${entry.face} — ${entry.meaning} — ${STATUS_PRESENTATION[entry.status].label}`}>
          <span className="e"><EmojiIcon emoji={STATUS_PRESENTATION[entry.status].plant} size={30} /></span>
          {/* Chữ dài: rút gọn bằng "…" (không cắt giữa từ trông như lỗi); tên đầy đủ ở tooltip / nhãn đọc màn hình. */}
          <span className="w jp" title={entry.face}>{[...entry.face].length > PLOT_FACE_MAX_CHARS ? `${[...entry.face].slice(0, PLOT_FACE_MAX_CHARS - 1).join('')}…` : entry.face}</span>
        </KnowledgeChipButton>
      ))}
    </div>
  );
}
