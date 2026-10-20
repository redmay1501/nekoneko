import Link from 'next/link';
import { GardenPlots } from '@/components/garden/GardenPlots';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { GARDEN_STAGES, STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { buildMemoryOverview, forgettingRadarList, joinWithKnowledge, pickGardenPlants, viewsWithStatus } from '@/features/memory/memory-overview';
import { GardenScene } from '@/components/garden/GardenScene';
import { Garden3D, type GardenGroupProgress, type GardenStatusCount } from '@/components/garden/Garden3D';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import type { ContentType } from '@/features/learning/knowledge-types';

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

  // Tiến độ thật của từng nhóm kiến thức (biển gỗ trong vườn) — cùng cách đếm "đã học" như các trang Học tập.
  const progressOf = (types: readonly ContentType[]) => {
    const items = types.flatMap((type) => itemsOfType(catalog, type));
    return { learned: items.filter((item) => memoryViews.get(item.key)?.isLearned).length, total: items.length };
  };
  const groups: GardenGroupProgress[] = [
    { id: 'vocabulary', label: 'Từ vựng', glyph: '語', href: '/hoc-tap/tu-vung', ...progressOf(['vocabulary']) },
    { id: 'kana', label: 'Kana', glyph: 'あ', href: '/hoc-tap/hiragana', ...progressOf(['hiragana', 'katakana']) },
    { id: 'grammar', label: 'Ngữ pháp', glyph: '文', href: '/hoc-tap/ngu-phap', ...progressOf(['grammar']) },
    { id: 'kanji', label: 'Kanji', glyph: '漢', href: '/hoc-tap/kanji', ...progressOf(['kanji']) },
    { id: 'radical', label: 'Bộ thủ', glyph: '部', href: '/hoc-tap/bo-thu', ...progressOf(['radical']) },
  ];
  const statusCounts: GardenStatusCount[] = [
    ...GARDEN_STAGES.map((stage) => ({ status: stage.status, label: stage.label, description: stage.description, count: overview.counts[stage.status] })),
    { status: 'fading', label: STATUS_PRESENTATION.fading.label, description: 'Lâu chưa gặp lại — lá ngả vàng, nên tưới lại sớm', count: overview.counts.fading },
  ];

  return (
    <>
      {/* Cảnh 3D tràn toàn vùng nội dung (dưới thanh trên, cạnh thanh bên); tiêu đề, bộ lọc, biển nhóm kiến thức phủ trên cảnh. */}
      <section className="garden-stage">
        <Garden3D plants={plants3d} groups={groups} statusCounts={statusCounts} totalCount={learned.length}
          fallback={(
            <div className="garden-stage-fallback">
              <div className="title-count"><h1>Vườn tri thức</h1><span className="chip mint">{learned.length} cây</span></div>
              <GardenScene planted={learned.length} mastered={overview.counts.mastered} fading={overview.counts.fading} />
            </div>
          )} />
      </section>
      <div className="garden-below">
      <p className="tiny muted center">
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
      </div>
    </>
  );
}
