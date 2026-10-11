import Link from 'next/link';
import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { ListeningQuiz } from '@/components/learning/ListeningQuiz';
import { buildListeningPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-24 · Luyện nghe — nghe trước, hiểu sau. */
export default async function ListeningPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; luot?: string }> }) {
  const params = await searchParams;
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const round = Number(params.luot ?? 0) || 0;
  const practice = buildListeningPractice(catalog, memoryViews, journeyDay, params['pham-vi'], `listening:${round}`);
  const hrefFor = (range: string, nextRound = 0) => `/luyen-tap/nghe?pham-vi=${range}${nextRound ? `&luot=${nextRound}` : ''}`;
  return (
    <>
      <h1>Luyện nghe</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Nghe một từ, chọn nghĩa. Chọn phần muốn nghe — kể cả bài chưa học tới. Từ đã học thì được ôn thêm một lần.
      </p>
      <div className="study-parts mb-3" aria-label="Phạm vi luyện nghe">
        {practice.ranges.map((option) => (
          <Link key={option.id} className={`chip ${option.id === practice.range ? 'pink' : ''}`} href={hrefFor(option.id)} scroll={false}
            aria-current={option.id === practice.range ? 'true' : undefined}>{option.label}</Link>
        ))}
      </div>
      <ListeningQuiz key={`${practice.range}:${round}`} title="Nghe và chọn nghĩa" description="Nghe từng từ, chọn nghĩa rồi bấm câu tiếp theo. Cuối bài có kết quả và nút làm lại."
        questions={practice.questions.map((question) => ({ contentKey: question.contentKey, audioText: question.audioText, answer: question.answer, options: question.options }))}
        emptyMessage="Phần này chưa có từ để nghe — chọn “Tất cả” hoặc một bài nhé." />
      <p className="center mt-2.5"><Link className="btn ghost sm" href={hrefFor(practice.range, round + 1)} scroll={false}>↻ Bài khác</Link></p>
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
