'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NokoMessage } from '@/components/common/NokoMessage';
import { SessionCardSkeleton } from '@/components/common/PageSkeletons';
import { SkeletonScreen } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/StateViews';
import { useLearningSession } from '@/features/learning/hooks/useLearningSession';
import { SESSION_MODES, type SessionMode } from '@/features/learning/session-modes';
import { SessionCheckpoint } from './session/SessionCheckpoint';
import { SessionHeader, SessionProgress } from './session/SessionHeader';
import { DiscoverStepView, RecallStepView, SurpriseStepView, UseStepView } from './session/SessionSteps';

/**
 * SC-33 · Phiên học — MỘT component cho mọi chế độ (Học hôm nay, Học nhanh 5 phút, …).
 * Thứ tự: Gặp lại → Khám phá → Dùng trong câu → Khoảnh khắc tiến bộ.
 */
export function LearningSession({ mode }: { mode: SessionMode }) {
  const learning = useLearningSession(mode);
  const { sessionQuery, session, currentStep, stepIndex } = learning;

  // Enter advances after an answer. Ignore text-entry contexts and key repeats.
  useEffect(() => {
    if (mode !== SESSION_MODES.DAILY || !learning.feedback || learning.isFinishing || learning.isAtCheckpoint) return;
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== 'Enter' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      learning.goToNextStep();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, learning.feedback, learning.isFinishing, learning.isAtCheckpoint, learning.goToNextStep]);

  if (sessionQuery.isLoading) {
    return <div className="session"><SessionHeader mode={mode} /><SkeletonScreen label="Noko đang chọn bài cho bạn…"><SessionCardSkeleton /></SkeletonScreen></div>;
  }
  if (sessionQuery.error || !session) {
    return <div className="session"><SessionHeader mode={mode} /><ErrorState message={sessionQuery.error?.message} onRetry={learning.restart} /></div>;
  }
  if (!session.steps.length) {
    return (
      <div className="session">
        <SessionHeader mode={mode} />
        <NokoMessage state="idle" text="Hiện chưa có gì phù hợp với kiểu học này. Thử “Học hôm nay” nhé 🌸" />
        <Link className="btn block mt-4" href="/hoc/daily">Học hôm nay</Link>
      </div>
    );
  }
  if (!currentStep) return null;

  const interaction = {
    feedback: learning.feedback,
    chosenAnswer: learning.chosenAnswer,
    isBusy: learning.isFinishing,
    onAnswer: learning.submitAnswer,
    onContinue: learning.goToNextStep,
  };

  return (
    <div className={`session${mode === SESSION_MODES.DAILY ? ' daily-session' : ''}`}>
      <SessionHeader mode={mode} />
      <SessionProgress total={session.steps.length} currentIndex={stepIndex} />
      {stepIndex === 0 && mode === SESSION_MODES.RESCUE ? (
        <NokoMessage state="comeback" text="Bạn quay lại rồi 🌸 Không cần học bù. Mình chọn một điểm bắt đầu nhẹ nhàng nhé." className="mb-3" />
      ) : null}
      {learning.isAtCheckpoint && learning.checkpointEvery ? (
        <SessionCheckpoint steps={session.steps} nextStepIndex={stepIndex} chunkSize={learning.checkpointEvery}
          isBusy={learning.isFinishing} onContinue={learning.continueAfterCheckpoint} onStop={learning.stopAtCheckpoint} />
      ) : (
      <div key={stepIndex}>
        {currentStep.type === 'surprise' ? <SurpriseStepView step={currentStep} {...interaction} /> : null}
        {currentStep.type === 'recall' ? <RecallStepView step={currentStep} {...interaction} /> : null}
        {currentStep.type === 'discover' ? (
          <DiscoverStepView step={currentStep} isBusy={interaction.isBusy} onAcknowledge={learning.acknowledgeAndContinue} />
        ) : null}
        {currentStep.type === 'use' ? <UseStepView step={currentStep} {...interaction} /> : null}
      </div>
      )}
      {learning.error ? <p className="sm center mt-3" role="alert">{learning.error.message}</p> : null}
    </div>
  );
}
