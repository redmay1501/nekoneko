import { LearningSession } from '@/components/learning/LearningSession';
import { SESSION_MODES } from '@/features/learning/session-modes';

/** SC-05 · Gặp lại kiến thức — cùng Session Engine, chỉ khác chế độ. */
export default function Page() {
  return <LearningSession mode={SESSION_MODES.RECALL} />;
}
