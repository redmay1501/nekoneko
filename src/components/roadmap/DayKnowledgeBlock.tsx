import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { DayPlanView } from '@/features/roadmap/day-plan';
import { firstMeaning } from '@/lib/utils/text';

const MAX_KANA_CHIPS = 24;
const CHIP_STYLE = { background: '#fff', border: '1px solid var(--line)', padding: '8px 12px' } as const;

/** Kiến thức thật của một ngày, bấm được để xem kỹ. */
export function DayKnowledgeBlock({ plan }: { plan: DayPlanView }) {
  const { knowledge } = plan;
  if (!plan.hasNewKnowledge) {
    return (
      <>
        <div className="card tight" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
          <b className="sm">{plan.day === 90 ? '🏆 Ngày thi' : '🔁 Ngày ôn lại'}</b>
          <p className="sm soft mt-1">
            {plan.day === 90
              ? 'Hôm nay không học thêm gì mới. Mọi thứ bạn cần đã ở trong đầu rồi.'
              : 'Không có kiến thức mới. Hôm nay là lúc để những thứ cũ bám chắc hơn.'}
          </p>
        </div>
        {plan.reviewSuggestions.length ? (
          <>
            <div className="sec-h" style={{ margin: '14px 2px 9px' }}><h2 style={{ fontSize: 14 }}>Vài thứ nên gặp lại</h2></div>
            <div className="row wrap" style={{ gap: 6 }}>
              {plan.reviewSuggestions.map((item) => (
                <KnowledgeChipButton key={item.key} contentKey={item.key} style={CHIP_STYLE}>
                  <b className="jp" style={{ fontSize: 14 }}>{item.face}</b>
                  <span className="tiny muted" style={{ fontWeight: 400 }}>{firstMeaning(item.meaning)}</span>
                </KnowledgeChipButton>
              ))}
            </div>
          </>
        ) : null}
      </>
    );
  }

  return (
    <>
      {knowledge.kanji.length || knowledge.radicals.length ? (
        <div className="kgrid">
          {knowledge.radicals.map((radical) => (
            <KnowledgeChipButton key={`r${radical.id}`} contentKey={toContentKey('radical', radical.id)} className="kcard"
              style={{ background: '#F9F6FE', borderColor: '#E6DEF7' }}>
              <span className="big">{primaryRadicalGlyph(radical.radical)}</span>
              <b>Bộ {firstMeaning(radical.meaning)}</b>
              <span>{radical.nameJp.split(' / ')[0]}</span>
            </KnowledgeChipButton>
          ))}
          {knowledge.kanji.map((kanji) => (
            <KnowledgeChipButton key={`k${kanji.id}`} contentKey={toContentKey('kanji', kanji.id)} className="kcard">
              <span className="big">{kanji.character}</span>
              <b>{kanji.hanViet}</b>
              <span>{firstMeaning(kanji.meaning)} · {kanji.strokes} nét</span>
            </KnowledgeChipButton>
          ))}
        </div>
      ) : null}
      {knowledge.kana.length ? (
        <div className="row wrap mt-2.5" style={{ gap: 6 }}>
          {knowledge.kana.slice(0, MAX_KANA_CHIPS).map((kana) => (
            <KnowledgeChipButton key={kana.id} contentKey={toContentKey('hiragana', kana.id)} className="chip jp"
              style={{ ...CHIP_STYLE, fontSize: 17 }}>
              {kana.hiragana}<span className="tiny muted" style={{ fontWeight: 400 }}>{kana.romaji}</span>
            </KnowledgeChipButton>
          ))}
        </div>
      ) : null}
      {knowledge.grammar.length ? (
        <div className="stack mt-2.5" style={{ gap: 7 }}>
          {knowledge.grammar.map((pattern) => (
            <KnowledgeChipButton key={pattern.id} contentKey={toContentKey('grammar', pattern.id)} className="list-row" style={{ padding: '10px 12px' }}>
              <span className="mid"><b className="jp" style={{ fontSize: 14.5 }}>{pattern.pattern}</b><span>{pattern.exampleVi}</span></span>
              <span className="end"><span className="tiny muted" aria-hidden="true">→</span></span>
            </KnowledgeChipButton>
          ))}
        </div>
      ) : null}
      {knowledge.vocabulary.length ? (
        <div className="row wrap mt-2.5" style={{ gap: 6 }}>
          {knowledge.vocabulary.map((word) => (
            <KnowledgeChipButton key={word.id} contentKey={toContentKey('vocabulary', word.id)} style={CHIP_STYLE}>
              <b className="jp" style={{ fontSize: 14 }}>{word.kanji || word.kana}</b>
              <span className="tiny muted" style={{ fontWeight: 400 }}>{firstMeaning(word.meaning)}</span>
            </KnowledgeChipButton>
          ))}
        </div>
      ) : null}
    </>
  );
}
