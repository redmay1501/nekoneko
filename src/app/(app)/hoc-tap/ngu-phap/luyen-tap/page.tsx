import Link from 'next/link';
import { GrammarExerciseRunner, type GrammarRunMode } from '@/components/learning/GrammarExerciseRunner';
import { buildGrammarExercises, exercisesFor } from '@/features/learning/grammar-exercises';
import { getLearnerContext } from '@/features/learning/learner-context';
import { lessonNumber } from '@/lib/utils/lesson';

const COUNT_OPTIONS = [10, 20] as const;
const MODES: ReadonlyArray<{ id: GrammarRunMode; label: string; hint: string }> = [
  { id: 'luyen-tap', label: '📝 Luyện tập', hint: 'Trả lời xong thấy ngay đúng/sai và giải thích.' },
  { id: 'kiem-tra', label: '✅ Kiểm tra', hint: 'Làm hết rồi nộp bài — sau khi nộp mới có điểm, đáp án và giải thích.' },
];

type Search = { bai?: string; mau?: string; 'che-do'?: string; 'so-cau'?: string };

/**
 * Luyện tập / kiểm tra ngữ pháp THEO TỪNG BÀI (hoặc một mẫu câu). Bài tập sinh từ câu ví dụ thật của mỗi mẫu
 * (features/learning/grammar-exercises). Số câu chọn = số câu hiện ra (bài ít câu hơn thì nói rõ). Không ghi trí nhớ.
 */
export default async function GrammarPracticePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { catalog } = await getLearnerContext();
  const grammar = catalog.content.grammar;
  const all = buildGrammarExercises(grammar);
  const mode: GrammarRunMode = params['che-do'] === 'kiem-tra' ? 'kiem-tra' : 'luyen-tap';
  const lessons = [...new Set(grammar.map((entry) => lessonNumber(entry.lesson)))].filter(Number.isFinite).sort((left, right) => left - right);
  const lesson = params.bai ? Number(params.bai) : undefined;
  const point = params.mau ? grammar.find((entry) => String(entry.id) === params.mau) : undefined;
  const requested = params['so-cau'] === 'tat-ca' ? Infinity : Number(params['so-cau']) || COUNT_OPTIONS[0];
  const href = (patch: Partial<Search>) => {
    const next = new URLSearchParams(Object.entries({ ...params, ...patch }).filter(([, value]) => value) as Array<[string, string]>);
    return `/hoc-tap/ngu-phap/luyen-tap?${next.toString()}`;
  };

  const scope = point ? { grammarId: point.id } : lesson && lessons.includes(lesson) ? { lesson } : null;
  const pool = scope ? exercisesFor(all, scope) : [];
  const exercises = pool.slice(0, Math.min(requested, pool.length));
  const scopeTitle = point ? `Mẫu “${point.pattern}”` : scope ? `Bài ${lesson}` : null;

  return (
    <>
      <Link href="/hoc-tap/ngu-phap" className="tiny muted">← Ngữ pháp</Link>
      <h1 className="mt-1">Luyện tập & kiểm tra ngữ pháp</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Chọn từng bài để luyện riêng. Bài tập lấy từ câu ví dụ của mỗi mẫu: chọn nghĩa, chọn câu tiếng Nhật, chọn trợ từ, sắp xếp câu.
      </p>

      <div className="segmented gx-mode" role="radiogroup" aria-label="Chế độ">
        {MODES.map((option) => (
          <Link key={option.id} href={href({ 'che-do': option.id })} role="radio" aria-checked={mode === option.id}
            className={`segmented-option${mode === option.id ? ' is-selected' : ''}`} scroll={false}>{option.label}</Link>
        ))}
      </div>
      <p className="tiny muted mt-1.5">{MODES.find((option) => option.id === mode)!.hint}</p>

      <div className="sec-h" style={{ margin: '14px 2px 8px' }}><h2 style={{ fontSize: 15 }}>Chọn bài</h2></div>
      <div className="gx-lessons" role="list">
        {lessons.map((number) => {
          const count = all.filter((exercise) => exercise.lesson === number).length;
          const isOn = !point && lesson === number;
          return (
            <Link key={number} role="listitem" href={href({ bai: String(number), mau: undefined })} scroll={false}
              className={`gx-lesson${isOn ? ' is-on' : ''}`} aria-current={isOn ? 'true' : undefined}>
              <b>Bài {number}</b><span>{count} câu</span>
            </Link>
          );
        })}
      </div>

      {scope ? (
        <>
          <div className="between mt-4" style={{ flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 16 }}>{scopeTitle} · {mode === 'kiem-tra' ? 'Kiểm tra' : 'Luyện tập'}</h2>
            <div className="row wrap" style={{ gap: 6 }} role="radiogroup" aria-label="Số câu">
              {COUNT_OPTIONS.filter((value) => value < pool.length).map((value) => (
                <Link key={value} href={href({ 'so-cau': String(value) })} scroll={false} role="radio" aria-checked={requested === value}
                  className={`chip ${requested === value ? 'pink' : ''}`}>{value} câu</Link>
              ))}
              <Link href={href({ 'so-cau': 'tat-ca' })} scroll={false} role="radio" aria-checked={exercises.length === pool.length}
                className={`chip ${exercises.length === pool.length ? 'pink' : ''}`}>Tất cả ({pool.length})</Link>
            </div>
          </div>
          {requested !== Infinity && requested > pool.length ? (
            <p className="tiny muted mt-1">Phần này chỉ có {pool.length} câu nên bài gồm {pool.length} câu.</p>
          ) : null}
          <div className="mt-3">
            <GrammarExerciseRunner key={`${mode}:${scopeTitle}:${exercises.length}`} exercises={exercises} mode={mode} title={scopeTitle ?? ''} />
          </div>
        </>
      ) : (
        <p className="card tight sm soft mt-4">Chọn một bài ở trên để bắt đầu.</p>
      )}
    </>
  );
}
