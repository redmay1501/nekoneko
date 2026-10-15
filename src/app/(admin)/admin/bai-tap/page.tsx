import { AdminPageHeader, EmptyState } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { loadAdminContent } from '@/features/admin/content-admin';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { CONTENT_TYPE_LABELS, type ContentType } from '@/features/learning/knowledge-types';
import { buildLearningSession } from '@/features/learning/session-engine';
import { questionProgress, type SessionStepWithAnswer } from '@/features/learning/session-types';
import { pickTestKeys, QUESTION_COUNTS, questionCountFor } from '@/features/learning/test-selection';

type Search = { loai?: string; tu?: string; den?: string; so?: string };
const TYPES: ContentType[] = ['vocabulary', 'kanji', 'radical', 'grammar', 'hiragana', 'katakana'];

function describeStep(step: SessionStepWithAnswer): { prompt: string; options: string[]; answer: string | null } {
  switch (step.type) {
    case 'recall': return { prompt: `${step.face} — ${step.question}`, options: step.options, answer: step.correctAnswer };
    case 'use': return { prompt: step.variant === 'fill-blank' ? `${step.sentenceJp} (${step.promptVi})` : step.promptVi, options: step.options, answer: step.correctAnswer };
    case 'surprise': return { prompt: `${step.face} — ${step.meaning}`, options: [], answer: null };
    default: return { prompt: '', options: [], answer: null };
  }
}

/**
 * Bài tập & Kiểm tra: câu hỏi được SINH từ nội dung (không có bảng câu hỏi riêng). Trang này dựng thử đúng như
 * "Kiểm tra" trong app (chọn N mục → phiên focus) để admin xem câu hỏi và xác nhận số câu = số đã chọn.
 * Không lưu phiên, không ghi trí nhớ.
 */
export default async function AdminQuestionBankPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage();
  const search = await searchParams;
  const type = (TYPES as string[]).includes(search.loai ?? '') ? (search.loai as ContentType) : 'vocabulary';
  const from = Math.min(Math.max(Number(search.tu) || 1, 1), 90);
  const to = Math.min(Math.max(Number(search.den) || 90, from), 90);
  const requested = (QUESTION_COUNTS as readonly number[]).includes(Number(search.so)) ? Number(search.so) : 10;

  const catalog = buildKnowledgeCatalog(await loadAdminContent());
  const pool = catalog.items.filter((item) => item.type === type && item.day !== null && item.day >= from && item.day <= to).map((item) => item.key);
  const count = questionCountFor(requested, pool.length);
  const keys = pickTestKeys(pool, count);
  const session = keys.length ? buildLearningSession({ mode: 'focus', seed: `admin-preview-${type}-${from}-${to}-${count}`, catalog, memoryViews: new Map(), journeyDay: 90, focusKeys: keys }) : null;
  const questions = session ? session.steps.filter((step) => step.type !== 'discover') : [];
  const total = session ? questionProgress(session.steps, 0).total : 0;

  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Bài tập & Kiểm tra' }]} title="Bài tập & Kiểm tra" />
      <div className="adm-notice info" style={{ marginBottom: 14 }}><span aria-hidden="true">✅</span><div>
        Câu hỏi được sinh tự động từ nội dung (từ vựng, kanji, bộ thủ, ngữ pháp, chữ cái) — sửa nội dung là sửa câu hỏi.
        Số câu mỗi lần: {QUESTION_COUNTS.join(' / ')}. Có test hồi quy đảm bảo chọn 5 / 10 / 20 câu thì ra đúng 5 / 10 / 20 câu (<code>test-selection.test.ts</code>).
      </div></div>
      <form className="adm-filters" method="get">
        <label className="adm-field"><span>Loại</span>
          <select className="adm-select" name="loai" defaultValue={type}>{TYPES.map((value) => <option key={value} value={value}>{CONTENT_TYPE_LABELS[value]}</option>)}</select></label>
        <label className="adm-field"><span>Từ ngày</span><input className="adm-input" style={{ width: 90 }} type="number" min={1} max={90} name="tu" defaultValue={from} /></label>
        <label className="adm-field"><span>Đến ngày</span><input className="adm-input" style={{ width: 90 }} type="number" min={1} max={90} name="den" defaultValue={to} /></label>
        <label className="adm-field"><span>Số câu</span>
          <select className="adm-select" name="so" defaultValue={requested}>{QUESTION_COUNTS.map((value) => <option key={value} value={value}>{value} câu</option>)}</select></label>
        <button type="submit" className="adm-btn">Dựng thử</button>
      </form>
      <section className="adm-card">
        <h2>Kết quả: {total} câu {total === requested ? <span className="adm-badge published">đúng số đã chọn</span> : <span className="adm-badge review">phạm vi chỉ có {pool.length} mục</span>}</h2>
        <p className="adm-sm adm-muted" style={{ marginBottom: 10 }}>Kho: {pool.length} {CONTENT_TYPE_LABELS[type].toLowerCase()} (ngày {from}–{to}). Đáp án đúng in đậm.</p>
        {questions.length ? (
          <ol className="adm-list" style={{ listStyle: 'decimal', paddingLeft: 20 }}>
            {questions.map((step) => {
              const view = describeStep(step);
              return (
                <li key={step.stepIndex} style={{ display: 'list-item' }}>
                  <span className="adm-jp">{view.prompt}</span>
                  {view.options.length ? <div className="adm-sm" style={{ marginTop: 3 }}>{view.options.map((option) => (
                    <span key={option} style={{ marginRight: 12, fontWeight: option === view.answer ? 700 : 400, color: option === view.answer ? '#2F7A3A' : undefined }}>{option === view.answer ? '✓ ' : ''}{option}</span>
                  ))}</div> : null}
                </li>
              );
            })}
          </ol>
        ) : <EmptyState title="Không có mục nào trong phạm vi này" />}
      </section>
    </>
  );
}
