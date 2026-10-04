import { NokoMessage } from '@/components/common/NokoMessage';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import type { PublicSessionStep } from '@/features/learning/session-types';

interface SessionCheckpointProps {
  steps: PublicSessionStep[];
  nextStepIndex: number;
  chunkSize: number;
  isBusy: boolean;
  onContinue: () => void;
  onStop: () => void;
}

/**
 * Điểm dừng giữa hai chặng — người học tự quyết: học tiếp, hay nghỉ ở đây.
 * Nghỉ không mất gì: lần sau phiên học bắt đầu đúng ở chặng kế tiếp.
 */
export function SessionCheckpoint({ steps, nextStepIndex, chunkSize, isBusy, onContinue, onStop }: SessionCheckpointProps) {
  const discoverTotal = steps.filter((step) => step.type === 'discover').length;
  const totalChunks = Math.ceil(discoverTotal / chunkSize);
  const discoveredSoFar = steps.slice(0, nextStepIndex).filter((step) => step.type === 'discover').length;
  const finishedChunks = Math.ceil(discoveredSoFar / chunkSize);
  const remainingNew = steps.slice(nextStepIndex).filter((step) => step.type === 'discover').length;

  return (
    <div className="s-card pop center" aria-live="polite">
      <SpriteIcon name="noko" size={84} className="mx-auto" />
      <h2 className="mt-2">Xong chặng {finishedChunks}/{totalChunks} 🌸</h2>
      <p className="sm soft mt-1.5">Bạn vừa học {discoveredSoFar} kiến thức mới. Còn {remainingNew} thứ nữa là xong ngày.</p>
      <button type="button" className="btn block mt-4" onClick={onContinue} disabled={isBusy}>
        Học tiếp chặng {finishedChunks + 1} · {Math.min(chunkSize, remainingNew)} kiến thức
      </button>
      <button type="button" className="btn quiet block mt-2" onClick={onStop} disabled={isBusy} aria-busy={isBusy}>Dừng ở đây</button>
      <NokoMessage state="rest" text="Nghỉ ở đây cũng được. Lần sau mình học tiếp từ đúng chỗ này, không mất gì đâu." className="mt-3" />
    </div>
  );
}
