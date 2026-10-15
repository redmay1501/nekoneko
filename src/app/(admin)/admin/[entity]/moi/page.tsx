import { notFound } from 'next/navigation';
import { AdminPageHeader, DemoNotice } from '@/components/admin/AdminParts';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminSchema } from '@/features/admin/admin-schema';
import { ENTITY_BY_SLUG, ENTITY_CONFIG, rowToFormValues } from '@/features/admin/content-entities';

export default async function AdminEntityCreatePage({ params, searchParams }: { params: Promise<{ entity: string }>; searchParams: Promise<{ ngay?: string }> }) {
  const admin = await requireAdminPage();
  const { entity: slug } = await params;
  const entity = ENTITY_BY_SLUG[slug];
  if (!entity) notFound();
  const config = ENTITY_CONFIG[entity];
  const schema = await getAdminSchema();
  const day = Number((await searchParams).ngay);
  const initialValues = { ...rowToFormValues(entity, null), ...(Number.isInteger(day) && day >= 1 && day <= 90 ? { day: String(day) } : {}) };
  return (
    <>
      <AdminPageHeader crumbs={[{ href: `/admin/${slug}`, label: config.label }, { label: 'Thêm mới' }]} title={`Thêm ${config.singular} mới`} />
      {admin.isDemo ? <DemoNotice /> : null}
      <ContentEditor entity={entity} id={null} initialValues={initialValues} status="draft" statusNote="" learnerMemoryCount={0} image={null}
        isDemo={admin.isDemo} canUseStatus={schema.content_status} canUseImages={false} />
    </>
  );
}
