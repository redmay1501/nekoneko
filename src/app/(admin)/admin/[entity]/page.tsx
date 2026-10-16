import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader, DemoNotice, EmptyState, Pager, StatusBadge } from '@/components/admin/AdminParts';
import { CreateEntityButton, RowActions } from '@/components/admin/ContentListActions';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { loadEntityRecords } from '@/features/admin/content-admin';
import { CONTENT_STATUSES, type ContentStatus, ENTITY_BY_SLUG, ENTITY_CONFIG, filterRows, lessonOptions, STATUS_LABELS } from '@/features/admin/content-entities';

type Search = Record<string, string | undefined>;

/** Danh sách nội dung: tìm kiếm, lọc (ngày, bài, trạng thái, ảnh), phân trang — form GET, chạy được cả khi chưa tải JS. */
export default async function AdminEntityListPage({ params, searchParams }: { params: Promise<{ entity: string }>; searchParams: Promise<Search> }) {
  const admin = await requireAdminPage();
  const entity = ENTITY_BY_SLUG[(await params).entity];
  if (!entity) notFound();
  const config = ENTITY_CONFIG[entity];
  const search = await searchParams;
  const records = await loadEntityRecords(entity);
  const status = (CONTENT_STATUSES as readonly string[]).includes(search['trang-thai'] ?? '') ? (search['trang-thai'] as ContentStatus) : 'all';
  const dayParam = search.ngay ?? '';
  const result = filterRows(entity, records, {
    q: search.q ?? '', day: dayParam === 'none' ? null : dayParam ? Number(dayParam) : undefined, lesson: search.bai ?? '', status,
    image: search.anh === 'co' ? 'with' : search.anh === 'khong' ? 'without' : 'all', page: Number(search.trang ?? 1),
  });
  const lessons = config.hasLesson ? lessonOptions(records.map((record) => record.row)) : [];
  const hrefFor = (page: number) => {
    const query = new URLSearchParams(Object.entries(search).filter((entry): entry is [string, string] => Boolean(entry[1]) && entry[0] !== 'trang'));
    query.set('trang', String(page));
    return `/admin/${config.slug}?${query}`;
  };
  const hasFilters = Boolean(search.q || dayParam || search.bai || search['trang-thai'] || search.anh);

  return (
    <>
      <AdminPageHeader crumbs={[{ label: config.label }]} title={`${config.label} (${records.length})`}
        actions={<>
          <Link className="adm-btn ghost" href={`/admin/${config.slug}/anh`}>🖼️ Quản lý ảnh</Link>
          <CreateEntityButton entity={entity} isDemo={admin.isDemo} />
        </>} />
      {admin.isDemo ? <DemoNotice /> : null}
      <form className="adm-filters" method="get" role="search" style={{ marginTop: 12 }}>
        <label className="adm-field"><span>Tìm</span>
          <input className="adm-input" name="q" defaultValue={search.q ?? ''} placeholder={`Chữ, cách đọc, nghĩa, id…`} />
        </label>
        <label className="adm-field"><span>Ngày</span>
          <select className="adm-select" name="ngay" defaultValue={dayParam}>
            <option value="">Mọi ngày</option>
            <option value="none">Chưa gắn ngày</option>
            {Array.from({ length: 90 }, (_, index) => <option key={index + 1} value={index + 1}>Ngày {index + 1}</option>)}
          </select>
        </label>
        {config.hasLesson ? (
          <label className="adm-field"><span>Bài</span>
            <select className="adm-select" name="bai" defaultValue={search.bai ?? ''}>
              <option value="">Mọi bài</option>
              {lessons.map((lesson) => <option key={lesson} value={lesson}>{lesson}</option>)}
            </select>
          </label>
        ) : null}
        <label className="adm-field"><span>Trạng thái</span>
          <select className="adm-select" name="trang-thai" defaultValue={status === 'all' ? '' : status}>
            <option value="">Mọi trạng thái</option>
            {CONTENT_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="adm-field"><span>Ảnh</span>
          <select className="adm-select" name="anh" defaultValue={search.anh ?? ''}>
            <option value="">Tất cả</option><option value="co">Có ảnh</option><option value="khong">Chưa có ảnh</option>
          </select>
        </label>
        <button type="submit" className="adm-btn">Lọc</button>
        {hasFilters ? <Link className="adm-btn ghost" href={`/admin/${config.slug}`}>Bỏ lọc</Link> : null}
      </form>
      <p className="adm-sm adm-muted" style={{ marginBottom: 8 }}>{result.total} kết quả</p>
      {result.items.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>ID</th><th>{config.label}</th><th>Chi tiết</th>{config.hasLesson ? <th>Bài</th> : null}<th>Ngày</th><th>Ảnh</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {result.items.map(({ row, status: rowStatus, hasImage }) => (
                <tr key={row.id}>
                  <td className="adm-muted">{row.id}</td>
                  <td><Link className="adm-row-link adm-face" href={`/admin/${config.slug}/${row.id}`}>{config.title(row) || '—'}</Link></td>
                  <td className="adm-sm" style={{ maxWidth: 360 }}>{config.subtitle(row)}</td>
                  {config.hasLesson ? <td className="adm-sm">{String(row.lesson ?? '').split('·')[0]}</td> : null}
                  <td>{row.day ?? <span className="adm-muted">—</span>}</td>
                  <td>{hasImage ? '🖼️' : <span className="adm-muted">—</span>}</td>
                  <td><StatusBadge status={rowStatus} /></td>
                  <td><RowActions entity={entity} id={row.id} title={config.title(row) || `#${row.id}`} isDemo={admin.isDemo} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="adm-card"><EmptyState title={hasFilters ? 'Không có mục nào khớp bộ lọc' : `Chưa có ${config.label.toLowerCase()}`}>
          {hasFilters ? <Link className="adm-btn ghost sm" href={`/admin/${config.slug}`}>Bỏ lọc</Link> : null}
        </EmptyState></div>
      )}
      <Pager page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </>
  );
}
