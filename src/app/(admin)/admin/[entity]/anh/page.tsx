import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader, DemoNotice, MigrationNotice } from '@/components/admin/AdminParts';
import { BulkImageManager, type BulkImageItem } from '@/components/admin/BulkImageManager';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminSchema } from '@/features/admin/admin-schema';
import { loadEntityRecords } from '@/features/admin/content-admin';
import { type AdminEntity, type AdminRow, ENTITY_BY_SLUG, ENTITY_CONFIG } from '@/features/admin/content-entities';

/** Các cách gọi một mục — để tìm kiếm và gợi ý ghép ảnh theo tên file. */
function matchKeys(entity: AdminEntity, row: AdminRow): string[] {
  const text = (name: string) => String(row[name] ?? '').trim();
  switch (entity) {
    case 'vocabulary': return [text('kanji'), text('kana'), text('meaning')];
    case 'kanji': return [text('character'), text('han_viet'), text('meaning')];
    case 'radical': return [text('radical').split(' / ')[0], text('name_jp'), text('meaning')];
    case 'grammar': return [text('pattern'), text('usage')];
  }
}

/** Quản lý ảnh hàng loạt cho một loại nội dung — không phải mở từng form. */
export default async function AdminBulkImagesPage({ params }: { params: Promise<{ entity: string }> }) {
  const admin = await requireAdminPage();
  const entity = ENTITY_BY_SLUG[(await params).entity];
  if (!entity) notFound();
  const config = ENTITY_CONFIG[entity];
  const schema = await getAdminSchema();
  const isReady = schema.media_assets && schema.content_images;
  const records = await loadEntityRecords(entity);
  const items: BulkImageItem[] = records.map(({ row, image }) => ({
    id: row.id, title: config.title(row) || `#${row.id}`, subtitle: config.subtitle(row), keys: matchKeys(entity, row),
    imageUrl: image?.url ?? null, imageAlt: image?.alt || image?.assetAlt || '',
  }));
  return (
    <>
      <AdminPageHeader crumbs={[{ href: `/admin/${config.slug}`, label: config.label }, { label: 'Quản lý ảnh' }]} title={`Quản lý ảnh — ${config.label}`}
        actions={<Link className="adm-btn ghost" href="/admin/media">Thư viện Media</Link>} />
      {admin.isDemo ? <DemoNotice /> : null}
      {!admin.isDemo && !isReady ? <MigrationNotice feature="ảnh minh hoạ" /> : null}
      {isReady || admin.isDemo ? <BulkImageManager entity={entity} items={items} isDemo={admin.isDemo} /> : null}
    </>
  );
}
