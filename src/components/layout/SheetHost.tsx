'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { BottomSheet } from '@/components/common/BottomSheet';
import { useSheetStore } from '@/stores/sheet-store';

const SheetPanels = dynamic(() => import('./SheetPanels').then((mod) => mod.SheetPanels));

const SHEET_LABELS = { modes: 'Học ngay', navigation: 'Điều hướng', knowledge: 'Chi tiết kiến thức', search: 'Kết quả tìm kiếm', none: '' } as const;

/** Nơi DUY NHẤT hiển thị khay trượt. Các nơi khác chỉ gọi useSheetStore().openXxx(). */
export function SheetHost({ dailyMinutes }: { dailyMinutes: number }) {
  const { activeSheet, close } = useSheetStore();
  const pathname = usePathname();

  // Chuyển trang thì đóng khay — giống prototype (data-go luôn closeSheet()).
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    // Chi tiết từ vựng / Kanji (và kết quả tìm) mở GIỮA màn hình trên máy tính; Học ngay / điều hướng giữ thẻ nổi ở góc.
    <BottomSheet isOpen={activeSheet.kind !== 'none'} label={SHEET_LABELS[activeSheet.kind]} onClose={close}
      placement={activeSheet.kind === 'knowledge' || activeSheet.kind === 'search' ? 'center' : 'corner'}>
      {activeSheet.kind === 'none' ? null : (
        <SheetPanels activeSheet={activeSheet} dailyMinutes={dailyMinutes} onClose={close} />
      )}
    </BottomSheet>
  );
}
