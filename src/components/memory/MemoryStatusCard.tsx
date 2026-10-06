import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import type { MemoryView } from '@/features/memory/memory-types';
import { EmojiIcon } from '@/components/common/EmojiIcon';

interface MemoryStatusCardProps {
  memory: MemoryView;
}

/** Trạng thái trí nhớ của một kiến thức — điểm, số lần gặp, lần cuối và LÝ DO. */
export function MemoryStatusCard({ memory }: MemoryStatusCardProps) {
  const presentation = STATUS_PRESENTATION[memory.status];
  if (!memory.isLearned) {
    return null;
  }
  return (
    <div className="card tight" style={{ background: presentation.background, borderColor: 'transparent' }}>
      <div className="between">
        <b className="sm"><EmojiIcon emoji={presentation.emoji} size={16} style={{ verticalAlign: '-3px' }} /> {presentation.label}</b>
        <b className="sm" style={{ color: presentation.color }}>{memory.memoryScore}/100</b>
      </div>
      <div className="bar thin" style={{ margin: '9px 0', background: 'rgba(255,255,255,.75)' }} role="progressbar"
        aria-label="Sức nhớ" aria-valuenow={memory.memoryScore} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${memory.memoryScore}%`, background: presentation.color }} />
      </div>
      <div className="between tiny" style={{ color: 'var(--ink-2)' }}>
        <span>Đã gặp {memory.encounterCount} lần</span>
        <span>Lần cuối: {memory.lastEncounterText}</span>
      </div>
      <p className="tiny mt-2" style={{ color: presentation.color }}>{memory.reason}</p>
    </div>
  );
}
