import { KnowledgeDetailPage } from '@/components/learning/KnowledgeDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KnowledgeDetailPage contentType="grammar" rawId={id} backHref="/hoc-tap/ngu-phap" backLabel="Ngữ pháp" />;
}
