'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { BottomSheet } from '@/components/common/BottomSheet';
import { useSheetStore } from '@/stores/sheet-store';

const SheetPanels = dynamic(() => import('./SheetPanels').then((mod) => mod.SheetPanels));

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
      {activeSheet.kind === 'none' ? null : (
        <SheetPanels activeSheet={activeSheet} dailyMinutes={dailyMinutes} shouldAutoplayAudio={shouldAutoplayAudio} onClose={close} />
      )}
    </BottomSheet>
  );
}
