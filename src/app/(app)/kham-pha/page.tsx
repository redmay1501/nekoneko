import { LearningSession } from '@/components/learning/LearningSession';
import { SESSION_MODES } from '@/features/learning/session-modes';

/** SC-06 · Khám phá kiến thức mới — cùng Session Engine, chỉ khác chế độ. */
export default function Page() {
  return <LearningSession mode={SESSION_MODES.DISCOVER} />;
}
