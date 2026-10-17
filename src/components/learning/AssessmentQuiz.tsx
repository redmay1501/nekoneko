'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { useScrollToAnswerFeedback } from '@/hooks/useScrollToAnswerFeedback';
import { stopSpeech, useSpeech } from '@/hooks/useSpeech';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';
import { ListenControls } from './ListenControls';

export interface AssessmentQuestion {
  /** Có thì mỗi câu trả lời được báo lên `onAnswer` (để ghi vào trí nhớ). */
  contentKey?: string;
  prompt?: string;
  promptIsJapanese?: boolean;
  audioText?: string;
  answer: string;
  options: string[];
}

/** Bài nghe/kiểm tra từng câu, có chấm điểm cuối bài và nút làm lại. */
export function AssessmentQuiz({
  title,
  description,
  questions,
  emptyMessage,
  audioLabel = 'Nghe câu hỏi',
  onAnswer,
}: {
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  emptyMessage: string;
  audioLabel?: string;
  onAnswer?: (question: AssessmentQuestion, answer: string) => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const question = questions[questionIndex];
  const isListening = Boolean(question?.audioText && !question.prompt);
  const { speak } = useSpeech();
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  useScrollToAnswerFeedback(nextButtonRef, chosenAnswer);

  // Sang câu mới: dừng câu cũ đang đọc dở; bài nghe thì tự đọc câu mới (nếu người học bật tự phát). Rời bài → dừng.
  useEffect(() => {
    stopSpeech();
    if (isComplete || !question?.audioText || !(isListening && autoplayAudio)) return;
    speak(question.audioText);
  }, [questionIndex, isComplete]); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chạy khi đổi câu
  useEffect(() => stopSpeech, []);

  function choose(answer: string) {
    if (!question || chosenAnswer !== null) return;
    setChosenAnswer(answer);
    if (answer === question.answer) setCorrectCount((count) => count + 1);
    onAnswer?.(question, answer);
  }

  function continueQuiz() {
    if (questionIndex + 1 >= questions.length) {
      setIsComplete(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setChosenAnswer(null);
  }

  // Enter: đã chọn đáp án → câu tiếp / xem kết quả. Chưa chọn thì không bỏ qua câu.
  useEnterToContinue(Boolean(question) && !isComplete && chosenAnswer !== null, continueQuiz);

  function reset() {
    setQuestionIndex(0);
    setChosenAnswer(null);
    setCorrectCount(0);
    setIsComplete(false);
  }

  return (
    <section className="card" aria-label={title}>
      <h3>{title}</h3>
      <p className="sm soft" style={{ margin: '5px 0 14px' }}>{description}</p>
      {!questions.length ? <p className="sm soft">{emptyMessage}</p> : null}
      {questions.length && isComplete ? (
        <div className="center" aria-live="polite">
          <p className="chip mint">Hoàn thành bài</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: '12px 0 4px' }}>{correctCount}/{questions.length} câu đúng</p>
          <p className="sm soft">{correctCount === questions.length ? 'Tuyệt lắm, bạn nhớ rất chắc!' : 'Mình ôn thêm một lượt nữa là sẽ nhớ hơn.'}</p>
          <button type="button" className="btn mt-3" onClick={reset}>Làm lại bài kiểm tra</button>
        </div>
      ) : null}
      {question && !isComplete ? (
        <div className="card tight" aria-live="polite">
          <div className="between">
            <span className="tiny muted">Câu {questionIndex + 1}/{questions.length}</span>
            {question.audioText && !isListening ? <AudioButton text={question.audioText} label={audioLabel} className="btn ghost sm" /> : null}
          </div>
          {isListening && question.audioText ? <ListenControls text={question.audioText} label={audioLabel} /> : null}
          {question.prompt ? (
            <p className={question.promptIsJapanese ? 'jp glyph center' : 'center'}
              style={{ fontSize: question.promptIsJapanese ? 36 : 18, fontWeight: 600, margin: '14px 0' }}>
              {question.prompt}
            </p>
          ) : null}
          <div className="quiz-options" role="group" aria-label="Chọn đáp án">
            {question.options.map((option, index) => {
              const isCorrect = chosenAnswer !== null && option === question.answer;
              const isWrong = chosenAnswer === option && option !== question.answer;
              return (
                <button key={option} type="button" disabled={chosenAnswer !== null}
                  className={`quiz-option ${question.promptIsJapanese && !question.audioText ? 'jp' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  aria-pressed={chosenAnswer === option} onClick={() => choose(option)}>
                  <span className="quiz-option-key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span className="quiz-option-text">{option}</span>
                </button>
              );
            })}
          </div>
          {chosenAnswer !== null ? (
            <div className={`feedback ${chosenAnswer === question.answer ? '' : 'miss'}`}>
              <p>{chosenAnswer === question.answer ? 'Đúng rồi, tốt lắm!' : 'Không sao, mình nhớ dần nhé.'}</p>
              {chosenAnswer !== question.answer ? <p className="sm mt-1">Đáp án: <b>{question.answer}</b></p> : null}
              <button ref={nextButtonRef} type="button" className="btn block mt-3" onClick={continueQuiz}>
                {questionIndex + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
