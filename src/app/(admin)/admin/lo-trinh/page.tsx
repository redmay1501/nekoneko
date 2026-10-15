import Link from 'next/link';
import { AdminPageHeader, DemoNotice, EmptyState } from '@/components/admin/AdminParts';
import { DayItemActions, LinkItemForm } from '@/components/admin/RoadmapActions';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { loadAdminContent } from '@/features/admin/content-admin';
import { ADMIN_ENTITIES, ENTITY_CONFIG } from '@/features/admin/content-entities';
import { auditRoadmap } from '@/features/admin/roadmap-audit';

/**
 * Lộ trình 90 ngày: xem nội dung từng ngày, ngày thiếu nội dung, mục trùng; gắn / gỡ mục khỏi ngày.
 * Chỉ sửa NỘI DUNG (cột day của mục) — không bao giờ đổi tiến độ hay tự đánh dấu hoàn thành ngày của người học.
 */
export default async function AdminRoadmapPage({ searchParams }: { searchParams: Promise<{ ngay?: string }> }) {
  const admin = await requireAdminPage();
  const content = await loadAdminContent();
  const audit = auditRoadmap(content);
  const selected = Math.min(Math.max(Number((await searchParams).ngay) || 1, 1), 90);
  const day = audit.days[selected - 1];
  const journeyDay = content.journeyDays.find((entry) => entry.day === selected);
  const tasks = content.dayTasks.filter((task) => task.day === selected).sort((left, right) => left.orderNo - right.orderNo);
  const itemsOf = {
    vocabulary: content.vocabulary.filter((item) => item.day === selected).map((item) => ({ id: item.id, title: item.kanji || item.kana, sub: item.meaning })),
    kanji: content.kanji.filter((item) => item.day === selected).map((item) => ({ id: item.id, title: item.character, sub: `${item.hanViet} · ${item.meaning}` })),
    radical: content.radicals.filter((item) => item.day === selected).map((item) => ({ id: item.id, title: item.radical, sub: item.meaning })),
    grammar: content.grammar.filter((item) => item.day === selected).map((item) => ({ id: item.id, title: item.pattern, sub: item.usage.slice(0, 80) })),
  };
  const duplicatesToday = audit.duplicates.filter((group) => group.items.some((item) => item.day === selected));

  return (
    <>
      <AdminPageHeader crumbs={[{ label: 'Lộ trình 90 ngày' }]} title="Lộ trình 90 ngày" />
      {admin.isDemo ? <DemoNotice /> : null}
      <section className="adm-card" style={{ marginTop: 12 }}>
        <h2>Chọn ngày <span className="adm-sm adm-muted">— ô vàng: ngày cần xem (thiếu nội dung / đầu việc)</span></h2>
        <div className="adm-day-strip">
          {audit.days.map((entry) => (
            <Link key={entry.day} href={`/admin/lo-trinh?ngay=${entry.day}`} className={`adm-day ${entry.missing.length ? 'warn' : ''}`} aria-current={entry.day === selected ? 'true' : undefined}
              title={entry.missing.join('\n') || entry.title}>
              <b>{entry.day}</b>
              <span className="adm-muted">{entry.counts.vocabulary}·{entry.counts.kanji}·{entry.counts.grammar}</span>
            </Link>
          ))}
        </div>
        <p className="adm-sm adm-muted" style={{ marginTop: 8 }}>Số dưới mỗi ngày: từ vựng · kanji · ngữ pháp. Chưa gắn ngày: {ADMIN_ENTITIES.map((entity) => `${audit.unassigned[entity]} ${ENTITY_CONFIG[entity].label.toLowerCase()}`).join(', ')}.</p>
      </section>

      <div className="adm-two" style={{ marginTop: 14 }}>
        <div>
          <section className="adm-card">
            <h2>Ngày {selected}{journeyDay ? ` — ${journeyDay.title}` : ''}</h2>
            {journeyDay ? <p className="adm-sm adm-muted">Tuần {journeyDay.week ?? '—'} · {journeyDay.stage} · {journeyDay.minna} · {journeyDay.minutes} phút</p> : null}
            {day.missing.length ? (
              <div className="adm-notice" style={{ marginTop: 10 }}><span aria-hidden="true">⚠️</span><ul className="adm-list">{day.missing.map((message) => <li key={message}>{message}</li>)}</ul></div>
            ) : <p className="adm-sm" style={{ marginTop: 8 }}>✓ Không thấy thiếu nội dung.</p>}
            {duplicatesToday.length ? (
              <div className="adm-notice" style={{ marginTop: 10 }}><span aria-hidden="true">🔁</span><ul className="adm-list">
                {duplicatesToday.map((group) => <li key={`${group.entity}-${group.key}`}>{ENTITY_CONFIG[group.entity].label} “{group.key.split('|').filter(Boolean).join(' / ')}” trùng ở: {group.items.map((item) => (
                  <Link key={item.id} href={`/admin/${ENTITY_CONFIG[group.entity].slug}/${item.id}`} style={{ textDecoration: 'underline', marginRight: 6 }}>#{item.id} (ngày {item.day ?? '—'})</Link>
                ))}</li>)}
              </ul></div>
            ) : null}
          </section>
          {ADMIN_ENTITIES.map((entity) => (
            <section key={entity} className="adm-card">
              <div className="adm-title" style={{ margin: 0 }}>
                <h2 style={{ margin: 0 }}>{ENTITY_CONFIG[entity].label} ({itemsOf[entity].length})</h2>
                <div className="adm-actions"><LinkItemForm entity={entity} day={selected} disabled={admin.isDemo} /></div>
              </div>
              {journeyDay ? <p className="adm-sm adm-muted" style={{ margin: '4px 0 8px' }}>Tóm tắt: {journeyDay[({ vocabulary: 'vocabSummary', kanji: 'kanjiSummary', radical: 'radicalSummary', grammar: 'grammarSummary' } as const)[entity]] || '—'}</p> : null}
              {itemsOf[entity].length ? (
                <ul className="adm-list">
                  {itemsOf[entity].map((item) => (
                    <li key={item.id} style={{ alignItems: 'center' }}>
                      <Link className="adm-face" href={`/admin/${ENTITY_CONFIG[entity].slug}/${item.id}`}>{item.title}</Link>
                      <span className="adm-sm adm-muted" style={{ flex: 1 }}>#{item.id} · {item.sub}</span>
                      <DayItemActions entity={entity} id={item.id} title={item.title} day={selected} disabled={admin.isDemo} />
                    </li>
                  ))}
                </ul>
              ) : <p className="adm-sm adm-muted">Chưa gắn mục nào.</p>}
            </section>
          ))}
        </div>
        <section className="adm-card">
          <h2>Đầu việc trong ngày ({tasks.length})</h2>
          {tasks.length ? (
            <ol className="adm-list" style={{ listStyle: 'decimal', paddingLeft: 18 }}>
              {tasks.map((task) => <li key={task.orderNo} style={{ display: 'list-item' }}><b>{task.label}</b> <span className="adm-muted">({task.minutes} phút)</span><br /><span className="adm-sm">{task.body}</span></li>)}
            </ol>
          ) : <EmptyState title="Chưa có đầu việc" />}
          <p className="adm-sm adm-muted" style={{ marginTop: 10 }}>Đầu việc và tóm tắt ngày lấy từ bảng journey_days / day_tasks (nhập bằng script seed) — trang này chỉ xem.</p>
          <p style={{ marginTop: 10 }}><Link className="adm-btn ghost sm" href={`/lo-trinh/ngay/${selected}`}>Mở ngày {selected} trong app học ↗</Link></p>
        </section>
      </div>
    </>
  );
}
