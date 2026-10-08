import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { ListeningQuiz } from '@/components/learning/ListeningQuiz';
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
        Nghe từ đã tới ngày trên lộ trình, chọn nghĩa rồi xem điểm sau khi hoàn thành. Mỗi câu cũng được tính là một lần gặp lại trong trí nhớ.
      </p>
      <ListeningQuiz title="Nghe và chọn nghĩa" description="Nghe từng từ, chọn nghĩa rồi bấm câu tiếp theo. Cuối bài có kết quả và nút làm lại."
        questions={practice.questions.map((question) => ({ contentKey: question.contentKey, audioText: question.audioText, answer: question.answer, options: question.options }))}
        emptyMessage="Từ như はい, テレビ và lời chào sẽ có bài nghe khi tới ngày của từ đó." />
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
