import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { GuessOption } from '@/components/learning/GuessOption';
import { buildReadingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-26 · Đọc hiểu — đoạn ngắn đúng trình độ đã học. Nội dung lấy từ bảng reading_passages. */
export default async function ReadingPage() {
  const { catalog, journeyDay } = await getLearnerContext();
  const passage = buildReadingPractice(catalog, journeyDay);
  return (
    <>
      <h1>Đọc hiểu</h1>
      {passage ? (
        <>
          <p className="soft sm" style={{ margin: '4px 0 14px' }}>
            Đoạn văn ngắn dùng đúng Kanji và ngữ pháp bạn đã học tới ngày {journeyDay}.
          </p>
          <div className="card" style={{ background: '#FFFDF8' }}>
            <p className="jp" style={{ fontSize: 19, lineHeight: 2.1 }}>{passage.textJp}</p>
            <AudioButton text={passage.textJp} label="🔊 Nghe cả đoạn" className="btn ghost sm mt-3" />
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
        </>
      ) : (
        <div className="mt-3"><EmptyState message="Chưa có đoạn đọc nào phù hợp với chặng bạn đang học." hint="Đoạn đọc đầu tiên mở vào ngày 23." /></div>
      )}
    </>
  );
}
