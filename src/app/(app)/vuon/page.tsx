import Link from 'next/link';
import { GardenPlots } from '@/components/garden/GardenPlots';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { GARDEN_STAGES, STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { buildMemoryOverview, forgettingRadarList, joinWithKnowledge, pickGardenPlants, viewsWithStatus } from '@/features/memory/memory-overview';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const GARDEN_VISIBLE_PLANTS = 60;
const BLOOM_PREVIEW = 8;
const WILTING_PREVIEW = 8;

/** SC-10 · Vườn tri thức — vườn không phải trang trí, nó chính là trí nhớ của bạn. */
export default async function GardenPage() {
  const { catalog, memoryViews, memoryRecords } = await getLearnerContext();
  const overview = buildMemoryOverview(memoryViews);
  const learned = toKnowledgeListEntries(catalog.items.filter((item) => memoryViews.get(item.key)?.isLearned), memoryViews);
  const rescuedTotal = [...memoryRecords.values()].reduce((sum, record) => sum + record.rescuedCount, 0);
  const blooming = joinWithKnowledge(catalog, viewsWithStatus(memoryViews, 'mastered').slice(0, BLOOM_PREVIEW));
  const wilting = joinWithKnowledge(catalog, forgettingRadarList(memoryViews, WILTING_PREVIEW));

  return (
    <>
      <div className="between"><h1>Vườn tri thức</h1><span className="chip mint">{learned.length} cây</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Mỗi thứ bạn giữ lại được là một cái cây. Vườn này không phải trang trí — nó chính là trí nhớ của bạn.
      </p>
      <div className="garden">
        <div className="plots mb-3.5">
          {GARDEN_STAGES.map((stage) => (
            <div key={stage.status} className="plot" style={{ aspectRatio: 'auto', padding: '10px 6px' }} title={stage.description}>
              <span className="e"><EmojiIcon emoji={STATUS_PRESENTATION[stage.status].plant} size={30} /></span>
              <span className="tiny" style={{ fontWeight: 600 }}>{stage.label}</span>
              <span className="tiny muted" style={{ fontSize: 9.5 }}>{overview.counts[stage.status]} cây</span>
            </div>
          ))}
        </div>
        {learned.length ? <GardenPlots entries={pickGardenPlants(learned, GARDEN_VISIBLE_PLANTS, 'garden')} /> : (
          <p className="sm soft center">Vườn đang chờ hạt đầu tiên 🌱</p>
        )}
        <p className="tiny muted center mt-3.5">
          Hiển thị {Math.min(GARDEN_VISIBLE_PLANTS, learned.length)} trong {learned.length} cây · chạm vào một cây để xem nó đã ở lại thế nào
        </p>
      </div>
      <div className="grid two mt-4">
        <div className="card tight">
          <b className="sm">🌸 Hoa đã nở</b>
          <p className="tiny muted" style={{ margin: '4px 0 8px' }}>Thành thạo — hầu như không quên nữa</p>
          <div className="row wrap" style={{ gap: 5 }}>
            {blooming.length ? blooming.map(({ item }) => (
              <KnowledgeChipButton key={item.key} contentKey={item.key} className="chip jp">{item.face}</KnowledgeChipButton>
            )) : <span className="tiny muted">Chưa có — cứ đi tiếp nhé.</span>}
          </div>
        </div>
        <div className="card tight">
          <b className="sm">🍂 Lá đang úa</b>
          <p className="tiny muted" style={{ margin: '4px 0 8px' }}>Sắp quên — nên tưới lại sớm</p>
          <div className="row wrap" style={{ gap: 5 }}>
            {wilting.length ? wilting.map(({ item }) => (
              <Link key={item.key} className="chip jp" href={`/tri-nho/cuu/${item.key}`}>{item.face}</Link>
            )) : <span className="tiny muted">Không có gì cần cứu 🌸</span>}
          </div>
          <Link className="btn ghost block sm mt-2.5" href="/tri-nho/sap-quen">Tưới vườn</Link>
        </div>
      </div>
      {rescuedTotal ? <p className="tiny muted center mt-3.5">Bạn đã cứu {rescuedTotal} cây khỏi héo 🌸</p> : null}
    </>
  );
}
