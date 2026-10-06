'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NokoMessage } from '@/components/common/NokoMessage';
import { SessionCardSkeleton } from '@/components/common/PageSkeletons';
import { SkeletonScreen } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/StateViews';
import { useLearningSession } from '@/features/learning/hooks/useLearningSession';
import { SESSION_MODES, type SessionMode } from '@/features/learning/session-modes';
import type { PublicSessionStep } from '@/features/learning/session-types';
import { SessionCheckpoint } from './session/SessionCheckpoint';
import { PhaseIntro } from './session/PhaseIntro';
import { SessionHeader, SessionPhaseBar, SessionProgress } from './session/SessionHeader';
import { DiscoverStepView, RecallStepView, SurpriseStepView, UseStepView } from './session/SessionSteps';

/**
 * SC-33 · Phiên học — MỘT component cho mọi chế độ (Học hôm nay, Học nhanh 5 phút, …).
 * Thứ tự: Gặp lại → Khám phá → Dùng trong câu → Khoảnh khắc tiến bộ.
 */
export function LearningSession({ mode }: { mode: SessionMode }) {
  const learning = useLearningSession(mode);
  const { sessionQuery, session, currentStep, stepIndex } = learning;

  // Enter sang câu tiếp sau khi đã trả lời. Bỏ qua khi đang gõ chữ và khi giữ phím.
  const { feedback, isFinishing, isAtCheckpoint, goToNextStep } = learning;
  useEffect(() => {
    if (mode !== SESSION_MODES.DAILY || !feedback || isFinishing || isAtCheckpoint) return;
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== 'Enter' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      goToNextStep();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, feedback, isFinishing, isAtCheckpoint, goToNextStep]);

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
      <SessionPhaseBar steps={session.steps} currentIndex={stepIndex} />
      <SessionProgress total={session.steps.length} currentIndex={stepIndex} />
      {session.resumeFromStep > 0 && stepIndex === session.resumeFromStep && !learning.feedback ? (
        <NokoMessage state="comeback" text="Học tiếp từ chỗ bạn dừng lại 🐾 Những câu trước đã được lưu rồi." className="mb-3" />
      ) : null}
      {stepIndex === 0 && mode === SESSION_MODES.RESCUE ? (
        <NokoMessage state="comeback" text="Bạn quay lại rồi 🌸 Không cần học bù. Mình chọn một điểm bắt đầu nhẹ nhàng nhé." className="mb-3" />
      ) : null}
      {learning.isFinishing || learning.finishError ? (
        <SessionWrapUp steps={session.steps} upToIndex={stepIndex} hasError={Boolean(learning.finishError)} onRetry={learning.retryFinish} />
      ) : learning.finishedPhase ? (
        <PhaseIntro steps={session.steps} nextStepIndex={stepIndex} previousPhase={learning.finishedPhase} onStart={learning.startNextPhase} />
      ) : learning.isAtCheckpoint && learning.checkpointEvery ? (
        <SessionCheckpoint steps={session.steps} nextStepIndex={stepIndex} chunkSize={learning.checkpointEvery}
          isBusy={learning.isFinishing} onContinue={learning.continueAfterCheckpoint} onStop={learning.stopAtCheckpoint} />
      ) : (
      <div key={stepIndex}>
        {currentStep.type === 'surprise' ? <SurpriseStepView step={currentStep} isDaily={mode === SESSION_MODES.DAILY} {...interaction} /> : null}
        {currentStep.type === 'recall' ? <RecallStepView step={currentStep} isDaily={mode === SESSION_MODES.DAILY} {...interaction} /> : null}
        {currentStep.type === 'discover' ? (
          <DiscoverStepView step={currentStep} isBusy={interaction.isBusy} onAcknowledge={learning.acknowledgeAndContinue} />
        ) : null}
        {currentStep.type === 'use' ? <UseStepView step={currentStep} isDaily={mode === SESSION_MODES.DAILY} {...interaction} /> : null}
      </div>
      )}
      {learning.error ? <p className="sm center mt-3" role="alert">{learning.error.message}</p> : null}
    </div>
  );
}

/** Màn kết thúc hiện NGAY khi xong câu cuối (hoặc bấm nghỉ ở điểm dừng) — phần lưu & tổng kết chạy phía sau. */
function SessionWrapUp({ steps, upToIndex, hasError, onRetry }: {
  steps: PublicSessionStep[]; upToIndex: number; hasError: boolean; onRetry: () => void;
}) {
  const done = steps.slice(0, upToIndex + 1);
  const newCount = new Set(done.filter((step) => step.type === 'discover').map((step) => step.contentKey)).size;
  const reviewedCount = new Set(done.filter((step) => step.type !== 'discover' && !(step.type === 'recall' && step.isPractice)).map((step) => step.contentKey)).size;
  const parts = [newCount ? `học ${newCount} thứ mới` : '', reviewedCount ? `ôn ${reviewedCount} thứ` : ''].filter(Boolean);
  return (
    <div className="s-card pop center" role="status" aria-live="polite">
      <div style={{ fontSize: 46 }}>🎉</div>
      <h2 className="mt-2">Xong rồi!</h2>
      <p className="soft mt-1.5">{parts.length ? `Hôm nay bạn đã ${parts.join(' và ')}.` : 'Bạn đã hoàn thành phiên học.'}</p>
      {hasError ? (
        <>
          <p className="sm mt-3" role="alert">Chưa lưu xong tổng kết — mạng hơi chập chờn. Các câu trả lời vẫn được giữ.</p>
          <button type="button" className="btn block mt-3" onClick={onRetry}>Thử lại</button>
        </>
      ) : (
        <p className="sm muted mt-3" aria-busy="true">Noko đang lưu và tổng kết cho bạn… 🐾</p>
      )}
    </div>
  );
}
