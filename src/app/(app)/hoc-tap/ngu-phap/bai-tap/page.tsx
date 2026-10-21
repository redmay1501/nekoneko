import Link from 'next/link';
import { GrammarDrillRunner } from '@/components/learning/GrammarDrillRunner';
import { GRAMMAR_DRILL_TYPES, type GrammarDrillType, buildGrammarDrills, drillsOfLesson, drillsOfPattern } from '@/features/learning/grammar-drills';
import { getLearnerContext } from '@/features/learning/learner-context';

type Search = { bai?: string; mau?: string; dang?: string };

/**
 * Bài tập luyện tập ngữ pháp (luyện thay thế · biến đổi câu · hỏi đáp · hội thoại) — 8 bài × 25 bài học.
 * Lọc theo bài (?bai=), theo mẫu (?mau= — nút "Bài tập" ở thẻ mẫu ngữ pháp) và theo dạng bài (?dang=).
 */
export default async function GrammarDrillsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { catalog } = await getLearnerContext();
  const grammar = catalog.content.grammar;
  const all = buildGrammarDrills(grammar);
  const lessons = [...new Set(all.map((drill) => drill.grammar_lesson))].sort((a, b) => a - b);
  const point = params.mau ? grammar.find((entry) => String(entry.id) === params.mau) : undefined;
  const lesson = !point && params.bai ? Number(params.bai) : NaN;
  const type = GRAMMAR_DRILL_TYPES.some((item) => item.id === params.dang) ? params.dang as GrammarDrillType : null;
  const scoped = point ? drillsOfPattern(all, point.id) : lessons.includes(lesson) ? drillsOfLesson(all, lesson) : [];
  const drills = type ? scoped.filter((drill) => drill.type === type) : scoped;

  const href = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    return `/hoc-tap/ngu-phap/bai-tap${next.size ? `?${next}` : ''}`;
  };

  return (
    <>
      <Link href="/hoc-tap/ngu-phap" className="tiny muted">← Ngữ pháp</Link>
      <h1 className="mt-1">Bài tập ngữ pháp</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Luyện thay thế, biến đổi câu, hỏi đáp và hội thoại — mỗi bài học có 8 bài tập. Gõ câu trả lời bằng chữ Nhật (gõ toàn kana cũng được).
      </p>

      {point ? (
        <p className="sm">Mẫu <b className="jp">{point.pattern}</b> · <Link className="link" href="/hoc-tap/ngu-phap/bai-tap">Chọn bài khác</Link></p>
      ) : (
        <>
          <div className="sec-h" style={{ margin: '10px 2px 8px' }}><h2 style={{ fontSize: 15 }}>Chọn bài học</h2></div>
          <div className="gx-lessons" role="list">
            {lessons.map((number) => (
              <Link key={number} role="listitem" href={href({ bai: String(number), mau: undefined })} scroll={false}
                aria-current={number === lesson ? 'true' : undefined} className={`gx-lesson${number === lesson ? ' is-on' : ''}`}>
                <b>Bài {number}</b><span>{drillsOfLesson(all, number).length} bài tập</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {scoped.length ? (
        <>
          <div className="segmented gx-mode mt-4" role="radiogroup" aria-label="Dạng bài tập">
            <Link href={href({ dang: undefined })} scroll={false} role="radio" aria-checked={!type} className={`segmented-option${!type ? ' is-selected' : ''}`}>Tất cả</Link>
            {GRAMMAR_DRILL_TYPES.filter((item) => scoped.some((drill) => drill.type === item.id)).map((item) => (
              <Link key={item.id} href={href({ dang: item.id })} scroll={false} role="radio" aria-checked={type === item.id}
                className={`segmented-option${type === item.id ? ' is-selected' : ''}`}>{item.label}</Link>
            ))}
          </div>
          <div className="mt-3"><GrammarDrillRunner key={`${point?.id ?? lesson}:${type ?? 'all'}`} drills={drills} /></div>
        </>
      ) : (
        <p className="card tight sm soft mt-4">{point ? 'Mẫu này chưa có bài tập riêng — thử luyện theo bài học.' : 'Chọn một bài học để bắt đầu.'}</p>
      )}
    </>
  );
}
