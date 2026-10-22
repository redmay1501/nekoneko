import Link from 'next/link';
import { ScrollToElementOnChange } from '@/components/common/ScrollToElementOnChange';
import { GrammarExerciseRunner } from '@/components/learning/GrammarExerciseRunner';
import { buildGrammarQuestionBank, exercisesFor } from '@/features/learning/grammar-exercises';
import { toContentKey } from '@/features/learning/knowledge-types';
import { getLearnerContext } from '@/features/learning/learner-context';
import { lessonNumber } from '@/lib/utils/lesson';

const COUNT_OPTIONS = [10, 20] as const;
type Scope = 'tat-ca' | 'theo-bai' | 'theo-mau' | 'da-hoc';
type Search = { bai?: string; mau?: string; pham?: string; 'so-cau'?: string };

const parseIds = (raw: string | undefined) => (raw ?? '').split(',').map(Number).filter(Number.isInteger);

/**
 * Luyện ngữ pháp từ ngân hàng: toàn bộ câu hỏi, theo bài Minna, theo từng mẫu tự chọn (?mau=1,5,9 — nút "Luyện mẫu này"
 * ở trang ngày / thẻ chi tiết mở sẵn đúng mẫu đó), hoặc các mẫu người học đã học.
 */
export default async function GrammarPracticePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { catalog, memoryViews } = await getLearnerContext();
  const grammar = catalog.content.grammar;
  const all = buildGrammarQuestionBank(grammar);
  const lessons = [...new Set(grammar.map((entry) => lessonNumber(entry.lesson)))].filter(Number.isFinite).sort((a, b) => a - b);
  const selectedLessons = parseIds(params.bai).filter((number) => lessons.includes(number));
  const selectedLessonSet = new Set(selectedLessons);
  const selectedPatterns = parseIds(params.mau).filter((id) => grammar.some((entry) => entry.id === id)).sort((a, b) => a - b);
  const selectedPatternSet = new Set(selectedPatterns);
  const scope: Scope = params.pham === 'theo-mau' || selectedPatterns.length ? 'theo-mau'
    : params.pham === 'theo-bai' || selectedLessons.length ? 'theo-bai'
    : params.pham === 'da-hoc' ? 'da-hoc' : 'tat-ca';
  const learnedIds = new Set(grammar.filter((entry) => memoryViews.get(toContentKey('grammar', entry.id))?.isLearned).map((entry) => entry.id));
  const pool = scope === 'theo-mau'
    ? exercisesFor(all.filter((exercise) => selectedPatternSet.has(exercise.grammarId)), {}, `mau-${selectedPatterns.join('.')}`)
    : scope === 'theo-bai'
      ? exercisesFor(all.filter((exercise) => selectedLessonSet.has(exercise.lesson)), {})
      : scope === 'da-hoc'
        ? all.filter((exercise) => learnedIds.has(exercise.grammarId))
        : exercisesFor(all, {});
  const requested = params['so-cau'] === 'tat-ca' ? Infinity : Number(params['so-cau']) || COUNT_OPTIONS[0];
  const exercises = pool.slice(0, Math.min(requested, pool.length));
  const onlyPattern = selectedPatterns.length === 1 ? grammar.find((entry) => entry.id === selectedPatterns[0]) : undefined;
  const scopeTitle = scope === 'theo-mau'
    ? onlyPattern ? `Mẫu “${onlyPattern.pattern}”` : `${selectedPatterns.length} mẫu đã chọn`
    : scope === 'theo-bai' ? `${selectedLessons.length === 1 ? 'Bài' : 'Các bài'} ${selectedLessons.join(', ')}`
    : scope === 'da-hoc' ? 'Các mẫu đã học' : 'Toàn bộ ngân hàng';
  const hasSelection = scope === 'theo-mau' ? selectedPatterns.length > 0 : scope === 'theo-bai' ? selectedLessons.length > 0 : true;

  function href(patch: Partial<Search>) {
    const next: Record<string, string> = {};
    const nextScope = patch.pham ?? scope;
    if (nextScope !== 'tat-ca') next.pham = nextScope;
    const nextLesson = 'bai' in patch ? patch.bai : params.bai;
    const nextPattern = 'mau' in patch ? patch.mau : params.mau;
    const nextCount = 'so-cau' in patch ? patch['so-cau'] : params['so-cau'];
    if (nextScope === 'theo-bai' && nextLesson) next.bai = nextLesson;
    if (nextScope === 'theo-mau' && nextPattern) next.mau = nextPattern;
    if (nextCount) next['so-cau'] = nextCount;
    const query = new URLSearchParams(next);
    return `/hoc-tap/ngu-phap/luyen-tap${query.size ? `?${query}` : ''}`;
  }

  const learnedCount = all.filter((exercise) => learnedIds.has(exercise.grammarId)).length;
  const questionCount = (grammarId: number) => all.filter((exercise) => exercise.grammarId === grammarId).length;
  // Mẫu xếp theo bài Minna (rồi theo id) — người học tìm mẫu theo bài đang học.
  const patternGroups = [...new Set(grammar.map((entry) => entry.lesson))]
    .sort((left, right) => lessonNumber(left) - lessonNumber(right))
    .map((lesson) => ({ lesson, points: grammar.filter((entry) => entry.lesson === lesson && questionCount(entry.id)).sort((a, b) => a.id - b.id) }))
    .filter((group) => group.points.length);

  return (
    <>
      <Link href="/hoc-tap/ngu-phap" className="tiny muted">← Ngữ pháp</Link>
      <h1 className="mt-1">Luyện tập ngữ pháp</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Chọn phạm vi câu hỏi: toàn bộ ngân hàng, theo bài Minna, từng mẫu bạn muốn luyện, hoặc các mẫu bạn đã học.
      </p>

      <div className="segmented gx-mode" role="radiogroup" aria-label="Phạm vi luyện tập">
        {([
          ['tat-ca', `Tất cả (${all.length})`],
          ['theo-bai', 'Theo bài'],
          ['theo-mau', 'Theo mẫu'],
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
                href={href({ bai: nextLessons.join(',') })} scroll={false}
                className={`gx-lesson${isOn ? ' is-on' : ''}`}>
                <b>Bài {number}</b><span>{count} câu</span>
              </Link>;
            })}
          </div>
          {selectedLessons.length > 1 ? <p className="tiny muted mt-2">Đang chọn {selectedLessons.length} bài · {pool.length} câu</p> : null}
        </>
      ) : null}

      {scope === 'theo-mau' ? (
        <>
          <div className="sec-h" style={{ margin: '14px 2px 8px' }}>
            <h2 style={{ fontSize: 15 }}>Chọn mẫu ngữ pháp muốn luyện</h2>
            {selectedPatterns.length ? <Link className="tiny link" href={href({ mau: undefined })} scroll={false}>Bỏ chọn ({selectedPatterns.length})</Link> : null}
          </div>
          <div className="gx-patterns">
            {patternGroups.map((group) => (
              <section key={group.lesson} className="gx-pattern-group">
                <p className="tiny muted">{group.lesson}</p>
                <div className="gx-pattern-list" role="list">
                  {group.points.map((point) => {
                    const isOn = selectedPatternSet.has(point.id);
                    const nextPatterns = isOn ? selectedPatterns.filter((id) => id !== point.id) : [...selectedPatterns, point.id].sort((a, b) => a - b);
                    return <Link key={point.id} role="checkbox" aria-checked={isOn} title={point.usage}
                      href={href({ mau: nextPatterns.join(',') || undefined })} scroll={false}
                      className={`gx-pattern${isOn ? ' is-on' : ''}`}>
                      <span className="jp">{point.pattern}</span><small>{questionCount(point.id)} câu</small>
                    </Link>;
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}

      {scope === 'da-hoc' && !learnedCount ? <p className="card tight sm soft mt-4">Bạn chưa có mẫu ngữ pháp đã học. Học một mẫu trước, rồi quay lại luyện nhé.</p> : null}
      {!hasSelection ? (
        <p className="card tight sm soft mt-4">{scope === 'theo-mau' ? 'Chọn một hoặc nhiều mẫu ngữ pháp để bắt đầu luyện.' : 'Chọn một hoặc nhiều bài Minna để bắt đầu luyện.'}</p>
      ) : null}

      {pool.length && hasSelection ? (
        <>
          {scope === 'theo-bai' || scope === 'theo-mau' ? (
            <ScrollToElementOnChange targetId="grammar-practice-heading" trigger={`${selectedLessons.join(',')}|${selectedPatterns.join(',')}`} />
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
          <div className="mt-3"><GrammarExerciseRunner key={`${scopeTitle}:${selectedPatterns.join('.')}:${exercises.length}`} exercises={exercises}
            pool={pool} questionCount={exercises.length}
            scopeKey={`${scope}:${selectedLessons.join('.')}:${selectedPatterns.join('.')}:${exercises.length}`}
            mode="luyen-tap" title={scopeTitle} /></div>
        </>
      ) : null}
    </>
  );
}
