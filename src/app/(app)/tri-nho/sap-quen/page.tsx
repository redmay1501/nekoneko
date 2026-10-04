import Link from 'next/link';
import { NokoMessage } from '@/components/common/NokoMessage';
import { RadarList } from '@/components/memory/RadarItem';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { forgettingRadarList, joinWithKnowledge } from '@/features/memory/memory-overview';

/** SC-29 · Kiến thức sắp quên — ra-đa của Noko. */
export default async function ForgettingRadarPage() {
  const { catalog, memoryViews, memoryRecords } = await getLearnerContext();
  const radar = joinWithKnowledge(catalog, forgettingRadarList(memoryViews));
  const totalAtRisk = forgettingRadarList(memoryViews, Number.MAX_SAFE_INTEGER).length;
  const rescuedTotal = [...memoryRecords.values()].reduce((sum, record) => sum + record.rescuedCount, 0);

  if (!radar.length) {
    return (
      <>
        <h1>Kiến thức sắp quên</h1>
        <NokoMessage state="idle" text="Hiện tại chưa có gì cần cứu 🌸 Bạn đang giữ nhịp rất tốt." className="mt-3.5" />
        <Link className="btn block mt-3.5" href="/hoc/daily">Học hôm nay</Link>
      </>
    );
  }
  return (
    <>
      <h1>Kiến thức sắp quên</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Những thứ này đang mờ dần. Chạm vào một thứ, Noko sẽ giúp bạn kéo nó quay lại.
      </p>
      <NokoMessage state="forgotten"
        text={`Mình tìm thấy ${totalAtRisk} thứ đang mờ dần. Không cần cứu hết hôm nay đâu — một hai cái là đủ.`} />
      <div className="mt-3.5">
        <RadarList entries={toKnowledgeListEntries(radar.map((entry) => entry.item), memoryViews)} emptyText="" />
      </div>
      <Link className="btn block mt-4" href="/hoc/rescue">Để Neko Neko chọn giúp · 5 thứ</Link>
      <p className="tiny muted center mt-2.5">Bạn đã cứu được {rescuedTotal} kiến thức.</p>
    </>
  );
}
