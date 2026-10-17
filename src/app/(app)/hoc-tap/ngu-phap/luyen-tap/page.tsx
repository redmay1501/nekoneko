import Link from 'next/link';
import { ScrollToElementOnChange } from '@/components/common/ScrollToElementOnChange';
import { GrammarExerciseRunner } from '@/components/learning/GrammarExerciseRunner';
import { buildGrammarQuestionBank, exercisesFor } from '@/features/learning/grammar-exercises';
import { toContentKey } from '@/features/learning/knowledge-types';
import { getLearnerContext } from '@/features/learning/learner-context';
import { lessonNumber } from '@/lib/utils/lesson';

const COUNT_OPTIONS = [10, 20] as const;
type Scope = 'tat-ca' | 'theo-bai' | 'da-hoc';
type Search = { bai?: string; mau?: string; pham?: string; 'so-cau'?: string };

/** Luyện ngữ pháp từ ngân hàng: toàn bộ câu hỏi, một bài Minna, hoặc các mẫu người học đã học. */
export default async function GrammarPracticePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { catalog, memoryViews } = await getLearnerContext();
  const grammar = catalog.content.grammar;
  const all = buildGrammarQuestionBank(grammar);
  const lessons = [...new Set(grammar.map((entry) => lessonNumber(entry.lesson)))].filter(Number.isFinite).sort((a, b) => a - b);
  const point = params.mau ? grammar.find((entry) => String(entry.id) === params.mau) : undefined;
  const selectedLessons = (params.bai ?? '').split(',').map(Number).filter((number) => lessons.includes(number));
  const selectedLessonSet = new Set(selectedLessons);
  const scope: Scope = point ? 'theo-bai' : params.pham === 'theo-bai' || selectedLessons.length ? 'theo-bai' : params.pham === 'da-hoc' ? 'da-hoc' : 'tat-ca';
  const learnedIds = new Set(grammar.filter((entry) => memoryViews.get(toContentKey('grammar', entry.id))?.isLearned).map((entry) => entry.id));
  const pool = point
    ? exercisesFor(all, { grammarId: point.id })
    : scope === 'theo-bai' && selectedLessons.length
      ? exercisesFor(all.filter((exercise) => selectedLessonSet.has(exercise.lesson)), {})
      : scope === 'da-hoc'
        ? all.filter((exercise) => learnedIds.has(exercise.grammarId))
        : exercisesFor(all, {});
  const requested = params['so-cau'] === 'tat-ca' ? Infinity : Number(params['so-cau']) || COUNT_OPTIONS[0];
  const exercises = pool.slice(0, Math.min(requested, pool.length));
  const scopeTitle = point ? `Mẫu “${point.pattern}”` : scope === 'theo-bai' && selectedLessons.length
    ? `${selectedLessons.length === 1 ? 'Bài' : 'Các bài'} ${selectedLessons.join(', ')}`
    : scope === 'da-hoc' ? 'Các mẫu đã học' : 'Toàn bộ ngân hàng';

  function href(patch: Partial<Search>) {
    const next: Record<string, string> = {};
    const nextScope = patch.pham ?? (patch.bai || patch.mau ? 'theo-bai' : params.pham ?? 'tat-ca');
    if (nextScope !== 'tat-ca') next.pham = nextScope;
    const nextLesson = 'bai' in patch ? patch.bai : patch.mau ? undefined : params.bai;
    const nextPattern = 'mau' in patch ? patch.mau : patch.bai ? undefined : params.mau;
    const nextCount = 'so-cau' in patch ? patch['so-cau'] : params['so-cau'];
    if (nextLesson) next.bai = nextLesson;
    if (nextPattern) next.mau = nextPattern;
    if (nextCount) next['so-cau'] = nextCount;
    const query = new URLSearchParams(next);
    return `/hoc-tap/ngu-phap/luyen-tap${query.size ? `?${query}` : ''}`;
  }

  const learnedCount = all.filter((exercise) => learnedIds.has(exercise.grammarId)).length;

  return (
    <>
      <Link href="/hoc-tap/ngu-phap" className="tiny muted">← Ngữ pháp</Link>
      <h1 className="mt-1">Luyện tập ngữ pháp</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Chọn phạm vi câu hỏi: toàn bộ ngân hàng, theo bài Minna hoặc các mẫu bạn đã học.
      </p>

      {!point ? (
        <>
          <div className="segmented gx-mode" role="radiogroup" aria-label="Phạm vi luyện tập">
            {([
              ['tat-ca', `Tất cả (${all.length})`],
              ['theo-bai', 'Theo bài'],
              ['da-hoc', `Đã học (${learnedCount})`],
            ] as const).map(([id, label]) => (
              <Link key={id} href={href({ pham: id, bai: undefined, mau: undefined, 'so-cau': undefined })}
                role="radio" aria-checked={scope === id} className={`segmented-option${scope === id ? ' is-selected' : ''}`} scroll={false}>{label}</Link>
            ))}
          </div>
          {scope === 'theo-bai' ? (
            <>
              <div className="sec-h" style={{ margin: '14px 2px 8px' }}><h2 style={{ fontSize: 15 }}>Chọn một hoặc nhiều bài Minna</h2></div>
              <div className="gx-lessons" role="list">
                {lessons.map((number) => {
                  const count = all.filter((exercise) => exercise.lesson === number).length;
                  const isOn = selectedLessonSet.has(number);
                  const nextLessons = isOn ? selectedLessons.filter((selected) => selected !== number) : [...selectedLessons, number].sort((a, b) => a - b);
                  return <Link key={number} role="checkbox" aria-checked={isOn}
                    href={href({ pham: 'theo-bai', bai: nextLessons.join(','), mau: undefined })} scroll={false}
                    className={`gx-lesson${isOn ? ' is-on' : ''}`}>
                    <b>Bài {number}</b><span>{count} câu</span>
                  </Link>;
                })}
              </div>
              {selectedLessons.length > 1 ? <p className="tiny muted mt-2">Đang chọn {selectedLessons.length} bài · {pool.length} câu</p> : null}
            </>
          ) : null}
          {scope === 'da-hoc' && !learnedCount ? <p className="card tight sm soft mt-4">Bạn chưa có mẫu ngữ pháp đã học. Học một mẫu trước, rồi quay lại luyện nhé.</p> : null}
        </>
      ) : null}

      {scope === 'theo-bai' && !point && !selectedLessons.length ? <p className="card tight sm soft mt-4">Chọn một hoặc nhiều bài Minna để bắt đầu luyện.</p> : null}
      {pool.length && (point || scope !== 'theo-bai' || selectedLessons.length) ? (
        <>
          {scope === 'theo-bai' && selectedLessons.length ? (
            <ScrollToElementOnChange targetId="grammar-practice-heading" trigger={selectedLessons.join(',')} />
          ) : null}
          <div className="between mt-4" style={{ flexWrap: 'wrap', gap: 8 }}>
            <h2 id="grammar-practice-heading" style={{ fontSize: 16 }}>{scopeTitle} · Luyện tập</h2>
            <div className="row wrap" style={{ gap: 6 }} role="radiogroup" aria-label="Số câu">
              {COUNT_OPTIONS.filter((value) => value < pool.length).map((value) => (
                <Link key={value} href={href({ 'so-cau': String(value) })} scroll={false} role="radio" aria-checked={requested === value}
                  className={`chip ${requested === value ? 'pink' : ''}`}>{value} câu</Link>
              ))}
              <Link href={href({ 'so-cau': 'tat-ca' })} scroll={false} role="radio" aria-checked={exercises.length === pool.length}
                className={`chip ${exercises.length === pool.length ? 'pink' : ''}`}>Tất cả ({pool.length})</Link>
            </div>
          </div>
          {requested !== Infinity && requested > pool.length ? <p className="tiny muted mt-1">Phạm vi này có {pool.length} câu nên bài gồm {pool.length} câu.</p> : null}
          <div className="mt-3"><GrammarExerciseRunner key={`${scopeTitle}:${exercises.length}`} exercises={exercises} mode="luyen-tap" title={scopeTitle} /></div>
        </>
      ) : null}
    </>
  );
}
