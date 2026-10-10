import type { KnowledgeListRowData } from '@/features/learning/knowledge-list';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { EmojiIcon } from '@/components/common/EmojiIcon';

export type { KnowledgeListRowData };


export interface RowSelection {
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

/** Một dòng kiến thức. Có `selection` → dòng thành nút chọn (chế độ "Chọn để học"), không mở chi tiết. */
export function KnowledgeListRow({ row, selection }: { row: KnowledgeListRowData; selection?: RowSelection }) {
  const presentation = STATUS_PRESENTATION[row.status];
  const body = <RowBody row={row} presentation={presentation} />;
  if (selection) {
    return (
      <button type="button" className={`list-row selectable ${selection.isSelected ? 'on' : ''}`} aria-pressed={selection.isSelected}
        disabled={selection.isDisabled} onClick={selection.onToggle} aria-label={`Chọn ${row.face} — ${row.title}`}>
        <span className="select-tick" aria-hidden="true">{selection.isSelected ? '✓' : ''}</span>
        {body}
      </button>
    );
  }
  return (
    <KnowledgeChipButton contentKey={row.contentKey} className="list-row" label={`${row.face} — ${row.title}`}>
      {body}
    </KnowledgeChipButton>
  );
}

function RowBody({ row, presentation }: { row: KnowledgeListRowData; presentation: (typeof STATUS_PRESENTATION)[keyof typeof STATUS_PRESENTATION] }) {
  return (
    <>
      {row.hideFace ? null : <span className="big jp" style={row.faceSize ? { fontSize: row.faceSize } : undefined}>{row.face}</span>}
      <span className="mid">
        <b className={row.hideFace ? 'jp' : undefined} style={row.hideFace ? { fontSize: 15 } : undefined}>{row.title}</b>
        {/* Romaji ngay dưới phần tiếng Nhật: dưới mẫu câu (ngữ pháp), dưới cách đọc kana (Kanji, từ vựng). */}
        {row.hideFace && row.romaji ? <span className="romaji">{row.romaji}</span> : null}
        <span className={row.hideFace ? undefined : 'jp'}>{row.subtitle}</span>
        {!row.hideFace && row.romaji ? <span className="romaji">{row.romaji}</span> : null}
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
    </>
  );
}
