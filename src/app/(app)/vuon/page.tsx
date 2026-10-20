import Link from 'next/link';
import { GardenPlots } from '@/components/garden/GardenPlots';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { GARDEN_STAGES, STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { buildMemoryOverview, forgettingRadarList, joinWithKnowledge, pickGardenPlants, viewsWithStatus } from '@/features/memory/memory-overview';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { GardenScene } from '@/components/garden/GardenScene';
import { Garden3D } from '@/components/garden/Garden3D';

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
  const shownPlants = pickGardenPlants(learned, GARDEN_VISIBLE_PLANTS, 'garden');
  // Chỉ gửi xuống trình duyệt những trường thẻ thông tin cây cần.
  const plants3d = shownPlants.map(({ contentKey, face, reading, meaning, status, lastEncounterText }) => ({ contentKey, face, reading, meaning, status, lastEncounterText }));

  return (
    <>
      <div className="title-count"><h1>Vườn tri thức</h1><span className="chip mint">{learned.length} cây</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Mỗi thứ bạn giữ lại được là một cái cây. Vườn này không phải trang trí — nó chính là trí nhớ của bạn.
      </p>
      {/* Chú giải: hàng nhãn co giãn theo chữ (trước đây ép vào ô cây 58px → chữ vỡ 3 dòng, ô cao thấp lệch nhau). */}
      <ul className="garden-legend mb-3" aria-label="Các giai đoạn của cây">
        {GARDEN_STAGES.map((stage) => (
          <li key={stage.status} title={stage.description}>
            <EmojiIcon emoji={STATUS_PRESENTATION[stage.status].plant} size={22} />
            <span><b>{stage.label}</b> · {overview.counts[stage.status]} cây</span>
          </li>
        ))}
        <li title="Lâu chưa gặp lại — lá ngả vàng, nên tưới lại sớm">
          <EmojiIcon emoji={STATUS_PRESENTATION.fading.plant} size={22} />
          <span><b>{STATUS_PRESENTATION.fading.label}</b> · {overview.counts.fading} cây</span>
        </li>
      </ul>
      <Garden3D plants={plants3d}
        fallback={<GardenScene planted={learned.length} mastered={overview.counts.mastered} fading={overview.counts.fading} />} />
      <p className="tiny muted center mt-2">
        Mầm 🌱 mới học · cây non 🌿 đang hình thành · cây xanh 🌳 đã nhớ tốt · cây nở hoa 🌸 đã thành thạo · lá vàng 🍂 sắp quên.
        {learned.length > GARDEN_VISIBLE_PLANTS ? ` Vườn hiển thị ${GARDEN_VISIBLE_PLANTS} trong ${learned.length} cây.` : ''}
      </p>
      {learned.length ? (
        <details className="garden mt-3">
          <summary className="sm" style={{ cursor: 'pointer', fontWeight: 600 }}>Danh sách cây trong vườn ({shownPlants.length})</summary>
          <div className="mt-3"><GardenPlots entries={shownPlants} /></div>
        </details>
      ) : null}
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
