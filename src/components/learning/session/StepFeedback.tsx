import { NokoMessage } from '@/components/common/NokoMessage';
import type { StepAnswerFeedback } from '@/features/learning/session-types';
import { AnimatedEmoji } from '@/components/common/EmojiIcon';

interface StepFeedbackProps {
  kind: 'recall' | 'practice' | 'use';
  feedback: StepAnswerFeedback;
  isBusy: boolean;
  onContinue: () => void;
  compact?: boolean;
}

/**
 * Phản hồi sau một câu trả lời — đúng thì vui, sai thì không phạt.
 * Hiện ngay khi bấm (trình duyệt tự chấm); dòng "lần tới gặp lại" chỉ hiện khi server ghi xong và trả về.
 */
export function StepFeedback({ kind, feedback, isBusy, onContinue, compact = false }: StepFeedbackProps) {
  const isCorrect = feedback.isCorrect === true;
  const memory = feedback.memory;
  if (compact) {
    return (
      <div className={`feedback daily-feedback ${isCorrect ? '' : 'miss'}`} aria-live="polite">
        <button type="button" className="btn block" onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>Tiếp tục</button>
        <p className="sm mt-2">
          {isCorrect ? 'Đúng rồi, bạn nhớ tốt lắm!' : 'Không sao, mình nhớ dần nhé.'}
          {feedback.correctAnswer ? <> Đáp án: <b className="jp">{feedback.correctAnswer}</b>.</> : null}
        </p>
      </div>
    );
  }
  return (
    <div className={`feedback ${isCorrect ? '' : 'miss'}`} aria-live="polite">
      {isCorrect && kind === 'recall' ? (
        <>
          <b><AnimatedEmoji name="sparkles" size={26} className="inline-emoji" /> Bạn vẫn nhớ!</b>
          {memory ? (
            <p className="sm mt-1 fade-in">
              Bạn đã gặp nó {memory.lastEncounterText}. Lần tới mình sẽ đưa lại {memory.nextEncounterText.toLowerCase()}.
            </p>
          ) : null}
        </>
      ) : null}
      {isCorrect && kind === 'practice' ? (
        <>
          <b><AnimatedEmoji name="sparkles" size={26} className="inline-emoji" /> Đúng rồi!</b>
          <p className="sm mt-1">Vừa học xong đã nhớ được — Neko Neko sẽ đưa nó quay lại để giữ lâu hơn.</p>
        </>
      ) : null}
      {isCorrect && kind === 'use' ? (
        <>
          <b>🌸 Dùng đúng rồi!</b>
          <p className="sm mt-1">Câu này bạn có thể nói được ngoài đời thật.</p>
        </>
      ) : null}
      {!isCorrect ? (
        <>
          <b>{kind === 'practice' ? 'Chưa đúng — mới học lần đầu mà.' : 'Chưa nhớ cũng không sao.'}</b>
          <p className="sm mt-1">
            {feedback.correctAnswer ? <>Đáp án là <b className="jp">{feedback.correctAnswer}</b>. </> : null}
            Neko Neko sẽ đưa nó quay lại sớm hơn — có thể ngay ngày mai.
          </p>
        </>
      ) : null}
      <NokoMessage state={isCorrect ? 'correct' : 'wrong'} className="mt-3" />
      <button type="button" className="btn block mt-3" onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>Tiếp tục</button>
    </div>
  );
}
