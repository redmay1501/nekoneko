import Link from 'next/link';
import { RadicalExpandable } from './RadicalExpandable';
import { kanjiVisualAssetsOf, vocabularyImageOf } from '@/features/learning/vocabulary-images';
import { AudioButton } from '@/components/common/AudioButton';
import { speechTextFor } from '@/features/learning/speech-text';
import { MemoryStatusCard } from '@/components/memory/MemoryStatusCard';
import type { KnowledgeDetailView } from '@/features/learning/knowledge-detail';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { ChainNode } from '@/features/learning/knowledge-presenter';
import { KnowledgeChipButton } from './KnowledgeChipButton';

/**
 * Nội dung chi tiết một kiến thức (prototype openDetail).
 * Dùng cho cả khay trượt (bấm từ danh sách) và trang riêng /hoc-tap/…/[id].
 * Chỉ hiển thị — dữ liệu và quan hệ đã được dựng sẵn ở server (knowledge-detail.ts).
 */

interface RelatedChip {
  contentKey: string;
  face: string;
  caption: string;
}

function RelatedRow({ title, chips }: { title: string; chips: RelatedChip[] }) {
  if (!chips.length) return null;
  return (
    <>
      <div className="sec-h" style={{ margin: '16px 2px 9px' }}><h2 style={{ fontSize: 14 }}>{title}</h2></div>
      <div className="row wrap" style={{ gap: 7 }}>
        {chips.map((chip) => (
          <KnowledgeChipButton key={chip.contentKey} contentKey={chip.contentKey}
            style={{ background: '#fff', border: '1px solid var(--line)', padding: '8px 12px' }}>
            <b className="jp" style={{ fontSize: 16 }}>{chip.face}</b>
            <span className="tiny muted" style={{ fontWeight: 400 }}>{chip.caption}</span>
          </KnowledgeChipButton>
        ))}
      </div>
    </>
  );
}

function KnowledgeChain({ nodes }: { nodes: ChainNode[] }) {
  if (nodes.length < 2) return null;
  return (
    <>
      <div className="sec-h" style={{ margin: '16px 2px 7px' }}><h2 style={{ fontSize: 14 }}>Nó nối với cái gì</h2></div>
      <div className="chain">
        {nodes.map((node, index) => (
          <div key={`${node.face}-${index}`} className="contents">
            {index > 0 ? <span className="arw" aria-hidden="true">↓</span> : null}
            <div className="node"><span className="jp">{node.face}</span><small>{node.caption}</small></div>
          </div>
        ))}
      </div>
    </>
  );
}

function TipCard({ tip, background = 'var(--cream)' }: { tip: string; background?: string }) {
  if (!tip.trim()) return null;
  return (
    <div className="card tight mt-3" style={{ background, borderColor: background === 'var(--cream)' ? '#F3E4CC' : 'transparent' }}>
      <b className="sm">💡 Mẹo nhớ</b>
      <p className="sm soft mt-1">{tip}</p>
    </div>
  );
}

function DetailBody({ detail }: { detail: KnowledgeDetailView }) {
  const { item, related, memory } = detail;
  const statusCard = memory.isLearned ? <div className="mt-3.5"><MemoryStatusCard memory={memory} /></div> : null;

  switch (item.type) {
    case 'hiragana':
    case 'katakana': {
      const writingHref = item.type === 'hiragana' ? '/hoc-tap/hiragana' : '/hoc-tap/katakana';
      return (
        <>
          <div className="center">
            <div className="jp" style={{ fontSize: 86, lineHeight: 1 }}>{item.face}</div>
            <p className="muted" style={{ letterSpacing: '.08em' }}>{item.content.romaji}</p>
            <div className="row" style={{ justifyContent: 'center', gap: 8, margin: '14px 0' }}>
              <AudioButton text={speechTextFor(item)} className="btn ghost sm" label="Nghe" />
              <Link className="btn ghost sm" href={writingHref}>✍️ Luyện viết</Link>
            </div>
          </div>
          <TipCard tip={item.content.tip} />
          {statusCard}
          <p className="tiny muted center mt-2.5">{item.day ? <>Học vào <DayLink day={item.day} /> · </> : null}chữ số {item.id}/104</p>
        </>
      );
    }
    case 'radical':
      return (
        <>
          <div className="row" style={{ gap: 14 }}>
            <span className="jp" style={{ fontSize: 60, lineHeight: 1 }}>{item.face}</span>
            <div>
              <h2>{item.content.meaning}</h2>
              <p className="jp soft">{item.content.nameJp}</p>
              <p className="tiny muted">{item.day ? <>Bộ thủ của lộ trình · học <DayLink day={item.day} /></> : 'Bộ tham khảo — không có ngày học riêng, gặp khi học Kanji chứa nó'}</p>
            </div>
          </div>
          <TipCard tip={item.content.tip} background="var(--lav)" />
          <RelatedRow title="Kanji chứa bộ này" chips={related.kanji.map((kanji) => ({
            contentKey: toContentKey('kanji', kanji.id), face: kanji.character, caption: kanji.meaning }))} />
          {statusCard}
        </>
      );
    case 'kanji':
      return (
        <>
          <div className="row" style={{ gap: 14 }}>
            <span className="jp" style={{ fontSize: 66, lineHeight: 1 }}>{item.face}</span>
            <div style={{ flex: 1 }}>
              <h2>{item.content.hanViet}</h2>
              <p className="soft">{item.content.meaning}</p>
              <div className="row wrap" style={{ gap: 6, marginTop: 7 }}>
                <span className="chip">{item.content.strokes} nét</span>
                {item.day ? <DayLink day={item.day} className="chip" /> : null}
              </div>
            </div>
            <AudioButton text={speechTextFor(item)} />
          </div>
          {kanjiVisualAssetsOf(item.id).map((asset) => asset.imageUrl ? (
            <figure className="card tight mt-3" key={`${asset.assetKind}-${asset.imageUrl}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local curated learning asset; supports SVG stroke sequences and raster mnemonics. */}
              <img src={asset.imageUrl} alt={`${item.face} ${asset.assetKind.replace('_', ' ')}`} className="learning-visual-asset" />
              <figcaption className="tiny muted center mt-1">{asset.assetKind.replace('_', ' ')}</figcaption>
            </figure>
          ) : null)}
          <div className="grid two mt-3.5">
            <div className="card tight"><span className="tiny muted">Âm On 音</span><p className="jp" style={{ fontSize: 17 }}>{item.content.onReading || '—'}</p></div>
            <div className="card tight"><span className="tiny muted">Âm Kun 訓</span><p className="jp" style={{ fontSize: 17 }}>{item.content.kunReading || '—'}</p></div>
          </div>
          <TipCard tip={item.content.tip} />
          <div className="sec-h" style={{ margin: '16px 2px 7px' }}><h2 style={{ fontSize: 14 }}>Từ ghép thường gặp</h2></div>
          <p className="jp sm" style={{ lineHeight: 1.9 }}>{item.content.words}</p>
          {related.radicalDetails.length ? (
            <>
              <div className="sec-h" style={{ margin: '16px 2px 4px' }}><h2 style={{ fontSize: 14 }}>Bộ thủ liên quan</h2></div>
              <p className="jp" style={{ fontSize: 17 }}>
                {item.face} = {related.radicalDetails.map((radical) => `${radical.face} (${radical.meaning.split(/[,;]/)[0].toLowerCase()})`).join(' + ')}
              </p>
              <p className="tiny muted mb-2">💡 Bấm vào bộ thủ để xem mẹo nhớ — bộ đầu tiên là bộ chính của chữ.</p>
              <div className="stack" style={{ gap: 6 }}>
                {related.radicalDetails.map((radical) => <RadicalExpandable key={radical.id} radical={radical} compact />)}
              </div>
            </>
          ) : null}
          <RelatedRow title="Từ vựng N5 có chữ này" chips={related.vocabulary.map((word) => ({
            contentKey: toContentKey('vocabulary', word.id), face: word.kanji || word.kana, caption: word.meaning }))} />
          {statusCard}
        </>
      );
    case 'vocabulary':
      return (
        <>
          <div className="row" style={{ gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="jp" style={{ fontSize: 42, lineHeight: 1.1 }}>{item.face}</div>
              <p className="jp soft mt-1">{item.content.kana}</p>
              <h2 className="mt-2">{item.content.meaning}</h2>
            </div>
            {vocabularyImageOf(item.id) ? (
              // eslint-disable-next-line @next/next/no-img-element -- icon tĩnh 128px trong public/, không cần tối ưu ảnh
              <img src={vocabularyImageOf(item.id)!} alt="" width={72} height={72} className="vocab-image" />
            ) : null}
            <AudioButton text={item.content.kana} />
          </div>
          <div className="row wrap mt-2.5" style={{ gap: 6 }}>
            <span className="chip lav">{item.content.lesson.split('·')[0].trim()}</span>
            {item.day ? <DayLink day={item.day} className="chip" /> : null}
          </div>
          <TipCard tip={item.content.tip} />
          <RelatedRow title="Kanji trong từ này" chips={related.kanji.map((kanji) => ({
            contentKey: toContentKey('kanji', kanji.id), face: kanji.character, caption: kanji.meaning }))} />
          {related.grammar.length ? (
            <>
              <div className="sec-h" style={{ margin: '16px 2px 7px' }}><h2 style={{ fontSize: 14 }}>Gặp trong câu</h2></div>
              {related.grammar.map((pattern) => (
                <div key={pattern.id} className="card tight mb-2">
                  <p className="jp">{pattern.exampleJp}</p>
                  <p className="sm muted mt-1">{pattern.exampleVi}</p>
                </div>
              ))}
            </>
          ) : null}
          {statusCard}
        </>
      );
    case 'grammar':
      return (
        <>
          <div className="chip lav">{item.content.lesson}</div>
          <h2 className="jp" style={{ fontSize: 26, margin: '12px 0 6px' }}>{item.content.pattern}</h2>
          <p className="soft">{item.content.usage}</p>
          {item.content.whenToUse ? <p className="sm mt-2"><b>Khi nào dùng?</b> {item.content.whenToUse}</p> : null}
          {[
            { jp: item.content.exampleJp, reading: item.content.exampleReading, vi: item.content.exampleVi },
            { jp: item.content.example2Jp, reading: item.content.example2Reading, vi: item.content.example2Vi },
          ].filter((example) => example.jp).map((example, index) => (
            <div key={example.jp} className="card tight mt-3" style={{ background: 'var(--sky)', borderColor: 'transparent' }}>
              <div className="between"><b className="sm">Ví dụ {index + 1}</b><AudioButton text={example.jp} /></div>
              <p className="jp mt-1.5" style={{ fontSize: 18 }}>{example.jp}</p>
              {example.reading && example.reading !== example.jp ? <p className="jp sm muted">{example.reading}</p> : null}
              <p className="sm soft mt-1">{example.vi}</p>
            </div>
          ))}
          <div className="card tight mt-3">
            <b className="sm">⚠️ Lỗi thường gặp</b>
            <p className="sm soft mt-1">{detail.commonMistake}</p>
          </div>
          <Link className="btn block mt-3.5" href="/hoc/use">Luyện mẫu này trong câu</Link>
          {statusCard}
        </>
      );
  }
}

export function KnowledgeDetailContent({ detail }: { detail: KnowledgeDetailView }) {
  return (
    <div>
      <DetailBody detail={detail} />
      <KnowledgeChain nodes={detail.chain} />
      {detail.memory.isLearned ? (
        <Link className="btn block mt-3.5" href={`/tri-nho/cuu/${detail.item.key}`}>🌸 Gặp lại kiến thức này</Link>
      ) : null}
    </div>
  );
}

/** "Ngày N" bấm được → trang ngày đã học kiến thức này (khay tự đóng khi chuyển trang). */
function DayLink({ day, className = 'link' }: { day: number; className?: string }) {
  return <Link href={`/lo-trinh/ngay/${day}`} className={className}>ngày {day} →</Link>;
}
