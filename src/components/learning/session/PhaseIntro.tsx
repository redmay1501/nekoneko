import { EmojiIcon } from '@/components/common/EmojiIcon';
import { type PublicSessionStep, SESSION_PHASE_INFO, type SessionPhase, phaseOfStep } from '@/features/learning/session-types';

interface PhaseIntroProps {
  steps: PublicSessionStep[];
  /** Bước đầu tiên của chặng sắp bắt đầu. */
  nextStepIndex: number;
  previousPhase: SessionPhase;
  onStart: () => void;
}

/** Màn chuyển chặng ngắn: khen chặng vừa xong + nói chặng tới là gì, bao nhiêu thứ — rồi một nút đi tiếp. */
export function PhaseIntro({ steps, nextStepIndex, previousPhase, onStart }: PhaseIntroProps) {
  const nextPhase = phaseOfStep(steps[nextStepIndex]);
  const next = SESSION_PHASE_INFO[nextPhase];
  // Đếm KIẾN THỨC (không đếm bước): giới thiệu + luyện ngay cùng một chữ chỉ tính một.
  const knowledgeCount = new Set(steps.filter((step) => phaseOfStep(step) === nextPhase).map((step) => step.contentKey)).size;
  return (
    <div className="s-card pop center phase-intro" aria-live="polite">
      <EmojiIcon emoji={next.emoji} size={64} className="mx-auto" />
      <p className="sm soft mt-2">Xong phần {SESSION_PHASE_INFO[previousPhase].label.toLowerCase()} rồi 🌸</p>
      <h2 className="mt-1">{next.label} · {knowledgeCount} {nextPhase === 'use' ? 'câu' : 'kiến thức'}</h2>
      <p className="soft mt-2">{next.intro}</p>
      <button type="button" className="btn block mt-4" onClick={onStart} autoFocus>Bắt đầu</button>
    </div>
  );
}
