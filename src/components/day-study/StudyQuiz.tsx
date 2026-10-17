'use client';

import { type FormEvent, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { useScrollToAnswerFeedback } from '@/hooks/useScrollToAnswerFeedback';
import { createRequestId, postJson } from '@/lib/api/api-client';
import { compareJapanese } from '@/lib/utils/japanese-text';
import { fitTextStyle } from '@/lib/utils/fit-text';
import type { StudyQuestion } from '@/features/learning/day-study-quiz';

interface Answered {
  question: StudyQuestion;
  given: string;
  isCorrect: boolean;
}

interface StudyQuizProps {
  questions: StudyQuestion[];
  /** Đơn vị trong câu kết quả: "từ", "câu", "chữ". */
  unit: string;
  /** Ghi vào trí nhớ (server chấm lại). Bài luyện thêm thì false. */
  isRecorded?: boolean;
  onRestart: () => void;
  onRetryWrong: (contentKeys: string[]) => void;
  /** Báo các mục trả lời sai — gom lại cho bước Ôn tập. */
  onWrong?: (contentKey: string) => void;
}

const label = (question: StudyQuestion, value: string) => question.optionLabels?.[value] ?? value;

/**
 * Bài trắc nghiệm / gõ của luồng học theo ngày: từng câu một, đúng / sai hiện ngay, cuối bài có tổng kết
 * (số câu đúng, độ chính xác, danh sách câu sai) + "Làm lại" và "Ôn lại câu sai".
 * Mỗi câu trả lời gửi lên /api/study/answer (chạy nền) — server tự chấm và ghi trí nhớ tối đa một lần mỗi ngày.
 */
export function StudyQuiz({ questions, unit, isRecorded = true, onRestart, onRetryWrong, onWrong }: StudyQuizProps) {
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [answered, setAnswered] = useState<Answered[]>([]);
  const question = questions[index];
  const isDone = index >= questions.length;
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  useScrollToAnswerFeedback(nextButtonRef, given);

  function submit(value: string) {
    if (!question || given !== null) return;
    const isCorrect = question.options.length
      ? value === question.answer
      : compareJapanese(value, question.accepted ?? [question.answer], { foldKatakana: true }).isCorrect;
    setGiven(value);
    setAnswered((current) => [...current, { question, given: value, isCorrect }]);
    if (!isCorrect) onWrong?.(question.contentKey);
    if (isRecorded) {
      postJson('/api/study/answer', {
        contentKey: question.contentKey, ask: question.ask, answer: value, prompt: question.wordPrompt, requestId: createRequestId(),
      }).catch(() => undefined);
    }
  }

  function next() {
    setGiven(null);
    setTyped('');
    setIndex((current) => current + 1);
  }

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    if (typed.trim()) submit(typed.trim());
  }

  useEnterToContinue(given !== null && !isDone, next);

  if (!questions.length) return <p className="sm soft card tight">Chưa đủ dữ liệu để tạo bài này.</p>;

  if (isDone) {
    const wrong = answered.filter((entry) => !entry.isCorrect);
    const correct = answered.length - wrong.length;
    const accuracy = Math.round((correct / Math.max(answered.length, 1)) * 100);
    return (
      <section className="card study-result" aria-live="polite">
        <p className="chip mint">Hoàn thành</p>
        <p className="study-result-score">{correct}/{answered.length} {unit} đúng</p>
        <p className="sm soft">Độ chính xác {accuracy}% · {accuracy === 100 ? 'Tuyệt lắm, nhớ rất chắc!' : 'Ôn lại phần sai một lượt nữa là nhớ hơn.'}</p>
        {wrong.length ? (
          <ul className="study-wrong-list mt-3" aria-label="Câu sai">
            {wrong.map((entry) => (
              <li key={entry.question.id}>
                <span className={entry.question.promptIsJapanese ? 'jp' : ''}>{entry.question.prompt}</span>
                <span className="tiny muted"> → </span>
                <b className={entry.question.optionsAreJapanese ? 'jp' : ''}>{label(entry.question, entry.question.answer)}</b>
                <span className="tiny muted"> (bạn chọn: {label(entry.question, entry.given)})</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="row wrap mt-3" style={{ gap: 8, justifyContent: 'center' }}>
          <button type="button" className="btn ghost" onClick={onRestart}>↻ Làm lại</button>
          {wrong.length ? (
            <button type="button" className="btn review" onClick={() => onRetryWrong([...new Set(wrong.map((entry) => entry.question.contentKey))])}>
              🔁 Ôn {wrong.length} {unit} sai
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const isCorrect = given !== null && answered[answered.length - 1]?.isCorrect;
  return (
    <section className="card study-quiz" aria-live="polite">
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{questions.length}</span>
        {question.audioText && (given !== null || question.promptIsJapanese) ? <AudioButton text={question.audioText} /> : null}
      </div>
      <div className="study-progress" aria-hidden="true"><span style={{ width: `${(index / questions.length) * 100}%` }} /></div>
      {question.promptIsJapanese ? (
        <div className="fit-box"><p className="jp study-prompt is-jp fit-text" style={fitTextStyle(question.prompt, 36, 18)}>{question.prompt}</p></div>
      ) : <p className="study-prompt">{question.prompt}</p>}
      {question.hint ? <p className="center tiny muted">{question.hint}</p> : null}
      {question.options.length ? (
        <div className="study-options mt-3">
          {question.options.map((option) => {
            const state = given === null ? '' : option === question.answer ? 'quiz-correct' : option === given ? 'quiz-wrong' : '';
            return (
              <button key={option} type="button" disabled={given !== null} onClick={() => submit(option)}
                className={`study-option ${question.optionsAreJapanese ? 'jp' : ''} ${state}`}>
                {label(question, option)}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="study-typing mt-3" onSubmit={submitTyped}>
          <input className="input jp" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={given !== null}
            lang="ja" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Gõ bằng kana…" aria-label="Câu trả lời"
            onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} />
          {given === null ? <button type="submit" className="btn" disabled={!typed.trim()}>Kiểm tra</button> : null}
        </form>
      )}
      {given !== null ? (
        <div className={`feedback ${isCorrect ? '' : 'miss'}`}>
          <p>{isCorrect ? 'Đúng rồi! 🎉' : 'Chưa đúng — không sao, nhớ dần nhé.'}</p>
          {!isCorrect ? <p className="sm mt-1">Đáp án: <b className={question.optionsAreJapanese ? 'jp' : ''}>{label(question, question.answer)}</b></p> : null}
          <button ref={nextButtonRef} type="button" className="btn block mt-3" onClick={next}>{index + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
        </div>
      ) : null}
    </section>
  );
}
