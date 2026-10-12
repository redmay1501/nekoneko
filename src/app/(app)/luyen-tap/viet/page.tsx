import Link from 'next/link';
import { AudioButton } from '@/components/common/AudioButton';
import { RangeChips } from '@/components/learning/RangeChips';
import { WritingPad } from '@/components/learning/WritingPad';
import { DictationPractice } from '@/components/learning/DictationPractice';
import { buildDictationPractice, buildWritingPractice } from '@/features/learning/skill-practice';
import { appDateKey } from '@/features/progress/recall-streak';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * SC-27 · Luyện viết — tay nhớ lâu hơn mắt. Không khoá theo ngày:
 *  - Nghe – gõ: chọn phạm vi (theo lộ trình / tất cả / một bài);
 *  - Viết tay Kanji: chọn nhóm 10 chữ, rồi chọn chữ.
 */
export default async function WritingPage({ searchParams }: { searchParams: Promise<{ chu?: string; 'pham-vi'?: string; luot?: string }> }) {
  const params = await searchParams;
  const round = Number(params.luot ?? 0) || 0;
  const { catalog, journeyDay, memoryViews, now } = await getLearnerContext();
  const practice = buildWritingPractice(catalog, journeyDay, params.chu);
  const dictation = buildDictationPractice(catalog, memoryViews, journeyDay, `${appDateKey(now)}:${round}`, params['pham-vi']);
  const query = (next: Record<string, string | undefined>) => {
    const merged = { 'pham-vi': dictation.range, chu: practice.focus.character, ...next };
    return `/luyen-tap/viet?${Object.entries(merged).filter(([, value]) => value).map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join('&')}`;
  };
  return (
    <>
      <h1>Luyện viết</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Nghe rồi gõ lại bằng tiếng Nhật — sau đó viết tay Kanji, chậm và đúng thứ tự nét.</p>
      <div className="sec-h" style={{ marginTop: 0 }}><h2>🎧 Nghe – gõ</h2></div>
      <RangeChips label="Phạm vi nghe – gõ" current={dictation.range}
        options={dictation.ranges.map((range) => ({ ...range, href: query({ 'pham-vi': range.id }) }))} />
      <DictationPractice key={`${dictation.range}:${round}`} words={dictation.words} sentences={dictation.sentences} />
      <p className="center mt-2.5"><Link className="btn ghost sm" href={query({ luot: String(round + 1) })} scroll={false}>↻ Bài khác</Link></p>
      <div className="sec-h"><h2>✍️ Viết tay Kanji</h2></div>
      <RangeChips label="Nhóm Kanji" current={practice.groups.find((group) => group.isCurrent)?.id ?? ''}
        options={practice.groups.map((group) => ({ id: group.id, label: `${group.label} · ${group.first}…`, href: query({ chu: group.first }) }))} />
      <div className="row wrap mb-3.5" style={{ gap: 7 }}>
        {practice.others.map((kanji) => (
          <Link key={kanji.contentKey} href={query({ chu: kanji.character })} scroll={false}
            className={`chip jp glyph ${kanji.character === practice.focus.character ? 'pink' : ''}`} style={{ fontSize: 18, padding: '9px 13px' }}
            aria-current={kanji.character === practice.focus.character ? 'true' : undefined}>
            {kanji.character}
          </Link>
        ))}
      </div>
      <div className="card tight mb-3.5">
        <div className="row">
          <span className="jp glyph" style={{ fontSize: 34 }}>{practice.focus.character}</span>
          <div style={{ flex: 1 }}>
            <b>{practice.focus.hanViet} · {practice.focus.meaning}</b>
            <div className="tiny muted">{practice.focus.strokes} nét · {practice.focus.onReading}・{practice.focus.kunReading || '—'}</div>
          </div>
          <AudioButton text={practice.focus.kunReading || practice.focus.onReading || practice.focus.character} />
        </div>
      </div>
      <WritingPad key={practice.focus.character} character={practice.focus.character} reading={practice.focus.kunReading || practice.focus.onReading}
        expectedStrokes={practice.focus.strokes ?? undefined} note={practice.focus.tip} />
    </>
  );
}
