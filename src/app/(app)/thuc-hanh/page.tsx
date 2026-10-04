import { LearningSession } from '@/components/learning/LearningSession';
import { SESSION_MODES } from '@/features/learning/session-modes';

/** SC-07 · Thực hành trong ngữ cảnh — cùng Session Engine, chỉ khác chế độ. */
export default function Page() {
  return <LearningSession mode={SESSION_MODES.USE} />;
}
