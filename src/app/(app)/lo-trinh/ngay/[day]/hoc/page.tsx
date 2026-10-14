import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DayStudyFlow } from '@/components/day-study/DayStudyFlow';
import { STUDY_STEPS, type StudyStepId } from '@/features/learning/day-study-quiz';
import { buildDayStudy } from '@/features/learning/day-study';
import { getLearnerContext } from '@/features/learning/learner-context';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';

/** Học theo ngày: Từ vựng → Ngữ pháp → Kanji → Ôn tập, mỗi bước có thẻ học + bài quiz. */
export default async function DayStudyPage({ params, searchParams }: {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ buoc?: string; 'che-do'?: string }>;
}) {
  const day = Number((await params).day);
  if (!Number.isInteger(day) || day < 1 || day > JOURNEY_TOTAL_DAYS) notFound();
  const { buoc, 'che-do': mode } = await searchParams;

  const { catalog, journey, memoryViews } = await getLearnerContext();
  const data = buildDayStudy(catalog, day, journey, memoryViews);
  const hasStudy = data.vocab.length + data.grammar.length + data.kanji.length + data.radicals.length > 0;
  const initialStep = (STUDY_STEPS.find((step) => step.id === buoc)?.id ?? 'tu-vung') as StudyStepId;

  return (
    <>
      <Link className="link" href={`/lo-trinh/ngay/${day}`}>← Ngày {day}</Link>
      <header className="mt-2">
        <h1 style={{ fontSize: 22 }}>Học ngày {day}</h1>
        <p className="sm soft">{data.title}</p>
      </header>
      {hasStudy ? (
        <div className="mt-3"><DayStudyFlow data={data} initialStep={initialStep} initialMode={mode ?? ''} /></div>
      ) : (
        <div className="card mt-3">
          <p className="sm">Ngày {day} không có từ vựng, ngữ pháp, bộ thủ hay Kanji mới để học.</p>
          <Link className="btn ghost sm mt-3" href={`/lo-trinh/ngay/${day}`}>← Về trang ngày</Link>
        </div>
      )}
    </>
  );
}
