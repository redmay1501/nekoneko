import Link from 'next/link';
import { AdminPageHeader, EmptyState } from '@/components/admin/AdminParts';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { ALL_LISTENING_VIDEOS, VIDEO_SOURCES, VIDEO_STYLE_LABELS } from '@/features/listening/video-library';

type Search = { q?: string; 'trang-thai'?: string; nguon?: string };

/**
 * Nghe & Video — thư viện video trong content/seed/listening-videos.json. Quy tắc giữ nguyên: chỉ video đã xác minh,
 * danh sách chính cần song ngữ (bilingual). Trang này xem + lọc; sửa qua tệp trong repo (có kiểm tra ở Kiểm tra chất lượng).
 */
export default async function AdminVideoPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage();
  const search = await searchParams;
  const query = (search.q ?? '').toLowerCase().trim();
  const videos = ALL_LISTENING_VIDEOS
    .filter((video) => !query || `${video.title} ${video.description} ${video.id}`.toLowerCase().includes(query))
    .filter((video) => !search['trang-thai'] || video.status === search['trang-thai'])
    .filter((video) => !search.nguon || video.source === search.nguon);
  const counts = { published: 0, review: 0, archived: 0 };
  for (const video of ALL_LISTENING_VIDEOS) counts[video.status] += 1;

  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Nghe & Video' }]} title={`Nghe & Video (${ALL_LISTENING_VIDEOS.length})`} />
      <div className="adm-notice info" style={{ marginBottom: 14 }}><span aria-hidden="true">🎧</span><div>
        Nguồn: <code>content/seed/listening-videos.json</code>. Người học chỉ thấy video <b>published</b> ({counts.published}); {counts.review} chờ duyệt, {counts.archived} lưu trữ.
        Quy tắc: chỉ video thật đã xác minh (verifiedAt), có cách học song ngữ Nhật – Việt, nhúng chỉ khi nguồn cho phép. Luyện Shadowing đã gỡ khỏi app ở bản trước.
      </div></div>
      <form className="adm-filters" method="get" role="search">
        <label className="adm-field"><span>Tìm</span><input className="adm-input" name="q" defaultValue={search.q ?? ''} placeholder="Tên video, mô tả, id" /></label>
        <label className="adm-field"><span>Trạng thái</span>
          <select className="adm-select" name="trang-thai" defaultValue={search['trang-thai'] ?? ''}>
            <option value="">Tất cả</option><option value="published">Đang hiện</option><option value="review">Chờ duyệt</option><option value="archived">Lưu trữ</option>
          </select></label>
        <label className="adm-field"><span>Nguồn</span>
          <select className="adm-select" name="nguon" defaultValue={search.nguon ?? ''}>
            <option value="">Tất cả</option>
            {Object.entries(VIDEO_SOURCES).map(([id, source]) => <option key={id} value={id}>{source.shortName}</option>)}
          </select></label>
        <button type="submit" className="adm-btn">Lọc</button>
      </form>
      {videos.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Video</th><th>Nguồn</th><th>Kiểu</th><th>Phụ đề</th><th>Song ngữ</th><th>Nhúng</th><th>Trạng thái</th><th>Xác minh</th></tr></thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td style={{ maxWidth: 320 }}><a className="adm-row-link" href={video.sourceUrl} target="_blank" rel="noreferrer">{video.title}</a>
                    {video.reviewReason ? <div className="adm-sm adm-muted">{video.reviewReason}</div> : null}</td>
                  <td className="adm-sm">{VIDEO_SOURCES[video.source].shortName}</td>
                  <td className="adm-sm">{VIDEO_STYLE_LABELS[video.style]}</td>
                  <td className="adm-sm">{[video.subtitles.ja ? 'Nhật' : '', video.subtitles.vi ? 'Việt' : '', ...video.subtitles.other].filter(Boolean).join(', ') || '—'}</td>
                  <td>{video.bilingual ? <span className="adm-badge published">{video.bilingual === 'switchable' ? 'Chuyển phụ đề' : 'Lời thoại trang nguồn'}</span> : <span className="adm-badge red">Chưa</span>}</td>
                  <td>{video.embeddable ? 'Có' : 'Mở nguồn'}</td>
                  <td><span className={`adm-badge ${video.status}`}>{video.status === 'published' ? 'Đang hiện' : video.status === 'review' ? 'Chờ duyệt' : 'Lưu trữ'}</span></td>
                  <td className="adm-sm">{video.verifiedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="adm-card"><EmptyState title="Không có video khớp bộ lọc"><Link className="adm-btn ghost sm" href="/admin/video">Bỏ lọc</Link></EmptyState></div>}
    </>
  );
}
