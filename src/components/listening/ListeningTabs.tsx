'use client';

import { type ReactNode, useState } from 'react';

const TABS = [
  { id: 'bai-nghe', label: '🎧 Bài nghe' },
  { id: 'video', label: '🎬 Video N5' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/**
 * Hai phần của trang Luyện nghe: bài nghe sẵn có và thư viện video. Đổi ngay trong trình duyệt (cả hai phần đã có sẵn),
 * URL chỉ ghi lại (?muc=video) bằng replaceState — trang này từng treo khi chuyển trang cùng URL đổi tham số.
 */
export function ListeningTabs({ initialTab, videoCount, practice, videos }: {
  initialTab: string | undefined;
  videoCount: number;
  practice: ReactNode;
  videos: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>(initialTab === 'video' ? 'video' : 'bai-nghe');
  function choose(next: TabId) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'video') url.searchParams.set('muc', 'video'); else url.searchParams.delete('muc');
    window.history.replaceState(window.history.state, '', url);
  }
  return (
    <>
      <div className="pill-tabs listening-tabs" role="tablist" aria-label="Phần luyện nghe">
        {TABS.map((entry) => (
          <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} className={`tab ${tab === entry.id ? 'on' : ''}`}
            onClick={() => choose(entry.id)}>
            {entry.label}{entry.id === 'video' ? <span className="tab-count">{videoCount}</span> : null}
          </button>
        ))}
      </div>
      <div hidden={tab !== 'bai-nghe'}>{practice}</div>
      <div hidden={tab !== 'video'}>{videos}</div>
    </>
  );
}
