import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { WritingPad } from '@/components/learning/WritingPad';
import { DictationPractice } from '@/components/learning/DictationPractice';
import { buildDictationPractice, buildWritingPractice } from '@/features/learning/skill-practice';
import { appDateKey } from '@/features/progress/recall-streak';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-27 · Luyện viết — tay nhớ lâu hơn mắt. */
export default async function WritingPage() {
  const { catalog, journeyDay, memoryViews, now } = await getLearnerContext();
  const practice = buildWritingPractice(catalog, journeyDay);
  const dictation = buildDictationPractice(catalog, memoryViews, journeyDay, appDateKey(now));
  return (
    <>
      <h1>Luyện viết</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Nghe rồi gõ lại bằng tiếng Nhật — sau đó viết tay Kanji, chậm và đúng thứ tự nét.</p>
      <div className="sec-h" style={{ marginTop: 0 }}><h2>🎧 Nghe – gõ</h2></div>
      <DictationPractice words={dictation.words} sentences={dictation.sentences} />
      <div className="sec-h"><h2>✍️ Viết tay Kanji</h2></div>
      {practice ? (
        <>
          <div className="card tight mb-3.5">
            <div className="row">
              <span className="jp glyph" style={{ fontSize: 34 }}>{practice.focus.character}</span>
              <div style={{ flex: 1 }}>
                <b>{practice.focus.hanViet} · {practice.focus.meaning}</b>
                <div className="tiny muted">{practice.focus.strokes} nét · {practice.focus.onReading}・{practice.focus.kunReading || '—'}</div>
              </div>
              <AudioButton text={practice.focus.character} />
            </div>
          </div>
          <WritingPad character={practice.focus.character} reading={practice.focus.kunReading || practice.focus.onReading}
            expectedStrokes={practice.focus.strokes ?? undefined} note={practice.focus.tip} />
          <div className="row wrap mt-3.5" style={{ gap: 7 }}>
            {practice.others.map((kanji) => (
              <KnowledgeChipButton key={kanji.contentKey} contentKey={kanji.contentKey} className="chip jp" style={{ fontSize: 18, padding: '9px 13px' }}>
                {kanji.character}
              </KnowledgeChipButton>
            ))}
          </div>
        </>
      ) : (
        <EmptyState message="Kanji đầu tiên đến vào ngày 15." hint="Trong lúc chờ, bạn luyện viết Hiragana và Katakana ở mục Học tập nhé." />
      )}
    </>
  );
}
