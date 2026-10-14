import Link from 'next/link';
import { MatchGame } from '@/components/games/MatchGame';
import { MATCH_GAME, MIN_MATCH_POOL, gameRecordKey } from '@/features/games/match-game';
import { MATCH_KINDS, MEMORY_RANGES, type MatchKind, buildMatchPool, parseMatchKind } from '@/features/games/match-pool';
import { RangePicker } from '@/components/learning/RangePicker';
import { getLearnerContext } from '@/features/learning/learner-context';

const hrefFor = (kind: MatchKind, range?: string) => `/tro-choi/ghep-the?loai=${kind}${range ? `&pham-vi=${range}` : ''}`;

/**
 * Trò chơi Ghép thẻ — chọn loại (từ vựng, Kanji, chữ cái) và phạm vi (đã học, cần ôn, từng bài / nhóm — kể cả phần
 * chưa học tới), có thời gian, độ chính xác và kỷ lục. Điểm game không tính vào trí nhớ (features/games/match-game.ts).
 */
export default async function MatchGamePage({ searchParams }: { searchParams: Promise<{ loai?: string; 'pham-vi'?: string }> }) {
  const params = await searchParams;
  const kind = parseMatchKind(params.loai);
  const { catalog, memoryViews, settings } = await getLearnerContext();
  const pool = buildMatchPool(catalog, memoryViews, kind, params['pham-vi']);
  const scope = `${kind}:${pool.range}`;
  const unit = kind === 'tu-vung' ? 'từ' : 'chữ';
  const partGroup = kind === 'tu-vung' ? 'Theo bài' : 'Theo nhóm';
  return (
    <>
      <div className="between">
        <h1>🃏 Ghép thẻ</h1>
        <Link className="link sm" href="/tro-choi">← Trò chơi</Link>
      </div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Chọn loại và phần muốn ôn — một hay nhiều bài, kể cả phần chưa học tới. Chơi lại để phá kỷ lục, nhắm 100% không sai.
      </p>
      <div className="pill-tabs" role="tablist" aria-label="Loại kiến thức">
        {(Object.keys(MATCH_KINDS) as MatchKind[]).map((option) => (
          <Link key={option} role="tab" aria-selected={option === kind} className={`tab ${option === kind ? 'on' : ''}`} href={hrefFor(option)}>
            {MATCH_KINDS[option]}
          </Link>
        ))}
      </div>
      <div className="mt-2.5">
        <RangePicker title="Phạm vi" current={pool.range} currentLabel={pool.rangeLabel}
          options={pool.options.map((option) => ({ id: option.id, label: option.label, caption: `${option.size} ${unit}`, size: option.size,
            href: hrefFor(kind, option.id), group: option.id in MEMORY_RANGES ? 'Theo trí nhớ' : partGroup }))}
          multi={{ groups: [partGroup], hrefPrefix: `${hrefFor(kind)}&pham-vi=`, unit, partUnit: kind === 'tu-vung' ? 'bài' : 'nhóm', minSize: MIN_MATCH_POOL }} />
      </div>
      <MatchGame key={scope} pool={pool.cards} scope={scope} unit={unit}
        recordsByPairs={{
          6: settings.gameRecords[gameRecordKey(MATCH_GAME, `${scope}:6`)] ?? settings.gameRecords[gameRecordKey(MATCH_GAME, scope)],
          8: settings.gameRecords[gameRecordKey(MATCH_GAME, `${scope}:8`)],
        }} />
    </>
  );
}
