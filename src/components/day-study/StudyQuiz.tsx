'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { AutoNextToggle } from '@/components/common/AutoNextToggle';
import { useAutoAdvance } from '@/hooks/useAutoNext';
import { AudioButton } from '@/components/common/AudioButton';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { useScrollToAnswerFeedback } from '@/hooks/useScrollToAnswerFeedback';
import { createRequestId, postJson } from '@/lib/api/api-client';
import { compareJapanese } from '@/lib/utils/japanese-text';
import { fitTextStyle } from '@/lib/utils/fit-text';
import type { StudyQuestion } from '@/features/learning/day-study-quiz';
import { KanjiStoryNudge } from '@/components/learning/KanjiStoryNudge';
import { KanaReading } from '@/components/common/KanaReading';

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
  /** Nhãn ngữ cảnh trên mỗi câu ("Ôn tập từ vựng · Bài 1 (1/3) · Ngày 14 · Nhật → Việt"). */
  contextLabel?: string;
}

const label = (question: StudyQuestion, value: string) => question.optionLabels?.[value] ?? value;

/**
 * Bài trắc nghiệm / gõ của luồng học theo ngày: từng câu một, đúng / sai hiện ngay, cuối bài có tổng kết
 * (số câu đúng, độ chính xác, danh sách câu sai) + "Làm lại" và "Ôn lại câu sai".
 * Mỗi câu trả lời gửi lên /api/study/answer (chạy nền) — server tự chấm và ghi trí nhớ tối đa một lần mỗi ngày.
 */
export function StudyQuiz({ questions, unit, isRecorded = true, onRestart, onRetryWrong, onWrong, contextLabel }: StudyQuizProps) {
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [answered, setAnswered] = useState<Answered[]>([]);
  const question = questions[index];
  const isDone = index >= questions.length;
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Lưu câu trả lời lên server: tự chuyển câu chỉ khi đã lưu xong (lỗi → đứng lại, báo cho người học). */
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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
      setSaveState('saving');
      const questionIndex = index;
      postJson('/api/study/answer', {
        contentKey: question.contentKey, ask: question.ask, answer: value, prompt: question.wordPrompt, requestId: createRequestId(),
      }).then(() => setSaveState((current) => (current === 'saving' && questionIndex === indexRef.current ? 'saved' : current)))
        .catch(() => setSaveState((current) => (questionIndex === indexRef.current ? 'error' : current)));
    } else {
      setSaveState('saved');
    }
  }

  function next() {
    setGiven(null);
    setTyped('');
    setSaveState('idle');
    setIndex((current) => current + 1);
  }
  const indexRef = useRef(index);
  indexRef.current = index;

  // Câu gõ: focus ô nhập khi câu mới đã vẽ xong (không khi đã chấm — ô chỉ đọc).
  const isTyping = Boolean(question) && !question?.options.length;
  useEffect(() => {
    if (!isTyping || given !== null) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [index, isTyping, given]);

  const isAutoNext = useAutoAdvance({
    answerKey: given !== null && !isDone ? `${index}:${given}` : null,
    isCorrect: answered[answered.length - 1]?.isCorrect,
    isReady: saveState === 'saved',
    onNext: next,
  });

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
      {contextLabel ? <p className="step-origin"><b>{contextLabel}</b></p> : null}
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{questions.length}</span>
        <AutoNextToggle />
        {question.audioText && (given !== null || !question.audioRevealsAnswer) ? <AudioButton text={question.audioText} /> : null}
      </div>
      <div className="study-progress" aria-hidden="true"><span style={{ width: `${(index / questions.length) * 100}%` }} /></div>
      {question.promptIsJapanese ? (
        <div className="fit-box"><p className="jp study-prompt is-jp fit-text" style={fitTextStyle(question.prompt, 30, 17)}>{question.prompt}</p></div>
      ) : <p className="study-prompt">{question.prompt}</p>}
      {question.promptReading ? <p className="jp center sm soft study-reading">{question.promptReading}</p> : null}
      {question.hint ? <p className="center tiny muted">{question.hint}</p> : null}
      {question.options.length ? (
        <div className="study-options mt-3">
          {question.options.map((option) => {
            const state = given === null ? '' : option === question.answer ? 'quiz-correct' : option === given ? 'quiz-wrong' : '';
            return (
              <button key={option} type="button" disabled={given !== null} onClick={() => submit(option)}
                className={`study-option ${question.optionsAreJapanese ? 'jp' : ''} ${state}`}>
                {label(question, option)}
                {question.optionReadings?.[option] ? <span className="study-option-reading">{question.optionReadings[option]}</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="study-typing mt-3" onSubmit={submitTyped}>
          <input ref={inputRef} className="input jp" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={given !== null}
            lang="ja" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Gõ bằng kana…" aria-label="Câu trả lời"
            onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} />
          {given === null ? <button type="submit" className="btn" disabled={!typed.trim()}>Kiểm tra</button> : null}
        </form>
      )}
      {given !== null ? (
        <div className={`feedback ${isCorrect ? '' : 'miss'}`}>
          <p>{isCorrect ? 'Đúng rồi! 🎉' : 'Chưa đúng — không sao, nhớ dần nhé.'}</p>
          {!isCorrect ? <p className="sm mt-1">Đáp án: <b className={question.optionsAreJapanese ? 'jp' : ''}>{label(question, question.answer)}</b>
            <KanaReading text={question.answer} reading={question.optionReadings?.[question.answer]} block /></p> : null}
          {/* Sai một Kanji → gợi ý câu chốt của câu chuyện (chỉ gợi ý, không đổi cách chấm). */}
          {!isCorrect ? <KanjiStoryNudge contentKey={question.contentKey} /> : null}
          {saveState === 'error' ? <p className="tiny mt-2" role="alert">Chưa lưu được câu này (mạng?) — bài vẫn tiếp tục, lần ôn sau Neko hỏi lại.</p> : null}
          <button ref={nextButtonRef} type="button" className={`btn block mt-3 streak-next${isAutoNext ? ' is-auto' : ''}`} onClick={next}>
            {isAutoNext ? 'Tự chuyển… · bấm để sang ngay →' : index + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
