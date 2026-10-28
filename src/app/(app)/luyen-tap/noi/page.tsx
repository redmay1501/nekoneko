import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { RangePicker } from '@/components/learning/RangePicker';
import { SpeakingSession } from '@/components/learning/SpeakingSession';
import { SPEAKING_KINDS, type SpeakingKind, buildKanaDictionary, buildSpeakingItems, buildSpeakingPractice, parseSpeakingKind } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * SC-25 · Luyện nói — ĐỌC THEO MẪU, mỗi lần một câu / từ / chữ: nghe mẫu, ghi âm, nghe lại; AI nhận diện chạy TRÊN THIẾT BỊ
 * (Whisper, bản ghi không rời máy) rồi so chữ với mẫu + đo âm thanh — không chấm phát âm. Không ghi trí nhớ / tiến độ.
 * ?loai=cau (câu ví dụ ngữ pháp, chọn phạm vi theo bài) · tu (từ đã học) · chu (chữ cái đã học). Link cũ có ?che-do=… vẫn mở được.
 */
export default async function SpeakingPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; luot?: string; 'che-do'?: string; cau?: string; loai?: string }> }) {
  const params = await searchParams;
  const round = Number(params.luot ?? 0) || 0;
  const kind = parseSpeakingKind(params.loai);
  const { catalog, journeyDay, memoryViews } = await getLearnerContext();
  const kanaDictionary = buildKanaDictionary(catalog);
  const kindHref = (next: SpeakingKind) => `/luyen-tap/noi${next === 'cau' ? '' : `?loai=${next}`}`;
  const tabs = (
    <div className="pill-tabs mt-2" role="tablist" aria-label="Nội dung luyện nói">
      {(Object.keys(SPEAKING_KINDS) as SpeakingKind[]).map((option) => (
        <Link key={option} role="tab" aria-selected={option === kind} className={`tab ${option === kind ? 'on' : ''}`} href={kindHref(option)} scroll={false}>
          {SPEAKING_KINDS[option]}
        </Link>
      ))}
    </div>
  );

  if (kind !== 'cau') {
    const items = buildSpeakingItems(catalog, memoryViews, journeyDay, kind, `speaking:${round}`);
    return (
      <>
        <h1>Luyện nói</h1>
        {tabs}
        {items.length ? (
          <SpeakingSession key={`${kind}:${round}`} initialSentence={params.cau} sentences={items} kanaDictionary={kanaDictionary} otherSetHref={`/luyen-tap/noi?loai=${kind}&luot=${round + 1}`} />
        ) : (
          <p className="card tight sm soft mt-3">Chưa có {kind === 'tu' ? 'từ' : 'chữ cái'} nào bạn đã học tới ngày {journeyDay}. Học thêm trong Lộ trình rồi quay lại nhé.</p>
        )}
        <SpeakingFooter />
      </>
    );
  }

  const practice = buildSpeakingPractice(catalog, journeyDay, params['pham-vi'], `speaking:${round}`);
  const hrefFor = (range: string, nextRound = 0) => `/luyen-tap/noi?pham-vi=${range}${nextRound ? `&luot=${nextRound}` : ''}`;
  return (
    <>
      <h1>Luyện nói</h1>
      {tabs}
      <div className="mt-2">
        <RangePicker title="Phạm vi" current={practice.range}
          options={practice.ranges.map((range, index) => ({ ...range, href: hrefFor(range.id), group: index < 2 ? 'Gợi ý' : 'Theo bài' }))} />
      </div>
      <SpeakingSession key={`${practice.range}:${round}`} initialSentence={params.cau} kanaDictionary={kanaDictionary}
        otherSetHref={practice.range.startsWith('bai-') ? null : hrefFor(practice.range, round + 1)}
        sentences={practice.sentences.map((pattern) => ({
          id: pattern.id, lessonLabel: pattern.lesson.split('·')[0].trim(), jp: pattern.exampleJp, reading: pattern.exampleReading, vi: pattern.exampleVi,
        }))} />
      <SpeakingFooter />
    </>
  );
}

function SpeakingFooter() {
  return (
    <div className="noko-row">
      <SpriteIcon name="noko" size={50} />
      <p>Nói sai cũng không sao. Nói được là đã hơn hôm qua rồi.</p>
    </div>
  );
}
