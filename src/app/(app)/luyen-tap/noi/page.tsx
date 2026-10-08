import { EmptyState } from '@/components/common/StateViews';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { SpeakingPrompt } from '@/components/learning/SpeakingPrompt';
import { buildSpeakingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-25 · Luyện nói — phản xạ đến từ miệng, không đến từ mắt. */
export default async function SpeakingPage() {
  const { catalog, journeyDay } = await getLearnerContext();
  const sentences = buildSpeakingPractice(catalog, journeyDay);
  return (
    <>
      <h1>Luyện nói</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Đọc nghĩa tiếng Việt, rồi nói thành tiếng. Nhìn đáp án sau.
      </p>
      {sentences.length ? (
        sentences.map((pattern, index) => (
          <SpeakingPrompt key={pattern.id} lessonLabel={pattern.lesson.split('·')[0].trim()} promptVi={pattern.exampleVi}
            answerJp={pattern.exampleJp} chipClass={index % 2 ? 'mint' : 'pink'} />
        ))
      ) : (
        <EmptyState message="Chưa có câu nào để luyện nói." hint="Mẫu câu đầu tiên đến vào ngày 15." />
      )}
      <div className="noko-row">
        <SpriteIcon name="noko" size={50} />
        <p>Nói sai cũng không sao. Nói được là đã hơn hôm qua rồi.</p>
      </div>
    </>
  );
}
