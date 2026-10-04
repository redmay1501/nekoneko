'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { BottomSheet } from '@/components/common/BottomSheet';
import { KnowledgeDetailBodySkeleton } from '@/components/common/PageSkeletons';
import { SkeletonList, SkeletonScreen } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { KnowledgeDetailContent } from '@/components/learning/KnowledgeDetailContent';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { ModeGrid } from '@/components/learning/ModeGrid';
import { useKnowledgeDetail, useKnowledgeSearch } from '@/features/learning/hooks/useKnowledgeDetail';
import { SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { speechTextFor } from '@/features/learning/speech-text';
import { useSpeech } from '@/hooks/useSpeech';
import { useSheetStore } from '@/stores/sheet-store';
import { NavigationList } from './NavigationList';
import { EmojiIcon } from '@/components/common/EmojiIcon';

function ModesSheet({ onClose, dailyMinutes }: { onClose: () => void; dailyMinutes: number }) {
  return (
    <>
      <h3>Học ngay</h3>
      <p className="sm soft" style={{ margin: '4px 0 14px' }}>Phần tối thiểu được dẫn dắt. Phần học thêm là không giới hạn.</p>
      <Link className="btn block" href="/hoc/daily" onClick={onClose}>
        <EmojiIcon emoji={SESSION_MODE_CONFIG.daily.emoji} size={20} /> {SESSION_MODE_CONFIG.daily.label} · {dailyMinutes} phút
      </Link>
      <Link className="btn ghost block sm mt-2" href="/hoc/day" onClick={onClose}>
        <EmojiIcon emoji={SESSION_MODE_CONFIG.day.emoji} size={18} /> {SESSION_MODE_CONFIG.day.label} hôm nay · từng chặng 5 kiến thức
      </Link>
      <div className="mt-3"><ModeGrid includePracticeLink onNavigate={onClose} /></div>
    </>
  );
}

function KnowledgeSheet({ contentKey, shouldAutoplayAudio }: { contentKey: string; shouldAutoplayAudio: boolean }) {
  const { data, isLoading, error, refetch } = useKnowledgeDetail(contentKey);
  const { speak } = useSpeech();
  const audioText = data ? speechTextFor(data.item) : null;

  // Cài đặt "Tự phát âm thanh — khi mở thẻ kiến thức".
  useEffect(() => {
    if (shouldAutoplayAudio && audioText) speak(audioText);
  }, [shouldAutoplayAudio, audioText, speak]);

  if (isLoading) return <SkeletonScreen label="Đang mở chi tiết kiến thức…"><KnowledgeDetailBodySkeleton /></SkeletonScreen>;
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  return <KnowledgeDetailContent detail={data} />;
}

function SearchSheet({ query }: { query: string }) {
  const { data, isLoading, error, refetch } = useKnowledgeSearch(query);
  const results = data?.results ?? [];
  return (
    <>
      <h3>Kết quả cho “{query}”</h3>
      {isLoading ? <SkeletonScreen label="Đang tìm…"><div className="mt-3"><SkeletonList rows={4} /></div></SkeletonScreen> : null}
      {error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}
      {data ? (
        <>
          <p className="sm muted" style={{ margin: '4px 0 12px' }}>{results.length} kết quả</p>
          {results.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {results.map((result) => (
                <KnowledgeChipButton key={result.contentKey} contentKey={result.contentKey} className="list-row">
                  <span className="big jp">{result.face}</span>
                  <span className="mid"><b>{result.meaning}</b><span className="jp">{result.reading}</span></span>
                  <span className="end"><span className="tiny muted">{result.statusEmoji} {result.typeLabel}</span></span>
                </KnowledgeChipButton>
              ))}
            </div>
          ) : (
            <EmptyState message="Chưa tìm thấy. Thử gõ 日本, にほん hoặc “Nhật Bản”." />
          )}
        </>
      ) : null}
    </>
  );
}

const SHEET_LABELS = { modes: 'Học ngay', navigation: 'Điều hướng', knowledge: 'Chi tiết kiến thức', search: 'Kết quả tìm kiếm', none: '' } as const;

/** Nơi DUY NHẤT hiển thị khay trượt. Các nơi khác chỉ gọi useSheetStore().openXxx(). */
export function SheetHost({ dailyMinutes, shouldAutoplayAudio }: { dailyMinutes: number; shouldAutoplayAudio: boolean }) {
  const { activeSheet, close } = useSheetStore();
  const pathname = usePathname();

  // Chuyển trang thì đóng khay — giống prototype (data-go luôn closeSheet()).
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <BottomSheet isOpen={activeSheet.kind !== 'none'} label={SHEET_LABELS[activeSheet.kind]} onClose={close}>
      {activeSheet.kind === 'modes' ? <ModesSheet onClose={close} dailyMinutes={dailyMinutes} /> : null}
      {activeSheet.kind === 'navigation' ? (
        <>
          <h3 style={{ marginBottom: 10 }}>Điều hướng</h3>
          <NavigationList alwaysExpandLearning onNavigate={close} />
        </>
      ) : null}
      {activeSheet.kind === 'knowledge' ? <KnowledgeSheet key={activeSheet.contentKey} contentKey={activeSheet.contentKey} shouldAutoplayAudio={shouldAutoplayAudio} /> : null}
      {activeSheet.kind === 'search' ? <SearchSheet query={activeSheet.query} /> : null}
      {activeSheet.kind === 'knowledge' || activeSheet.kind === 'search' ? (
        <button type="button" className="btn quiet block sm mt-2.5" onClick={close}>Đóng</button>
      ) : null}
    </BottomSheet>
  );
}
