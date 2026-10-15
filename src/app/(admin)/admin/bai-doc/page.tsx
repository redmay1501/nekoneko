import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { loadAdminContent } from '@/features/admin/content-admin';

/**
 * Bài đọc hiểu — app học đọc từ tệp content/seed/reading-passages.json (có tiêu đề + bản dịch; bảng reading_passages
 * trong database chưa có hai cột này). Vì vậy ở đây CHỈ XEM + kiểm tra; sửa qua tệp trong repo.
 */
export default async function AdminReadingPage({ searchParams }: { searchParams: Promise<{ bai?: string }> }) {
  await requireAdminPage();
  const passages = (await loadAdminContent()).readingPassages;
  const selectedId = Number((await searchParams).bai) || passages[0]?.id;
  const selected = passages.find((passage) => passage.id === selectedId);
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Bài đọc' }]} title={`Bài đọc (${passages.length})`} />
      <div className="adm-notice info" style={{ marginBottom: 14 }}><span aria-hidden="true">📄</span><div>
        Nguồn: tệp <code>content/seed/reading-passages.json</code> trong repo (bảng <code>reading_passages</code> chưa có tiêu đề / bản dịch nên app không đọc bảng đó).
        Trang này chỉ xem và kiểm tra. Muốn sửa trên web cần chuyển bài đọc sang database (migration thêm cột) — chưa làm.
      </div></div>
      <div className="adm-two">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>#</th><th>Tên bài</th><th>Ngày</th><th>Bài</th><th>Câu hỏi</th></tr></thead>
            <tbody>
              {passages.map((passage) => (
                <tr key={passage.id} aria-current={passage.id === selectedId ? 'true' : undefined} style={passage.id === selectedId ? { background: 'var(--adm-pink-2)' } : undefined}>
                  <td className="adm-muted">{passage.id}</td>
                  <td><Link className="adm-row-link" href={`/admin/bai-doc?bai=${passage.id}`}>{passage.title || '(chưa có tên)'}</Link></td>
                  <td>{passage.day}</td><td className="adm-sm">{passage.lesson}</td><td>{passage.questions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected ? (
          <section className="adm-card">
            <h2>{selected.title}</h2>
            <p className="adm-sm adm-muted">Ngày {selected.day} · {selected.lesson}</p>
            <p className="adm-jp" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, marginTop: 10, fontSize: 17 }}>{selected.textJp}</p>
            <details style={{ marginTop: 8 }}><summary className="adm-sm">Bản dịch</summary><p className="adm-sm" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{selected.textVi || '—'}</p></details>
            <h2 style={{ marginTop: 14 }}>Câu hỏi</h2>
            <ol className="adm-list" style={{ listStyle: 'decimal', paddingLeft: 18 }}>
              {selected.questions.map((question, index) => (
                <li key={index} style={{ display: 'list-item' }}>
                  <span className="adm-jp">{question.question}</span>
                  <ul style={{ marginTop: 4 }}>{question.options.map((option, optionIndex) => (
                    <li key={optionIndex} className="adm-sm" style={{ fontWeight: optionIndex === question.correctIndex ? 700 : 400, color: optionIndex === question.correctIndex ? '#2F7A3A' : undefined }}>
                      {optionIndex === question.correctIndex ? '✓ ' : '· '}{option}
                    </li>
                  ))}</ul>
                </li>
              ))}
            </ol>
            <p style={{ marginTop: 12 }}><Link className="adm-btn ghost sm" href={`/luyen-tap/doc/${selected.id}`}>Mở trong app học ↗</Link></p>
          </section>
        ) : null}
      </div>
    </>
  );
}
