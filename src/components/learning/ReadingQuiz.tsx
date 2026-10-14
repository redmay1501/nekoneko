'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NekoButton } from '@/components/common/NekoButton';
import { postJson } from '@/lib/api/api-client';
import type { ReadingQuestion } from '@/types/content';

interface ReadingQuizProps {
  passageId: number;
  questions: ReadingQuestion[];
  textVi: string;
  nextHref: string | null;
}

/**
 * Câu hỏi của một bài đọc: mỗi câu chọn MỘT lần (chọn xong khoá, hiện đúng / sai). Trả lời hết → điểm, bản dịch cả đoạn,
 * lưu kết quả (điểm cao nhất) và nút "Bài tiếp theo". "Làm lại" xoá lựa chọn để làm từ đầu.
 */
export function ReadingQuiz({ passageId, questions, textVi, nextHref }: ReadingQuizProps) {
  const [chosen, setChosen] = useState<Array<number | null>>(() => questions.map(() => null));
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const answered = chosen.filter((choice) => choice !== null).length;
  const isDone = answered === questions.length;
  const correct = chosen.filter((choice, index) => choice === questions[index].correctIndex).length;

  useEffect(() => {
    if (!isDone || saved !== 'idle') return;
    setSaved('saving');
    postJson('/api/reading/result', { passageId, correct, timeMs: Math.max(1000, Date.now() - startedAt.current) })
      .then(() => setSaved('saved'))
      .catch(() => setSaved('error'));
  }, [isDone, saved, passageId, correct]);

  function retry() {
    setChosen(questions.map(() => null));
    setSaved('idle');
    startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="sec-h"><h2>Câu hỏi</h2><span className="tiny muted">{answered}/{questions.length} câu</span></div>
      <div className="stack">
        {questions.map((question, questionIndex) => {
          const choice = chosen[questionIndex];
          return (
            <div key={question.question} className="card tight">
              <b className="sm">{questionIndex + 1}. {question.question}</b>
              <div className="study-options mt-2.5">
                {question.options.map((option, optionIndex) => {
                  const state = choice === null ? '' : optionIndex === question.correctIndex ? 'quiz-correct' : optionIndex === choice ? 'quiz-wrong' : '';
                  return (
                    <button key={option} type="button" className={`study-option ${state}`} disabled={choice !== null}
                      aria-pressed={choice === optionIndex}
                      onClick={() => setChosen((current) => current.map((value, index) => (index === questionIndex ? optionIndex : value)))}>
                      {option}{state === 'quiz-correct' ? ' ✓' : state === 'quiz-wrong' ? ' ✕' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {isDone ? (
        <section className="card study-result mt-4" aria-live="polite">
          <p className="chip mint">Xong bài</p>
          <p className="study-result-score">{correct}/{questions.length} câu đúng</p>
          <p className="sm soft">
            {correct === questions.length ? 'Tuyệt — hiểu hết cả đoạn!' : 'Đọc lại đoạn văn với bản dịch dưới đây rồi thử lại nhé.'}
            {saved === 'saved' ? ' · Đã lưu kết quả.' : saved === 'error' ? ' · Chưa lưu được kết quả (mạng?).' : ''}
          </p>
          <div className="reading-translation mt-3">
            <span className="tiny muted">Bản dịch</span>
            <p className="sm">{textVi}</p>
          </div>
          <div className="row wrap mt-3" style={{ gap: 8, justifyContent: 'center' }}>
            <button type="button" className="btn ghost" onClick={retry}>↻ Làm lại</button>
            {nextHref ? <NekoButton href={nextHref} catPose="none">Bài tiếp theo →</NekoButton> : <Link className="btn" href="/luyen-tap/doc">🎉 Đã tới bài cuối — về danh sách</Link>}
          </div>
        </section>
      ) : null}
    </>
  );
}
