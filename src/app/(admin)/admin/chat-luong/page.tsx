import Link from 'next/link';
import { AdminPageHeader, EmptyState } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { loadAdminContent } from '@/features/admin/content-admin';
import { runQualityChecks } from '@/features/admin/quality-checks';
import { ALL_LISTENING_VIDEOS } from '@/features/listening/video-library';

/** Kiểm tra chất lượng: chỉ đọc và báo, không tự sửa. Mỗi dòng dẫn tới chỗ sửa. */
export default async function AdminQualityPage({ searchParams }: { searchParams: Promise<{ muc?: string; loai?: string }> }) {
  await requireAdminPage();
  const search = await searchParams;
  const all = runQualityChecks(await loadAdminContent(), ALL_LISTENING_VIDEOS);
  const areas = [...new Set(all.map((issue) => issue.area))];
  const issues = all.filter((issue) => (!search.muc || issue.area === search.muc) && (!search.loai || issue.severity === search.loai));
  const errors = all.filter((issue) => issue.severity === 'error').length;
  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Kiểm tra chất lượng' }]} title="Kiểm tra chất lượng" />
      <p className="adm-sm" style={{ marginBottom: 12 }}><b style={{ color: errors ? '#B0213A' : '#2F7A3A' }}>{errors} lỗi</b> · {all.length - errors} cảnh báo · kiểm tra từ dữ liệu hiện tại (gồm cả mục nháp).</p>
      <form className="adm-filters" method="get">
        <label className="adm-field"><span>Mục</span>
          <select className="adm-select" name="muc" defaultValue={search.muc ?? ''}><option value="">Tất cả</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
        <label className="adm-field"><span>Mức</span>
          <select className="adm-select" name="loai" defaultValue={search.loai ?? ''}><option value="">Tất cả</option><option value="error">Lỗi</option><option value="warning">Cảnh báo</option></select></label>
        <button type="submit" className="adm-btn">Lọc</button>
      </form>
      {issues.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Mức</th><th>Mục</th><th>Vấn đề</th><th /></tr></thead>
            <tbody>
              {issues.map((issue, index) => (
                <tr key={`${issue.message}-${index}`}>
                  <td>{issue.severity === 'error' ? <span className="adm-badge red">Lỗi</span> : <span className="adm-badge review">Cảnh báo</span>}</td>
                  <td className="adm-sm">{issue.area}</td>
                  <td className="adm-sm adm-jp" style={{ fontFamily: 'inherit' }}>{issue.message}</td>
                  <td>{issue.href ? <Link className="adm-btn ghost sm" href={issue.href}>Sửa</Link> : <span className="adm-sm adm-muted">sửa trong repo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="adm-card"><EmptyState title="Không có vấn đề nào 🎉" /></div>}
    </>
  );
}
