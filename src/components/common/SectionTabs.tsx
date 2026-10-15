'use client';

import { type ReactNode, useState } from 'react';

export interface SectionTab {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

/**
 * Các tab trong một trang: đổi ngay trong trình duyệt (mọi tab đã render sẵn, chỉ ẩn / hiện) → chuyển tab không mất chữ đang
 * gõ hay nét đang viết. URL ghi lại tab (?{param}=id) bằng replaceState để tải lại vẫn đúng tab.
 */
export function SectionTabs({ tabs, initialTab, param, label }: { tabs: SectionTab[]; initialTab?: string; param: string; label: string }) {
  const [active, setActive] = useState(tabs.some((tab) => tab.id === initialTab) ? initialTab! : tabs[0].id);
  function choose(id: string) {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === tabs[0].id) url.searchParams.delete(param); else url.searchParams.set(param, id);
    window.history.replaceState(window.history.state, '', url);
  }
  return (
    <>
      <div className="pill-tabs section-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-controls={`panel-${tab.id}`} aria-selected={active === tab.id}
            className={`tab ${active === tab.id ? 'on' : ''}`} onClick={() => choose(tab.id)}>{tab.label}</button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id} className="mt-3">
          {tab.content}
        </div>
      ))}
    </>
  );
}
