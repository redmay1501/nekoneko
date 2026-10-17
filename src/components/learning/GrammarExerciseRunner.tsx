'use client';

import { useMemo, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { type GrammarExercise, GRAMMAR_EXERCISE_KINDS, isExerciseCorrect, whyWrong } from '@/features/learning/grammar-exercises';

export type GrammarRunMode = 'luyen-tap' | 'kiem-tra';

const KIND_LABEL = Object.fromEntries(GRAMMAR_EXERCISE_KINDS.map((kind) => [kind.id, kind.label]));

/**
 * Chạy bài tập ngữ pháp của một bài / một mẫu.
 *  - Luyện tập: trả lời xong thấy ngay đúng/sai + giải thích (vì sao đúng, vì sao lựa chọn sai không hợp).
 *  - Kiểm tra: làm hết rồi NỘP — trước khi nộp không hiện đúng/sai hay đáp án; câu bỏ trống tính sai; nộp xong mới có
 *    điểm, đáp án và giải thích từng câu.
 * Chấm trong trình duyệt, KHÔNG ghi trí nhớ (Memory Engine chỉ đổi qua phiên học / ôn tập).
 */
export function GrammarExerciseRunner({ exercises, mode, title }: { exercises: GrammarExercise[]; mode: GrammarRunMode; title: string }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<string | null>>(() => exercises.map(() => null));
  const [isRevealed, setIsRevealed] = useState(false); // luyện tập: câu hiện tại đã xem đáp án
  const [isSubmitted, setIsSubmitted] = useState(false); // kiểm tra: đã nộp bài
  const [isFinished, setIsFinished] = useState(false); // luyện tập: đã qua câu cuối
  const exercise = exercises[index];
  const answer = answers[index];

  function setAnswer(value: string | null) {
    setAnswers((current) => current.map((entry, position) => (position === index ? value : entry)));
  }
  function choose(value: string) {
    if (mode === 'luyen-tap' && isRevealed) return;
    setAnswer(value);
    if (mode === 'luyen-tap') setIsRevealed(true);
  }
  function next() {
    if (index + 1 >= exercises.length) {
      if (mode === 'luyen-tap') setIsFinished(true);
      return;
    }
    setIndex(index + 1);
    setIsRevealed(false);
  }
  function restart() {
    setIndex(0);
    setAnswers(exercises.map(() => null));
    setIsRevealed(false);
    setIsSubmitted(false);
    setIsFinished(false);
  }

  useEnterToContinue(mode === 'luyen-tap' && isRevealed && !isFinished, next);

  if (!exercises.length) return <p className="card tight sm soft">Phần này chưa có bài tập.</p>;

  const answeredCount = answers.filter((value) => value !== null).length;
  const correctCount = exercises.filter((entry, position) => isExerciseCorrect(entry, answers[position])).length;

  if ((mode === 'kiem-tra' && isSubmitted) || (mode === 'luyen-tap' && isFinished)) {
    return (
      <section className="card gx-result" aria-live="polite">
        <p className="chip mint">{mode === 'kiem-tra' ? 'Đã nộp bài' : 'Luyện xong'}</p>
        <p className="study-result-score">{correctCount}/{exercises.length} câu đúng</p>
        {mode === 'kiem-tra' && answeredCount < exercises.length ? (
          <p className="sm soft">{exercises.length - answeredCount} câu bỏ trống được tính là sai.</p>
        ) : null}
        <button type="button" className="btn ghost mt-3" onClick={restart}>↻ Làm lại</button>
        {mode === 'kiem-tra' ? (
          <ol className="gx-review mt-4">
            {exercises.map((entry, position) => <ReviewItem key={entry.id} exercise={entry} answer={answers[position]} number={position + 1} />)}
          </ol>
        ) : null}
      </section>
    );
  }

  const showFeedback = mode === 'luyen-tap' && isRevealed;
  return (
    <section className="card study-quiz gx-runner" aria-label={title}>
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{exercises.length} · {KIND_LABEL[exercise.kind]}</span>
        <span className="chip lav jp">{exercise.pattern}</span>
      </div>
      <div className="study-progress" aria-hidden="true"><span style={{ width: `${(index / exercises.length) * 100}%` }} /></div>
      <p className={`study-prompt ${exercise.isPromptJapanese ? 'jp' : ''}`}>{exercise.prompt}</p>
      {exercise.kind === 'nhat-viet' || exercise.kind === 'tro-tu' ? (
        <div className="center"><AudioButton text={exercise.kind === 'tro-tu' ? exercise.sentence.reading || exercise.sentence.jp : exercise.sentence.reading || exercise.prompt}
          label="Nghe câu" className="btn ghost sm" /></div>
      ) : null}

      {exercise.kind === 'sap-xep' ? (
        <OrderPieces key={exercise.id} exercise={exercise} value={answer} isLocked={showFeedback} onChange={setAnswer}
          onComplete={(value) => { setAnswer(value); if (mode === 'luyen-tap') setIsRevealed(true); }} />
      ) : (
        <div className="quiz-options mt-3" role="group" aria-label="Chọn đáp án">
          {exercise.options.map((option, position) => {
            const isChosen = answer === option.text;
            const isCorrect = showFeedback && option.text === exercise.answer;
            const isWrong = showFeedback && isChosen && option.text !== exercise.answer;
            return (
              <button key={option.text} type="button" disabled={showFeedback} aria-pressed={isChosen}
                className={`quiz-option ${exercise.kind === 'nhat-viet' ? '' : 'jp'} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${isChosen && !showFeedback ? 'is-chosen' : ''}`}
                onClick={() => choose(option.text)}>
                <span className="quiz-option-key" aria-hidden="true">{String.fromCharCode(65 + position)}</span>
                <span className="quiz-option-text">{option.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {showFeedback ? (
        <Feedback exercise={exercise} answer={answer} onNext={next} isLast={index + 1 === exercises.length} />
      ) : null}

      {mode === 'kiem-tra' ? (
        <div className="gx-test-nav">
          <button type="button" className="btn ghost sm" onClick={() => setIndex(index - 1)} disabled={index === 0}>← Câu trước</button>
          {index + 1 < exercises.length ? (
            <button type="button" className="btn sm" onClick={() => setIndex(index + 1)}>Câu sau →</button>
          ) : (
            <button type="button" className="btn sm" onClick={() => {
              const missing = exercises.length - answeredCount;
              if (missing && !window.confirm(`Còn ${missing} câu chưa trả lời — các câu này sẽ tính là sai. Nộp bài?`)) return;
              setIsSubmitted(true);
            }}>Nộp bài ({answeredCount}/{exercises.length})</button>
          )}
        </div>
      ) : null}
    </section>
  );
}

/** Sắp xếp câu: chạm mảnh theo thứ tự; đủ mảnh thì ghi câu trả lời (luyện tập: chấm luôn). */
function OrderPieces({ exercise, value, isLocked, onChange, onComplete }: {
  exercise: GrammarExercise; value: string | null; isLocked: boolean;
  onChange: (value: string | null) => void; onComplete: (value: string) => void;
}) {
  const pieces = useMemo(() => {
    // Trộn tất định theo id (không dùng Math.random lúc render).
    const seeded = exercise.tokens.map((text, index) => ({ text, index, order: [...`${exercise.id}${index}`].reduce((sum, char) => (sum * 31 + char.codePointAt(0)!) % 9973, 7) }));
    return seeded.sort((left, right) => left.order - right.order);
  }, [exercise]);
  const [placed, setPlaced] = useState<number[]>([]);
  const placedSet = new Set(placed);
  const text = (indexes: number[]) => indexes.map((index) => exercise.tokens[index]).join('');

  function place(index: number) {
    if (isLocked) return;
    const next = [...placed, index];
    setPlaced(next);
    if (next.length === exercise.tokens.length) onComplete(text(next));
  }
  function remove(index: number) {
    if (isLocked) return;
    setPlaced(placed.filter((entry) => entry !== index));
    if (value !== null) onChange(null);
  }

  return (
    <>
      <div className="order-answer jp" aria-label="Câu bạn ghép">
        {!placed.length && value !== null ? (
          <span className="row" style={{ gap: 8, alignItems: 'center' }}>
            <b>{value}</b>
            {isLocked ? null : <button type="button" className="btn ghost sm" onClick={() => onChange(null)}>Xếp lại</button>}
          </span>
        ) : placed.length ? placed.map((index) => (
          <button key={index} type="button" className="order-piece" disabled={isLocked} onClick={() => remove(index)}>{exercise.tokens[index]}</button>
        )) : <span className="tiny muted">Chạm các mảnh bên dưới theo đúng thứ tự câu</span>}
      </div>
      <div className="order-pool jp">
        {pieces.map((piece) => (
          <button key={piece.index} type="button" className="order-piece" disabled={placedSet.has(piece.index) || isLocked || (value !== null && !placed.length)}
            onClick={() => place(piece.index)}>{piece.text}</button>
        ))}
      </div>
    </>
  );
}

function Feedback({ exercise, answer, onNext, isLast }: { exercise: GrammarExercise; answer: string | null; onNext: () => void; isLast: boolean }) {
  const isCorrect = isExerciseCorrect(exercise, answer);
  const wrongReason = answer !== null ? whyWrong(exercise, answer) : null;
  return (
    <div className={`feedback ${isCorrect ? '' : 'miss'}`}>
      <p>{isCorrect ? 'Đúng rồi! 🎉' : 'Chưa đúng — xem giải thích nhé.'}</p>
      <SentenceLine exercise={exercise} />
      {wrongReason ? <p className="sm mt-1">✗ {wrongReason}</p> : null}
      <p className="sm mt-1">✓ {exercise.explanation}</p>
      <button type="button" className="btn block mt-3" onClick={onNext}>{isLast ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
    </div>
  );
}

function SentenceLine({ exercise }: { exercise: GrammarExercise }) {
  return (
    <div className="mt-1">
      <div className="row" style={{ gap: 6, alignItems: 'center' }}>
        <b className="jp">{exercise.sentence.jp}</b>
        <AudioButton text={exercise.sentence.reading || exercise.sentence.jp} />
      </div>
      {exercise.sentence.reading && exercise.sentence.reading !== exercise.sentence.jp ? <p className="jp tiny muted">{exercise.sentence.reading}</p> : null}
      <p className="sm soft">{exercise.sentence.vi}</p>
    </div>
  );
}

function ReviewItem({ exercise, answer, number }: { exercise: GrammarExercise; answer: string | null; number: number }) {
  const isCorrect = isExerciseCorrect(exercise, answer);
  const reason = answer !== null ? whyWrong(exercise, answer) : null;
  return (
    <li className={`gx-review-item ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
      <div className="between"><b className="sm">Câu {number} · {KIND_LABEL[exercise.kind]}</b><span className="sm">{isCorrect ? '✓ Đúng' : answer === null ? '— Bỏ trống' : '✗ Sai'}</span></div>
      <p className={`sm mt-1 ${exercise.isPromptJapanese ? 'jp' : ''}`}>{exercise.prompt}</p>
      {!isCorrect ? (
        <p className="sm mt-1">Bạn chọn: <b className={exercise.kind === 'nhat-viet' ? '' : 'jp'}>{answer ?? '(chưa trả lời)'}</b> · Đáp án: <b className={exercise.kind === 'nhat-viet' ? '' : 'jp'}>{exercise.kind === 'sap-xep' ? exercise.sentence.jp : exercise.answer}</b></p>
      ) : null}
      {reason ? <p className="tiny mt-1">✗ {reason}</p> : null}
      <p className="tiny muted mt-1">✓ {exercise.explanation}</p>
    </li>
  );
}
