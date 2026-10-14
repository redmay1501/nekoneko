import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AudioButton } from '@/components/common/AudioButton';
import { ReadingQuiz } from '@/components/learning/ReadingQuiz';
import { readingRecordOf } from '@/features/games/reading-progress';
import { getLearnerContext } from '@/features/learning/learner-context';
import { nextReadingId } from '@/features/learning/reading-list';

/** Một bài đọc hiểu: đoạn văn (nghe được) → câu hỏi → điểm, bản dịch, bài tiếp theo. */
export default async function ReadingPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { catalog, journeyDay, settings } = await getLearnerContext();
  const passages = catalog.content.readingPassages;
  const passage = passages.find((candidate) => candidate.id === id);
  if (!passage) notFound();
  const nextId = nextReadingId(passages, passage.id);
  const record = readingRecordOf(settings.gameRecords, passage.id);
  return (
    <>
      <Link className="link" href="/luyen-tap/doc">← Danh sách bài đọc</Link>
      <div className="row wrap mt-2" style={{ gap: 6 }}>
        <span className="chip lav">{passage.lesson}</span>
        <span className={`chip ${passage.day <= journeyDay ? 'mint' : ''}`}>
          {passage.day <= journeyDay ? `Hợp với ngày ${passage.day} — bạn đã học tới` : `Dành cho sau ngày ${passage.day} — vẫn đọc thử được`}
        </span>
        {record ? <span className="chip">Điểm cao nhất {record.bestAccuracy}%</span> : null}
      </div>
      <h1 className="mt-2" style={{ fontSize: 22 }}>{passage.title}</h1>
      <div className="card mt-3" style={{ background: '#FFFDF8' }}>
        <p className="jp reading-text">{passage.textJp}</p>
        <AudioButton text={passage.textJp} label="Nghe cả đoạn" className="btn ghost sm mt-3" showText />
      </div>
      <ReadingQuiz key={passage.id} passageId={passage.id} questions={passage.questions} textVi={passage.textVi}
        nextHref={nextId ? `/luyen-tap/doc/${nextId}` : null} />
    </>
  );
}
