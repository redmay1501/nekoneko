import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { GuessOption } from '@/components/learning/GuessOption';
import { buildReadingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * SC-26 · Đọc hiểu — đoạn ngắn theo trình độ (bảng reading_passages). Không khoá theo ngày: đoạn gợi ý cho ngày
 * chưa tới vẫn đọc được, chỉ ghi rõ là dành cho sau ngày đó.
 */
export default async function ReadingPage() {
  const { catalog, journeyDay } = await getLearnerContext();
  const passages = buildReadingPractice(catalog);
  return (
    <>
      <h1>Đọc hiểu</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Hiện có {passages.length} đoạn đọc. Đọc to, rồi trả lời câu hỏi.
      </p>
      {passages.length ? passages.map((passage) => (
        <section key={passage.day} className="mb-4">
          <div className="row wrap mb-2" style={{ gap: 6 }}>
            <span className={`chip ${passage.day <= journeyDay ? 'mint' : ''}`}>
              {passage.day <= journeyDay ? `Hợp với ngày ${passage.day} — bạn đã học tới` : `Gợi ý sau ngày ${passage.day} của lộ trình — vẫn đọc thử được`}
            </span>
          </div>
          <div className="card" style={{ background: '#FFFDF8' }}>
            <p className="jp" style={{ fontSize: 19, lineHeight: 2.1 }}>{passage.textJp}</p>
            <AudioButton text={passage.textJp} label="Nghe cả đoạn" className="btn ghost sm mt-3" showText />
          </div>
          <div className="sec-h"><h2>Câu hỏi</h2><span className="tiny muted">{passage.questions.length} câu</span></div>
          <div className="stack">
            {passage.questions.map((question) => (
              <div key={question.question} className="card tight">
                <b className="sm">{question.question}</b>
                <div className="s-opt" style={{ marginTop: 10, gap: 7 }}>
                  {question.options.map((option, index) => (
                    <GuessOption key={option} label={option} isCorrect={index === question.correctIndex} className="opt"
                      style={{ padding: '11px 13px', fontSize: 14 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )) : (
        <div className="mt-3"><EmptyState message="Chưa có đoạn đọc nào." hint="Đoạn đọc sẽ được bổ sung dần." /></div>
      )}
    </>
  );
}
