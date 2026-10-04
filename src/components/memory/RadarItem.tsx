import Link from 'next/link';
import type { KnowledgeListEntry } from '@/features/learning/knowledge-list';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';

/** Một dòng trong ra-đa "Kiến thức sắp quên" — chạm để vào luồng cứu. */
export function RadarItem({ entry }: { entry: KnowledgeListEntry }) {
  const presentation = STATUS_PRESENTATION[entry.status];
  return (
    <Link href={`/tri-nho/cuu/${entry.contentKey}`} className="radar-i">
      <span className="f">{entry.face}</span>
      <span className="b">
        <b>{entry.meaning}</b>
        <span className="jp tiny muted">{entry.reading}</span>{' '}
        <span className="why">{entry.reason} · học {entry.lastEncounterText}</span>
      </span>
      <span className="health" style={{ background: presentation.background, color: presentation.color }}
        aria-label={`Sức nhớ ${entry.memoryScore}`}>
        {entry.memoryScore}
      </span>
    </Link>
  );
}

export function RadarList({ entries, emptyText }: { entries: KnowledgeListEntry[]; emptyText: string }) {
  if (!entries.length) return <p className="soft sm">{emptyText}</p>;
  return (
    <div className="radar">
      {entries.map((entry) => <RadarItem key={entry.contentKey} entry={entry} />)}
    </div>
  );
}
