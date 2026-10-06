import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { DayVocabularyList } from './DayVocabularyList';
import { KanaLessonTable } from './KanaLessonTable';
import { primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { DayPlanView } from '@/features/roadmap/day-plan';
import { firstMeaning } from '@/lib/utils/text';

const CHIP_STYLE = { background: '#fff', border: '1px solid var(--line)', padding: '8px 12px' } as const;

/** Kiến thức thật của một ngày, bấm được để xem kỹ. */
export function DayKnowledgeBlock({ plan }: { plan: DayPlanView }) {
  const { knowledge } = plan;
  if (!plan.hasNewKnowledge) {
    return (
      <>
        <div className="card tight" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
          <b className="sm">{plan.day === 90 ? '🏆 Ngày thi' : '🔄 Ôn lại'}</b>
          <p className="sm soft mt-1">
            {plan.day === 90
              ? 'Hôm nay không học thêm gì mới. Mọi thứ bạn cần đã ở trong đầu rồi.'
              : 'Không có kiến thức mới. Hôm nay là lúc để những thứ cũ bám chắc hơn.'}
          </p>
          {plan.reviewTopics.length && plan.day !== 90 ? (
            <>
              <p className="sm mt-2.5"><b>Hôm nay bạn sẽ ôn:</b></p>
              <ul className="sm soft mt-1" style={{ paddingLeft: 18, listStyle: 'disc' }}>
                {plan.reviewTopics.map((topic) => <li key={topic.label}>{topic.label} · {topic.count}</li>)}
              </ul>
            </>
          ) : null}
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
      {plan.kanaLesson ? <div className="mt-2.5"><KanaLessonTable lesson={plan.kanaLesson} /></div> : null}
      {knowledge.grammar.length ? (
        <div className="stack mt-2.5" style={{ gap: 7 }}>
          {knowledge.grammar.map((pattern) => (
            <KnowledgeChipButton key={pattern.id} contentKey={toContentKey('grammar', pattern.id)} className="list-row" style={{ padding: '10px 12px' }}>
              <span className="mid">
                <b className="jp" style={{ fontSize: 14.5 }}>{pattern.pattern}</b>
                <span>{pattern.usage}</span>
                <span className="jp" style={{ color: 'var(--ink)' }}>{pattern.exampleJp}</span>
                {pattern.exampleReading && pattern.exampleReading !== pattern.exampleJp ? <span className="jp tiny muted">{pattern.exampleReading}</span> : null}
                <span>{pattern.exampleVi}</span>
              </span>
              <span className="end"><span className="tiny muted" aria-hidden="true">→</span></span>
            </KnowledgeChipButton>
          ))}
        </div>
      ) : null}
      {knowledge.vocabulary.length ? (
        <DayVocabularyList words={knowledge.vocabulary} />
      ) : null}
    </>
  );
}
