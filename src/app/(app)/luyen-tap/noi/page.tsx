import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { RangePicker } from '@/components/learning/RangePicker';
import { ReadAloudPrompt } from '@/components/learning/ReadAloudPrompt';
import { SpeakingPrompt } from '@/components/learning/SpeakingPrompt';
import { buildSpeakingPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

const MODES = [
  { id: 'tu-nghia', label: '🗣️ Nói từ nghĩa' },
  { id: 'doc-theo-mau', label: '🎙️ Đọc theo mẫu' },
] as const;
type Mode = (typeof MODES)[number]['id'];

/**
 * SC-25 · Luyện nói — phản xạ đến từ miệng, không đến từ mắt. Chọn phạm vi: theo lộ trình, tất cả, hoặc một bài.
 * Hai chế độ: nói từ nghĩa tiếng Việt (tự so đáp án) và đọc theo câu mẫu (trình duyệt nhận diện rồi so chữ — không chấm phát âm).
 */
export default async function SpeakingPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; luot?: string; 'che-do'?: string }> }) {
  const params = await searchParams;
  const round = Number(params.luot ?? 0) || 0;
  const mode: Mode = params['che-do'] === 'doc-theo-mau' ? 'doc-theo-mau' : 'tu-nghia';
  const { catalog, journeyDay } = await getLearnerContext();
  const practice = buildSpeakingPractice(catalog, journeyDay, params['pham-vi'], `speaking:${round}`);
  const hrefFor = (range: string, nextRound = 0, nextMode: Mode = mode) =>
    `/luyen-tap/noi?pham-vi=${range}${nextRound ? `&luot=${nextRound}` : ''}${nextMode === 'tu-nghia' ? '' : `&che-do=${nextMode}`}`;
  return (
    <>
      <h1>Luyện nói</h1>
      <div className="pill-tabs mt-2" role="tablist" aria-label="Chế độ luyện nói">
        {MODES.map((option) => (
          <Link key={option.id} role="tab" aria-selected={option.id === mode} className={`tab ${option.id === mode ? 'on' : ''}`}
            href={hrefFor(practice.range, round, option.id)} scroll={false}>
            {option.label}
          </Link>
        ))}
      </div>
      {mode === 'tu-nghia' ? (
        <p className="soft sm" style={{ margin: '10px 0 12px' }}>Đọc nghĩa tiếng Việt, rồi nói thành tiếng. Nhìn đáp án sau. Chọn bài muốn luyện — kể cả bài chưa học tới.</p>
      ) : (
        <div style={{ margin: '10px 0 12px' }}>
          <p className="soft sm">Nghe mẫu, bấm 🎙️ rồi đọc to. Trình duyệt nhận diện câu bạn nói và so chữ với câu mẫu — đây <b>chưa phải chấm phát âm</b>.</p>
          <p className="tiny muted mt-1">
            Âm thanh do trình duyệt xử lý (Chrome gửi lên dịch vụ nhận diện trực tuyến của Google; Safari dùng bộ nhận diện của Siri).
            NekoNeko không ghi âm, không lưu và không gửi âm thanh lên máy chủ của mình.
          </p>
        </div>
      )}
      <RangePicker title="Phạm vi" current={practice.range}
        options={practice.ranges.map((range, index) => ({ ...range, href: hrefFor(range.id), group: index < 2 ? 'Gợi ý' : 'Theo bài' }))} />
      {practice.sentences.map((pattern, index) => (mode === 'tu-nghia' ? (
        <SpeakingPrompt key={pattern.id} lessonLabel={pattern.lesson.split('·')[0].trim()} promptVi={pattern.exampleVi}
          answerJp={pattern.exampleJp} chipClass={index % 2 ? 'mint' : 'pink'} />
      ) : (
        <ReadAloudPrompt key={pattern.id} lessonLabel={pattern.lesson.split('·')[0].trim()} sentenceJp={pattern.exampleJp}
          reading={pattern.exampleReading} meaningVi={pattern.exampleVi} chipClass={index % 2 ? 'mint' : 'pink'} />
      )))}
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
