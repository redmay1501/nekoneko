import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { RangeChips } from '@/components/learning/RangeChips';
import { SpeakingPrompt } from '@/components/learning/SpeakingPrompt';
import { buildSpeakingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-25 · Luyện nói — phản xạ đến từ miệng, không đến từ mắt. Chọn phạm vi: theo lộ trình, tất cả, hoặc một bài. */
export default async function SpeakingPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; luot?: string }> }) {
  const params = await searchParams;
  const round = Number(params.luot ?? 0) || 0;
  const { catalog, journeyDay } = await getLearnerContext();
  const practice = buildSpeakingPractice(catalog, journeyDay, params['pham-vi'], `speaking:${round}`);
  const hrefFor = (range: string, nextRound = 0) => `/luyen-tap/noi?pham-vi=${range}${nextRound ? `&luot=${nextRound}` : ''}`;
  return (
    <>
      <h1>Luyện nói</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>Đọc nghĩa tiếng Việt, rồi nói thành tiếng. Nhìn đáp án sau. Chọn bài muốn luyện — kể cả bài chưa học tới.</p>
      <RangeChips label="Phạm vi luyện nói" current={practice.range}
        options={practice.ranges.map((range) => ({ ...range, href: hrefFor(range.id) }))} />
      {practice.sentences.map((pattern, index) => (
        <SpeakingPrompt key={pattern.id} lessonLabel={pattern.lesson.split('·')[0].trim()} promptVi={pattern.exampleVi}
          answerJp={pattern.exampleJp} chipClass={index % 2 ? 'mint' : 'pink'} />
      ))}
      {practice.range.startsWith('bai-') ? null : (
        <p className="center mt-2.5"><Link className="btn ghost sm" href={hrefFor(practice.range, round + 1)} scroll={false}>↻ Câu khác</Link></p>
      )}
      <div className="noko-row">
        <SpriteIcon name="noko" size={50} />
        <p>Nói sai cũng không sao. Nói được là đã hơn hôm qua rồi.</p>
      </div>
    </>
  );
}
