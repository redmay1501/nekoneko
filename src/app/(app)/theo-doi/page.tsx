import Link from 'next/link';
import { AchievementsPanel } from '@/components/tracking/AchievementsPanel';
import { MemoryPanel } from '@/components/tracking/MemoryPanel';
import { ProgressPanel } from '@/components/tracking/ProgressPanel';

const TABS = [
  { id: 'tien-do', label: 'Tiến độ' },
  { id: 'tri-nho', label: 'Trí nhớ' },
  { id: 'thanh-tich', label: 'Thành tích' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/** Theo dõi — Tiến độ · Trí nhớ · Thành tích trong MỘT trang (trước đây ba trang riêng). */
export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab: TabId = TABS.some((candidate) => candidate.id === requested) ? (requested as TabId) : 'tien-do';
  return (
    <>
      <h1>Theo dõi</h1>
      <div className="pill-tabs mt-2 mb-3.5" role="tablist" aria-label="Theo dõi">
        {TABS.map((candidate) => (
          <Link key={candidate.id} href={`/theo-doi?tab=${candidate.id}`} role="tab" aria-selected={tab === candidate.id}
            className={`tab ${tab === candidate.id ? 'on' : ''}`} prefetch scroll={false} replace>
            {candidate.label}
          </Link>
        ))}
      </div>
      <div key={tab}>
        {tab === 'tien-do' ? <ProgressPanel /> : null}
        {tab === 'tri-nho' ? <MemoryPanel /> : null}
        {tab === 'thanh-tich' ? <AchievementsPanel /> : null}
      </div>
    </>
  );
}
