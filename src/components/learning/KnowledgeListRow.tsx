import type { KnowledgeListRowData } from '@/features/learning/knowledge-list';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { EmojiIcon } from '@/components/common/EmojiIcon';

export type { KnowledgeListRowData };


export function KnowledgeListRow({ row }: { row: KnowledgeListRowData }) {
  const presentation = STATUS_PRESENTATION[row.status];
  return (
    <KnowledgeChipButton contentKey={row.contentKey} className="list-row" label={`${row.face} — ${row.title}`}>
      {row.hideFace ? null : <span className="big jp" style={row.faceSize ? { fontSize: row.faceSize } : undefined}>{row.face}</span>}
      <span className="mid">
        <b className={row.hideFace ? 'jp' : undefined} style={row.hideFace ? { fontSize: 15 } : undefined}>{row.title}</b>
        <span className={row.hideFace ? undefined : 'jp'}>{row.subtitle}</span>
      </span>
      <span className="end">
        <span className="tiny" style={{ color: presentation.color }} title={presentation.label}>
          <EmojiIcon emoji={presentation.emoji} size={16} style={{ verticalAlign: '-3px' }} />{row.showStatusLabel ? ` ${presentation.label}` : ''}
        </span>
        {row.endNote ? <span className="tiny muted">{row.endNote}</span> : null}
        {!row.endNote && !row.showStatusLabel ? (
          <span className="mini-bar"><i style={{ width: `${row.memoryScore}%`, background: presentation.color }} /></span>
        ) : null}
      </span>
    </KnowledgeChipButton>
  );
}
