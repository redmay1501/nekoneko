import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { N5JourneyCard } from '@/components/home/N5JourneyCard';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildProgressRows } from '@/features/progress/progress-summary';
import { buildMemoryOverview } from '@/features/memory/memory-overview';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const SHORTCUTS = [
  { href: '/tien-do', icon: 'neko:progress', label: 'Tiến độ' },
  { href: '/thanh-tich', icon: 'neko:achievements', label: 'Thành tích' },
  { href: '/cai-dat', icon: 'neko:settings', label: 'Cài đặt' },
] as const;

/** SC-37 · Hồ sơ. */
export default async function ProfilePage() {
  const { profile, journeyDay, journey, recallDays, catalog, memoryViews } = await getLearnerContext();
  const overview = buildMemoryOverview(memoryViews);
  const stats = [
    { label: 'Ngày học', value: journeyDay },
    { label: 'Ngày nhớ lại', value: recallDays },
    { label: 'Cây trong vườn', value: overview.learnedCount },
  ];
  return (
    <>
      <div className="center" style={{ padding: '10px 0 4px' }}>
        <SpriteIcon name="noko" size={96} className="mx-auto" />
        <h1 className="mt-1.5">{profile.displayName}</h1>
        <p className="soft sm">Cấp {profile.level} · đang chinh phục JLPT N5</p>
      </div>
      <div className="grid three mt-3.5" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card tight center">
            <b style={{ fontSize: 22 }}>{stat.value}</b>
            <div className="tiny muted">{stat.label}</div>
          </div>
        ))}
      </div>
      <N5JourneyCard journeyDay={journeyDay} rows={buildProgressRows(catalog, memoryViews, journey).slice(1, 6)} />
      <div className="stack mt-3.5">
        {SHORTCUTS.map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href} className="card tight block" style={{ textAlign: 'left' }}>
            <div className="row"><EmojiIcon emoji={shortcut.icon} size={36} /><b className="sm">{shortcut.label}</b></div>
          </Link>
        ))}
      </div>
    </>
  );
}
