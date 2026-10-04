import { ProgressBar } from '@/components/common/ProgressBar';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildProgressRows } from '@/features/progress/progress-summary';
import { percentOf } from '@/lib/utils/text';

/** SC-35 · Tiến độ — bám theo đúng lộ trình 90 ngày. */
export default async function ProgressPage() {
  const { catalog, memoryViews, journey } = await getLearnerContext();
  return (
    <>
      <h1>Tiến độ</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Bám theo đúng lộ trình 90 ngày của bạn.</p>
      <div className="stack">
        {buildProgressRows(catalog, memoryViews, journey).map((row) => (
          <div key={row.label} className="card tight">
            <div className="between"><b className="sm">{row.label}</b><span className="tiny muted">{row.done}/{row.total} · {percentOf(row.done, row.total)}%</span></div>
            <ProgressBar percent={percentOf(row.done, row.total)} variant="thin" label={row.label} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="card mt-3.5" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
        <p className="jp" style={{ fontSize: 17 }}>「継続は力なり」</p>
        <p className="sm soft mt-1">Kiên trì chính là sức mạnh.</p>
      </div>
    </>
  );
}
