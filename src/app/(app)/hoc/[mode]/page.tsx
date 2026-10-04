import { notFound } from 'next/navigation';
import { LearningSession } from '@/components/learning/LearningSession';
import { isSessionMode } from '@/features/learning/session-modes';

/** SC-33 · /hoc/[mode] — mọi kiểu học đi qua đúng một trang và một Session Engine. */
export default async function SessionPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isSessionMode(mode)) notFound();
  return <LearningSession key={mode} mode={mode} />;
}
