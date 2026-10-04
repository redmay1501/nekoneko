import { KnowledgeDetailPage } from '@/components/learning/KnowledgeDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KnowledgeDetailPage contentType="kanji" rawId={id} backHref="/hoc-tap/kanji" backLabel="Kanji" />;
}
