import type { KnowledgeListEntry } from '@/features/learning/knowledge-list';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** Một hàng kiến thức: mặt chữ · nghĩa · cách đọc · trạng thái trí nhớ (prototype rowItem). */
export function KnowledgeRow({ entry }: { entry: KnowledgeListEntry }) {
  const presentation = STATUS_PRESENTATION[entry.status];
  return (
    <KnowledgeChipButton contentKey={entry.contentKey} className="list-row" label={`${entry.face} — ${entry.meaning}`}>
      <span className="big jp">{entry.face}</span>
      <span className="mid">
        <b>{entry.meaning}</b>
        <span className="jp">{entry.reading}</span>
      </span>
      <span className="end">
        <span className="tiny" style={{ color: presentation.color }}><EmojiIcon emoji={presentation.emoji} size={14} style={{ verticalAlign: '-2px' }} /> {presentation.label}</span>
        <span className="mini-bar"><i style={{ width: `${entry.memoryScore}%`, background: presentation.color }} /></span>
      </span>
    </KnowledgeChipButton>
  );
}
