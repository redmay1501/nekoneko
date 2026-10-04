import type { StepAnswerFeedback } from '@/features/learning/session-types';

interface AnswerOptionsProps {
  options: string[];
  chosenAnswer: string | null;
  feedback: StepAnswerFeedback | null;
  isDisabled: boolean;
  isJapanese: boolean;
  onChoose: (answer: string) => void;
}

/** Các lựa chọn trắc nghiệm. Đáp án đúng chỉ được tô sau khi server chấm xong. */
export function AnswerOptions({ options, chosenAnswer, feedback, isDisabled, isJapanese, onChoose }: AnswerOptionsProps) {
  return (
    <div className="s-opt">
      {options.map((option) => {
        const isCorrectOption = feedback?.correctAnswer === option;
        const isWrongChoice = Boolean(feedback) && option === chosenAnswer && !isCorrectOption;
        return (
          <button key={option} type="button" disabled={isDisabled || Boolean(feedback)}
            className={`opt ${isJapanese ? 'jp' : ''} ${isCorrectOption ? 'ok' : ''} ${isWrongChoice ? 'no' : ''}`}
            // Đã chọn, đang chờ server chấm → vòng xoay trên đúng lựa chọn đó.
            aria-busy={isDisabled && !feedback && option === chosenAnswer}
            onClick={() => onChoose(option)}>
            {option}
            {isCorrectOption ? <span className="sr-only"> — đáp án đúng</span> : null}
          </button>
        );
      })}
    </div>
  );
}
