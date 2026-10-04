import { KnowledgeDetailPage } from '@/components/learning/KnowledgeDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KnowledgeDetailPage contentType="vocabulary" rawId={id} backHref="/hoc-tap/tu-vung" backLabel="Từ vựng" />;
}
