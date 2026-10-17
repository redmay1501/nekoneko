import { SpriteIcon } from '@/components/common/SpriteIcon';
import { RangePicker } from '@/components/learning/RangePicker';
import { SpeakingSession } from '@/components/learning/SpeakingSession';
import { buildSpeakingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * SC-25 · Luyện nói — ĐỌC THEO MẪU, mỗi lần một câu: nghe mẫu, đọc to, trình duyệt nhận diện rồi so chữ (không chấm phát âm).
 * Không ghi trí nhớ / tiến độ. Link cũ có ?che-do=… vẫn mở được (tham số bị bỏ qua).
 */
export default async function SpeakingPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; luot?: string; 'che-do'?: string; cau?: string }> }) {
  const params = await searchParams;
  const round = Number(params.luot ?? 0) || 0;
  const { catalog, journeyDay } = await getLearnerContext();
  const practice = buildSpeakingPractice(catalog, journeyDay, params['pham-vi'], `speaking:${round}`);
  const hrefFor = (range: string, nextRound = 0) => `/luyen-tap/noi?pham-vi=${range}${nextRound ? `&luot=${nextRound}` : ''}`;
  return (
    <>
      <h1>Luyện nói</h1>
      <div className="mt-2">
        <RangePicker title="Phạm vi" current={practice.range}
          options={practice.ranges.map((range, index) => ({ ...range, href: hrefFor(range.id), group: index < 2 ? 'Gợi ý' : 'Theo bài' }))} />
      </div>
      <SpeakingSession key={`${practice.range}:${round}`} initialSentence={params.cau}
        otherSetHref={practice.range.startsWith('bai-') ? null : hrefFor(practice.range, round + 1)}
        sentences={practice.sentences.map((pattern) => ({
          id: pattern.id, lessonLabel: pattern.lesson.split('·')[0].trim(), jp: pattern.exampleJp, reading: pattern.exampleReading, vi: pattern.exampleVi,
        }))} />
      <div className="noko-row">
        <SpriteIcon name="noko" size={50} />
        <p>Nói sai cũng không sao. Nói được là đã hơn hôm qua rồi.</p>
      </div>
    </>
  );
}
