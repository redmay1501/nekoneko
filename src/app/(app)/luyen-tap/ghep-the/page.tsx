import Link from 'next/link';
import { MatchGame } from '@/components/games/MatchGame';
import { MATCH_GAME, MIN_MATCH_POOL, gameRecordKey } from '@/features/games/match-game';
import {
  MATCH_KINDS, MATCH_RANGES, type MatchKind, type MatchRange, buildMatchPool, matchRangeLabel, parseMatchKind, parseMatchRange, playableLessons,
} from '@/features/games/match-pool';
import { getLearnerContext } from '@/features/learning/learner-context';

const hrefFor = (kind: MatchKind, range: MatchRange) => `/luyen-tap/ghep-the?loai=${kind}&pham-vi=${range}`;

/**
 * Trò chơi Ghép thẻ — ôn kiến thức đã học, có thời gian, độ chính xác và kỷ lục.
 * Không thay phiên học: điểm game không tính vào trí nhớ (features/games/match-game.ts).
 */
export default async function MatchGamePage({ searchParams }: { searchParams: Promise<{ loai?: string; 'pham-vi'?: string }> }) {
  const params = await searchParams;
  const kind = parseMatchKind(params.loai);
  const range = parseMatchRange(params['pham-vi'], kind);
  const { catalog, memoryViews, settings } = await getLearnerContext();
  const pool = buildMatchPool(catalog, memoryViews, kind, range);
  const scope = `${kind}:${range}`;
  const lessons = kind === 'tu-vung' ? playableLessons(catalog, memoryViews, MIN_MATCH_POOL) : [];
  const ranges: MatchRange[] = [...(Object.keys(MATCH_RANGES) as MatchRange[]), ...lessons.map((lesson) => `bai-${lesson}` as const)];
  const unit = kind === 'kanji' ? 'chữ' : 'từ';
  return (
    <>
      <div className="between">
        <h1>🃏 Ghép thẻ</h1>
        <Link className="link sm" href="/luyen-tap">← Luyện tập</Link>
      </div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Ghép chữ Nhật với nghĩa — chỉ những {unit} bạn đã học. Chơi lại để phá kỷ lục, nhắm 100% không sai.
      </p>
      <div className="pill-tabs" role="tablist" aria-label="Loại kiến thức">
        {(Object.keys(MATCH_KINDS) as MatchKind[]).map((option) => (
          <Link key={option} role="tab" aria-selected={option === kind} className={`tab ${option === kind ? 'on' : ''}`} href={hrefFor(option, 'tat-ca')}>
            {MATCH_KINDS[option]}
          </Link>
        ))}
      </div>
      <div className="row wrap mt-2.5 mb-3.5" style={{ gap: 6 }} aria-label="Phạm vi">
        {ranges.map((option) => (
          <Link key={option} className={`chip ${option === range ? 'pink' : ''}`} href={hrefFor(kind, option)} aria-current={option === range ? 'true' : undefined}>
            {matchRangeLabel(option)}
          </Link>
        ))}
      </div>
      <MatchGame key={scope} pool={pool} scope={scope} unit={unit}
        initialRecord={settings.gameRecords[gameRecordKey(MATCH_GAME, scope)] ?? null} />
    </>
  );
}
