'use client';

import { LoadingRunner } from '@/components/common/LoadingRunner';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NokoMessage } from '@/components/common/NokoMessage';
import { SessionCardSkeleton } from '@/components/common/PageSkeletons';
import { SkeletonScreen } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/StateViews';
import { type TestAnswer, useLearningSession } from '@/features/learning/hooks/useLearningSession';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { ScrollToElementOnChange } from '@/components/common/ScrollToElementOnChange';
import { SESSION_MODES, type SessionMode, focusTestHref } from '@/features/learning/session-modes';
import type { PublicSessionStep } from '@/features/learning/session-types';
import { SessionCheckpoint } from './session/SessionCheckpoint';
import { SessionAudioNotice, useSessionAutoplay } from './session/SessionAudio';
import { PhaseIntro } from './session/PhaseIntro';
import { SessionHeader, SessionPhaseBar, SessionProgress } from './session/SessionHeader';
import { DiscoverStepView, RecallStepView, SurpriseStepView, UseStepView } from './session/SessionSteps';

/**
 * SC-33 · Phiên học — MỘT component cho mọi chế độ (Học hôm nay, Học nhanh 5 phút, …).
 * Thứ tự: Gặp lại → Khám phá → Dùng trong câu → Khoảnh khắc tiến bộ.
 */
export function LearningSession({ mode, focusKeys, returnTo, nextBatchHref, batchLabel, testFrom }: {
  mode: SessionMode; focusKeys?: readonly string[]; returnTo?: string; nextBatchHref?: string; batchLabel?: string; testFrom?: string;
}) {
  const learning = useLearningSession(mode, focusKeys, { returnTo, nextBatchHref, batchLabel, testFrom });
  const { sessionQuery, session, currentStep, stepIndex } = learning;
  useSessionAutoplay(currentStep, learning.feedback);

  // Enter sang câu tiếp sau khi đã trả lời (không khi đang gõ / chọn chữ IME / mở khay — xem useEnterToContinue).
  const { feedback, isFinishing, isAtCheckpoint, goToNextStep } = learning;
  useEnterToContinue(Boolean(feedback) && !isFinishing && !isAtCheckpoint, goToNextStep);

  if (sessionQuery.isLoading) {
    return <div className="session"><SessionHeader mode={mode} returnTo={returnTo} /><SkeletonScreen label="Noko đang chọn bài cho bạn…"><SessionCardSkeleton /></SkeletonScreen></div>;
  }
  if (sessionQuery.error || !session) {
    return <div className="session"><SessionHeader mode={mode} returnTo={returnTo} /><ErrorState message={sessionQuery.error?.message} onRetry={learning.restart} /></div>;
  }
  if (!session.steps.length && mode === SESSION_MODES.FOCUS) {
    return (
      <div className="session">
        <SessionHeader mode={mode} returnTo={returnTo} />
        <NokoMessage state="idle" text="Bạn chưa chọn kiến thức nào để học. Vào Học tập, chọn Kanji, từ vựng hay mẫu câu bạn muốn nhé 🌸" />
        <Link className="btn block mt-4" href="/hoc-tap/tu-vung">Mở Học tập</Link>
      </div>
    );
  }
  if (!session.steps.length) {
    return (
      <div className="session">
        <SessionHeader mode={mode} returnTo={returnTo} />
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
    // Mọi chế độ dùng CÙNG một bố cục: phản hồi + nút "Tiếp tục" ngay dưới câu hỏi (trong tầm ngón cái), không ở cuối trang.
    <>
    <ScrollToElementOnChange targetId="learning-session-area" trigger={`${mode}:${focusKeys?.join(',') ?? 'default'}`} />
    <div id="learning-session-area" className="session daily-session">
      <SessionHeader mode={mode} returnTo={returnTo} />
      {learning.testResult ? null : <>
        <SessionPhaseBar steps={session.steps} currentIndex={stepIndex} />
        <SessionProgress steps={session.steps} currentIndex={stepIndex} />
      </>}
      <SessionAudioNotice />
      {session.resumeFromStep > 0 && stepIndex === session.resumeFromStep && !learning.feedback ? (
        <NokoMessage state="comeback" text="Học tiếp từ chỗ bạn dừng lại 🐾 Những câu trước đã được lưu rồi." className="mb-3" />
      ) : null}
      {stepIndex === 0 && mode === SESSION_MODES.RESCUE ? (
        <NokoMessage state="comeback" text="Bạn quay lại rồi 🌸 Không cần học bù. Mình chọn một điểm bắt đầu nhẹ nhàng nhé." className="mb-3" />
      ) : null}
      {learning.testResult && testFrom ? (
        <TestResult answers={learning.testResult} testFrom={testFrom} testKeys={focusKeys ?? []} onRetry={learning.restart} />
      ) : learning.isFinishing || learning.finishError ? (
        <SessionWrapUp steps={session.steps} upToIndex={stepIndex} hasError={Boolean(learning.finishError)} onRetry={learning.retryFinish} />
      ) : learning.finishedPhase ? (
        <PhaseIntro steps={session.steps} nextStepIndex={stepIndex} previousPhase={learning.finishedPhase} onStart={learning.startNextPhase} />
      ) : learning.isAtCheckpoint && learning.checkpointEvery ? (
        <SessionCheckpoint steps={session.steps} nextStepIndex={stepIndex} chunkSize={learning.checkpointEvery}
          isBusy={learning.isFinishing} onContinue={learning.continueAfterCheckpoint} onStop={learning.stopAtCheckpoint} />
      ) : (
      <div key={stepIndex}>
        {currentStep.type === 'surprise' ? <SurpriseStepView step={currentStep} isDaily {...interaction} /> : null}
        {currentStep.type === 'recall' ? <RecallStepView step={currentStep} isDaily {...interaction} /> : null}
        {currentStep.type === 'discover' ? (
          <DiscoverStepView step={currentStep} isBusy={interaction.isBusy} onAcknowledge={learning.acknowledgeAndContinue} />
        ) : null}
        {currentStep.type === 'use' ? <UseStepView step={currentStep} isDaily {...interaction} /> : null}
      </div>
      )}
      {learning.error ? <p className="sm center mt-3" role="alert">{learning.error.message}</p> : null}
    </div>
    </>
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
        <LoadingRunner className="mt-3" label="Noko đang lưu và tổng kết cho bạn…" />
      )}
    </div>
  );
}

/**
 * Kết quả bài kiểm tra (mở từ trang Học tập) — hiện ngay trong phiên thay vì sang Khoảnh khắc tiến bộ:
 * điểm, các câu sai kèm đáp án, rồi để người học chọn: kiểm tra tiếp (đề khác) · ôn lại câu sai · làm lại đề này · về trang Học tập.
 */
function TestResult({ answers, testFrom, testKeys, onRetry }: { answers: TestAnswer[]; testFrom: string; testKeys: readonly string[]; onRetry: () => void }) {
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const wrong = answers.filter((answer) => !answer.isCorrect);
  const wrongKeys = [...new Set(wrong.map((answer) => answer.contentKey))];
  // Sai hết mọi mục của đề → "Ôn lại câu sai" chính là "Làm lại đề này", chỉ hiện một nút.
  const isWholeTest = wrongKeys.length === new Set(testKeys).size;
  const percent = answers.length ? Math.round((correct / answers.length) * 100) : 100;
  const nextTestRef = useRef<HTMLAnchorElement>(null);
  // Đưa focus vào nút chính → Enter / Space là "Kiểm tra tiếp" ngay.
  useEffect(() => nextTestRef.current?.focus({ preventScroll: true }), []);
  return (
    <div className="s-card pop center" role="status" aria-live="polite">
      <div style={{ fontSize: 46 }}>{percent >= 80 ? '🎉' : percent >= 50 ? '👏' : '🌱'}</div>
      <h2 className="mt-2">Xong bài kiểm tra!</h2>
      {answers.length ? (
        <p className="mt-1.5"><b style={{ fontSize: 22 }}>{correct}/{answers.length}</b> <span className="soft">câu đúng · {percent}%</span></p>
      ) : <p className="soft mt-1.5">Bạn đã làm xong bài.</p>}
      {wrong.length ? (
        <div className="mt-3" style={{ textAlign: 'left' }}>
          <p className="sm b">Câu chưa đúng ({wrong.length})</p>
          <ul className="test-result-list mt-1.5">
            {wrong.map((answer, index) => (
              <li key={`${answer.contentKey}:${index}`} className="row" style={{ gap: 8, justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line, #eee)' }}>
                <span className="jp">{answer.face}</span>
                {answer.correctAnswer ? <span className="sm soft">→ <span className="jp">{answer.correctAnswer}</span></span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : answers.length ? <p className="sm soft mt-2">Đúng hết — giỏi quá 🌸</p> : null}
      <Link ref={nextTestRef} className="btn block mt-4" href={`${testFrom}?kiem-tra=mo`}>Kiểm tra tiếp</Link>
      {wrongKeys.length && !isWholeTest ? <Link className="btn ghost block mt-2" href={focusTestHref(wrongKeys, testFrom)}>Ôn lại {wrongKeys.length} câu sai</Link> : null}
      <button type="button" className="btn ghost block mt-2" onClick={onRetry}>Làm lại đề này</button>
      <Link className="link sm mt-3" style={{ display: 'inline-block' }} href={testFrom}>Về trang Học tập</Link>
    </div>
  );
}
