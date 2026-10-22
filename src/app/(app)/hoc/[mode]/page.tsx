import { notFound } from 'next/navigation';
import { LearningSession } from '@/components/learning/LearningSession';
import { MAX_FOCUS_ITEMS, SESSION_MODES, isSessionMode } from '@/features/learning/session-modes';
import { FOCUS_REVIEW_BATCH_SIZE } from '@/features/learning/session-modes';

/**
 * SC-33 · /hoc/[mode] — mọi kiểu học đi qua đúng một trang và một Session Engine.
 * /hoc/focus?k=kanji-1,kanji-2 — học / kiểm tra đúng những kiến thức người học chọn ở trang Học tập.
 */
export default async function SessionPage({ params, searchParams }: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ k?: string; later?: string; lan?: string; tong?: string; back?: string }>;
}) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  if (!isSessionMode(mode)) notFound();
  const keyPattern = /^(?:hiragana|katakana|radical|kanji|vocabulary|grammar)-\d+$/;
  const allKeys = [...new Set((query.k ?? '').split(',').filter((key) => keyPattern.test(key)))].slice(0, MAX_FOCUS_ITEMS);
  const isBatchedReview = mode === SESSION_MODES.FOCUS && (query.lan !== undefined || query.later !== undefined);
  const focusKeys = mode === SESSION_MODES.FOCUS ? (isBatchedReview ? allKeys.slice(0, FOCUS_REVIEW_BATCH_SIZE) : allKeys) : undefined;
  const laterKeys = mode === SESSION_MODES.FOCUS ? (query.later ?? '').split(',').filter((key) => keyPattern.test(key)).slice(0, MAX_FOCUS_ITEMS) : [];
  const returnTo = /^\/lo-trinh\/ngay\/(?:[1-9]|[1-8]\d|90)$/.test(query.back ?? '') ? query.back : undefined;
  const round = Math.max(1, Math.min(999, Number(query.lan) || 1));
  const rounds = Math.max(round, Math.min(999, Number(query.tong) || round));
  let nextBatchHref: string | undefined;
  if (laterKeys.length && focusKeys?.length) {
    const nextKeys = laterKeys.slice(0, FOCUS_REVIEW_BATCH_SIZE);
    const remaining = laterKeys.slice(FOCUS_REVIEW_BATCH_SIZE);
    const nextParams = new URLSearchParams({ k: nextKeys.join(','), lan: String(round + 1), tong: String(rounds) });
    if (remaining.length) nextParams.set('later', remaining.join(','));
    if (returnTo) nextParams.set('back', returnTo);
    nextBatchHref = `/hoc/focus?${nextParams}`;
  }
  const batchLabel = query.lan ? `Lượt ${round}/${rounds} · câu ${(round - 1) * FOCUS_REVIEW_BATCH_SIZE + 1}–${(round - 1) * FOCUS_REVIEW_BATCH_SIZE + (focusKeys?.length ?? 0)}` : undefined;
  return <LearningSession key={`${mode}:${focusKeys?.join(',') ?? ''}`} mode={mode} focusKeys={focusKeys} returnTo={returnTo}
    nextBatchHref={nextBatchHref} batchLabel={batchLabel} />;
}
