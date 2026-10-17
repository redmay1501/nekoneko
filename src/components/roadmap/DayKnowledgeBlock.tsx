import Link from 'next/link';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { DayVocabularyList } from './DayVocabularyList';
import { KanaLessonTable } from './KanaLessonTable';
import { canRomanize, patternRomaji, sentenceRomaji } from '@/lib/utils/romaji';
import { primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
import { CONTENT_TYPE_LABELS, toContentKey } from '@/features/learning/knowledge-types';
import { MAX_FOCUS_ITEMS, focusSessionHref } from '@/features/learning/session-modes';
import type { DayPlanView } from '@/features/roadmap/day-plan';
import { firstMeaning } from '@/lib/utils/text';

const CHIP_STYLE = { background: '#fff', border: '1px solid var(--line)', padding: '8px 12px' } as const;

/** Tiêu đề một phần kiến thức + lối vào thẻ học / kiểm tra của đúng phần đó trong luồng học theo ngày. */
function StepHeading({ label, note, day, step }: { label: string; note?: string; day: number; step: string }) {
  return (
    <div className="day-step-head">
      <p className="day-step-label">{label}{note ? <span className="tiny muted"> · {note}</span> : null}</p>
      <Link className="day-step-link" href={`/lo-trinh/ngay/${day}/hoc?buoc=${step}`}>Thẻ & kiểm tra →</Link>
    </div>
  );
}

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
          {plan.reviewWindow ? (
            <div className="review-window mt-2.5">
              <p className="sm"><b>Ôn kiến thức ngày {plan.reviewWindow.from}–{plan.reviewWindow.to}:</b>{' '}
                {plan.reviewWindow.counts.map((entry) => `${entry.count} ${CONTENT_TYPE_LABELS[entry.type].toLowerCase()}`).join(' · ')}</p>
              <Link className="btn review sm mt-2" href={focusSessionHref(plan.reviewWindow.keys)}>
                🔁 Ôn kiến thức tuần ({Math.min(plan.reviewWindow.keys.length, MAX_FOCUS_ITEMS)} mục)
              </Link>
            </div>
          ) : null}
          {plan.reviewTopics.length && plan.day !== 90 && !plan.reviewWindow ? (
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

  // Thứ tự học của ngày: Chữ cái → Bộ thủ → Từ vựng → Kanji → Ngữ pháp. Kanji học TRONG từ của ngày (docs/ROADMAP_REPLAN.md):
  // mỗi chữ hiện cùng từ chứa nó, cách đọc trong từ đó và các từ đã gặp trước có cùng chữ. Số thứ tự đánh theo phần có trong ngày.
  const steps = [
    knowledge.kana.length && 'kana', knowledge.radicals.length && 'radical', knowledge.vocabulary.length && 'vocabulary',
    knowledge.kanji.length && 'kanji', knowledge.grammar.length && 'grammar',
  ].filter(Boolean);
  const number = (step: string) => '①②③④⑤'[steps.indexOf(step)];
  return (
    <>
      {knowledge.kana.length ? (
        <StepHeading label={`${number('kana')} Chữ cái`} note={`${knowledge.kana.length} chữ`} day={plan.day} step="chu-cai" />
      ) : null}
      {plan.kanaLesson ? <div className="mt-2.5"><KanaLessonTable lesson={plan.kanaLesson} /></div> : null}
      {knowledge.radicals.length ? (
        <>
          <StepHeading label={`${number('radical')} Bộ thủ`} note="nhận diện mặt chữ — không cần viết nhiều lần" day={plan.day} step="bo-thu" />
          <div className="kgrid">
            {knowledge.radicals.map((radical) => (
              <KnowledgeChipButton key={`r${radical.id}`} contentKey={toContentKey('radical', radical.id)} className="kcard"
                style={{ background: '#F9F6FE', borderColor: '#E6DEF7' }}>
                <span className="big">{primaryRadicalGlyph(radical.radical)}</span>
                <b>Bộ {firstMeaning(radical.meaning)}</b>
                <span>{radical.nameJp.split(' / ')[0]}</span>
              </KnowledgeChipButton>
            ))}
          </div>
        </>
      ) : null}
      {knowledge.vocabulary.length ? (
        <>
          <StepHeading label={`${number('vocabulary')} Từ vựng`} day={plan.day} step="tu-vung" />
          <DayVocabularyList words={knowledge.vocabulary} />
        </>
      ) : null}
      {knowledge.kanji.length ? (
        <>
          <StepHeading label={`${number('kanji')} ${knowledge.vocabulary.length ? 'Kanji trong từ hôm nay' : 'Kanji N5 — học qua từ ví dụ'}`} note={`${knowledge.kanji.length} chữ`} day={plan.day} step="kanji" />
          <div className="stack mt-2.5" style={{ gap: 7 }}>
            {knowledge.kanji.map((kanji) => {
              const context = plan.kanjiContext[kanji.id];
              return (
                <KnowledgeChipButton key={`k${kanji.id}`} contentKey={toContentKey('kanji', kanji.id)} className="list-row kanji-row" style={{ padding: '10px 12px' }}>
                  <span className="kanji-row-glyph jp" aria-hidden="true">{kanji.character}</span>
                  <span className="mid">
                    <b>{kanji.character} · {kanji.hanViet}</b>
                    <span>{firstMeaning(kanji.meaning)}{kanji.strokes ? ` · ${kanji.strokes} nét` : ''}</span>
                    {context?.today.map(({ word, reading }) => (
                      <span key={word.id} className="kanji-row-word">
                        <b className="jp">{word.kanji}</b> <span className="jp soft">（{word.kana}）</span> {word.meaning}
                        {reading ? <span className="kanji-row-reading"> · <span className="jp">{kanji.character}</span> đọc là <b className="jp">{reading}</b></span> : null}
                      </span>
                    ))}
                    {!context?.today.length && kanji.words ? <span className="tiny muted jp">Từ ví dụ: {kanji.words}</span> : null}
                    {context?.earlier.length ? (
                      <span className="tiny muted">Đã gặp trong: <span className="jp">{context.earlier.map((word) => word.kanji).join(' · ')}</span></span>
                    ) : null}
                  </span>
                  <span className="end"><span className="tiny muted" aria-hidden="true">→</span></span>
                </KnowledgeChipButton>
              );
            })}
          </div>
        </>
      ) : null}
      {knowledge.grammar.length ? (
        <>
          <StepHeading label={`${number('grammar')} Ngữ pháp`} note={`${knowledge.grammar.length} mẫu câu`} day={plan.day} step="ngu-phap" />
          <div className="stack mt-2.5" style={{ gap: 7 }}>
            {knowledge.grammar.map((pattern) => (
              <KnowledgeChipButton key={pattern.id} contentKey={toContentKey('grammar', pattern.id)} className="list-row" style={{ padding: '10px 12px' }}>
                <span className="mid">
                  <b className="jp" style={{ fontSize: 14.5 }}>{pattern.pattern}</b>
                  {patternRomaji(pattern.pattern) ? <span className="romaji">{patternRomaji(pattern.pattern)}</span> : null}
                  <span>{pattern.usage}</span>
                  <span className="jp" style={{ color: 'var(--ink)' }}>{pattern.exampleJp}</span>
                  {pattern.exampleReading && pattern.exampleReading !== pattern.exampleJp ? <span className="jp tiny muted">{pattern.exampleReading}</span> : null}
                  {canRomanize(pattern.exampleReading || pattern.exampleJp) ? <span className="romaji">{sentenceRomaji(pattern.exampleReading || pattern.exampleJp)}</span> : null}
                  <span>{pattern.exampleVi}</span>
                </span>
                <span className="end"><span className="tiny muted" aria-hidden="true">→</span></span>
              </KnowledgeChipButton>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
