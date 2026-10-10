import { notFound } from 'next/navigation';
import { LearningSession } from '@/components/learning/LearningSession';
import { MAX_FOCUS_ITEMS, SESSION_MODES, isSessionMode } from '@/features/learning/session-modes';

/**
 * SC-33 · /hoc/[mode] — mọi kiểu học đi qua đúng một trang và một Session Engine.
 * /hoc/focus?k=kanji-1,kanji-2 — học / kiểm tra đúng những kiến thức người học chọn ở trang Học tập.
 */
export default async function SessionPage({ params, searchParams }: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const [{ mode }, { k }] = await Promise.all([params, searchParams]);
  if (!isSessionMode(mode)) notFound();
  const focusKeys = mode === SESSION_MODES.FOCUS ? (k ?? '').split(',').filter(Boolean).slice(0, MAX_FOCUS_ITEMS) : undefined;
  return <LearningSession key={`${mode}:${k ?? ''}`} mode={mode} focusKeys={focusKeys} />;
}
