import { notFound } from 'next/navigation';
import { AdminPageHeader, DemoNotice, StatusBadge } from '@/components/admin/AdminParts';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { KnowledgeDetailContent } from '@/components/learning/KnowledgeDetailContent';
import { requireAdminPage } from '@/features/admin/admin-guard';
import { getAdminSchema } from '@/features/admin/admin-schema';
import { buildLearnerPreview, countLearnerMemory, loadEntityRecords } from '@/features/admin/content-admin';
import { ENTITY_BY_SLUG, ENTITY_CONFIG, rowToFormValues } from '@/features/admin/content-entities';

export default async function AdminEntityEditPage({ params }: { params: Promise<{ entity: string; id: string }> }) {
  const admin = await requireAdminPage();
  const { entity: slug, id: rawId } = await params;
  const entity = ENTITY_BY_SLUG[slug];
  const id = Number(rawId);
  if (!entity || !Number.isInteger(id)) notFound();
  const config = ENTITY_CONFIG[entity];
  const record = (await loadEntityRecords(entity)).find((item) => item.row.id === id);
  if (!record) notFound();
  const [schema, learnerMemoryCount, preview] = await Promise.all([getAdminSchema(), countLearnerMemory(entity, id), buildLearnerPreview(entity, record)]);

  return (
    <>
      <AdminPageHeader crumbs={[{ href: `/admin/${slug}`, label: config.label }, { label: `#${id}` }]}
        title={<><span className="adm-jp">{config.title(record.row)}</span> <StatusBadge status={record.status} /></>} />
      {admin.isDemo ? <DemoNotice /> : null}
      <ContentEditor entity={entity} id={id} initialValues={rowToFormValues(entity, record.row)} status={record.status} statusNote={record.statusNote}
        learnerMemoryCount={learnerMemoryCount} image={record.image} isDemo={admin.isDemo}
        canUseStatus={schema.content_status} canUseImages={schema.media_assets && schema.content_images}
        preview={preview ? <KnowledgeDetailContent detail={preview} /> : null} />
    </>
  );
}
