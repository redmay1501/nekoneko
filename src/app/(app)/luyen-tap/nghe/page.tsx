import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { GuessOption } from '@/components/learning/GuessOption';
import { buildListeningPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-24 · Luyện nghe — nghe trước, hiểu sau. */
export default async function ListeningPage() {
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const practice = buildListeningPractice(catalog, memoryViews, journeyDay);
  return (
    <>
      <h1>Luyện nghe</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Nghe trước, hiểu sau. Mỗi câu nghe ba lượt: không nhìn chữ → nhìn chữ → nói đuổi theo.
      </p>
      <div className="card">
        <h3>Nghe và chọn nghĩa</h3>
        {practice.questions.length ? (
          <div className="stack mt-3">
            {practice.questions.map((question, index) => (
              <div key={index} className="card tight">
                <AudioButton text={question.audioText} label="Nghe" className="btn ghost sm" />
                <div className="row wrap mt-2" style={{ gap: 6 }}>
                  {question.options.map((option) => <GuessOption key={option} label={option} isCorrect={option === question.answer} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="sm soft mt-2">Từ vựng sẽ xuất hiện ở đây khi bạn bước vào chặng Nền tảng (ngày 15).</p>
        )}
      </div>
      <div className="sec-h"><h2>Shadowing — nói đuổi theo</h2></div>
      {practice.shadowing.length ? (
        <div className="stack">
          {practice.shadowing.map((pattern) => (
            <div key={pattern.id} className="card tight">
              <div className="between">
                <p className="jp" style={{ fontSize: 17 }}>{pattern.exampleJp}</p>
                <AudioButton text={pattern.exampleJp} label="Nghe câu mẫu" />
              </div>
              <p className="sm muted mt-1">{pattern.exampleVi}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Chưa có câu nào để nói đuổi theo." hint="Mẫu câu đầu tiên đến vào ngày 15." />
      )}
      <div className="card tight mt-3.5" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
        <b className="sm">Nguồn nghe gợi ý</b>
        <ul className="sm soft mt-2" style={{ lineHeight: 1.8 }}>
          {practice.resources.map((resource) => <li key={resource.id}>• {resource.source}</li>)}
        </ul>
      </div>
    </>
  );
}
