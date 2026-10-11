import Link from 'next/link';
import { MatchGame } from '@/components/games/MatchGame';
import { MATCH_GAME, gameRecordKey } from '@/features/games/match-game';
import { MATCH_KINDS, type MatchKind, buildMatchPool, parseMatchKind } from '@/features/games/match-pool';
import { getLearnerContext } from '@/features/learning/learner-context';

const hrefFor = (kind: MatchKind, range?: string) => `/luyen-tap/ghep-the?loai=${kind}${range ? `&pham-vi=${range}` : ''}`;

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
  return (
    <>
      <div className="between">
        <h1>🃏 Ghép thẻ</h1>
        <Link className="link sm" href="/luyen-tap">← Luyện tập</Link>
      </div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Chọn loại và phần muốn ôn — kể cả phần chưa học tới. Chơi lại để phá kỷ lục, nhắm 100% không sai.
      </p>
      <div className="pill-tabs" role="tablist" aria-label="Loại kiến thức">
        {(Object.keys(MATCH_KINDS) as MatchKind[]).map((option) => (
          <Link key={option} role="tab" aria-selected={option === kind} className={`tab ${option === kind ? 'on' : ''}`} href={hrefFor(option)}>
            {MATCH_KINDS[option]}
          </Link>
        ))}
      </div>
      <div className="study-parts mt-2.5 mb-3.5" aria-label="Phạm vi">
        {pool.options.map((option) => (
          <Link key={option.id} className={`chip ${option.id === pool.range ? 'pink' : ''}`} href={hrefFor(kind, option.id)} scroll={false}
            aria-current={option.id === pool.range ? 'true' : undefined}>
            <span className={/[\u3040-\u30ff\u4e00-\u9fff]/.test(option.label) ? 'jp' : undefined}>{option.label}</span>
          </Link>
        ))}
      </div>
      <MatchGame key={scope} pool={pool.cards} scope={scope} unit={unit}
        initialRecord={settings.gameRecords[gameRecordKey(MATCH_GAME, scope)] ?? null} />
    </>
  );
}
