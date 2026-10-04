import Link from 'next/link';
import { NokoMessage } from '@/components/common/NokoMessage';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { getLearnerContext } from '@/features/learning/learner-context';
import { SESSION_MODES } from '@/features/learning/session-modes';
import { CompleteDayButton } from '@/components/roadmap/CompleteDayButton';
import { estimateMinutesToFinishDay, getDayCompletionProgress, isDayReadyToComplete, remainingKnowledgeCount } from '@/features/roadmap/journey-progress';
import { getFinishedSession } from '@/features/learning/session-service';
import { AnimatedEmoji, EmojiIcon } from '@/components/common/EmojiIcon';

const WIN_LINES = [
  { key: 'recalled', icon: '🧠', background: '#FFEFF2', label: 'kiến thức được nhớ lại', hint: 'Trí nhớ của chúng vừa được làm mới' },
  { key: 'learnedNew', icon: '🌱', background: 'var(--mint)', label: 'kiến thức mới', hint: 'Vừa gieo xuống vườn của bạn' },
  { key: 'usedInContext', icon: '💬', background: 'var(--sky)', label: 'kiến thức được sử dụng trong câu', hint: 'Dùng được ngoài đời thật' },
] as const;

/** SC-08 · Khoảnh khắc tiến bộ — kết phiên bằng cảm xúc, không bằng điểm số. */
export default async function TinyWinPage({ searchParams }: { searchParams: Promise<{ phien?: string }> }) {
  const sessionId = (await searchParams).phien;
  const [finished, context] = await Promise.all([sessionId ? getFinishedSession(sessionId) : null, getLearnerContext()]);
  if (!finished) {
    return (
      <div className="session center">
        <NokoMessage state="idle" text="Mình không tìm thấy phiên học này. Bắt đầu một phiên mới nhé 🌸" />
        <Link className="btn block mt-4" href="/hoc/daily">Học hôm nay</Link>
      </div>
    );
  }
  const { summary, mode } = finished;
  const highlightMemory = summary.highlight ? context.memoryViews.get(summary.highlight.contentKey) : undefined;
  // Gợi ý bước tiếp theo theo ngày đang học: còn kiến thức thì học tiếp; học hết rồi thì mời hoàn thành ngày.
  const dayCompletion = getDayCompletionProgress(context.catalog, context.memoryViews, context.journeyDay);
  const remainingToday = remainingKnowledgeCount(dayCompletion);

  return (
    <div className="session center">
      <SpriteIcon name="noko" size={110} className="pop mx-auto mt-2.5" />
      <h1 className="mt-2">Khoảnh khắc tiến bộ 🌸</h1>
      <p className="soft mt-1.5">Hôm nay bạn đã:</p>
      <div className="card mt-4" style={{ textAlign: 'left' }}>
        <div className="steps" style={{ margin: 0 }}>
          {WIN_LINES.map((line) => (
            <div key={line.key} className="step">
              <span className="step-ic" style={{ background: line.background }} aria-hidden="true"><EmojiIcon emoji={line.icon} size={24} /></span>
              <span className="step-l"><b>{summary[line.key]} {line.label}</b><span>{line.hint}</span></span>
            </div>
          ))}
        </div>
        {summary.highlight ? (
          <div className="card tight mt-3" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
            <p className="sm">Bạn vừa nhớ lại <b className="jp">{summary.highlight.face}</b> sau {summary.highlight.daysSinceSeen} ngày.</p>
            {highlightMemory ? (
              <p className="tiny muted mt-1">Neko Neko sẽ đưa nó quay lại {highlightMemory.nextEncounterText.toLowerCase()}.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {isDayReadyToComplete(context.journey, dayCompletion) ? (
        <div className="card mt-4" style={{ background: 'var(--mint)', borderColor: 'transparent', textAlign: 'left' }}>
          <p className="sm"><b><AnimatedEmoji name="party-popper" size={28} className="inline-emoji" /> Bạn đã học hết {dayCompletion.totalCount} kiến thức của ngày {context.journeyDay}.</b></p>
          <p className="sm soft mt-1">Thấy thuộc rồi thì hoàn thành ngày để mở ngày tiếp theo. Chưa chắc thì cứ ôn thêm — không vội.</p>
          <CompleteDayButton day={context.journeyDay} isPrimary />
        </div>
      ) : null}
      <NokoMessage state="achievement" className="mt-4" />
      {remainingToday > 0 ? (
        <Link className="btn block mt-4" href="/hoc/day">
          📘 Học tiếp ngày {context.journeyDay} · còn {remainingToday} kiến thức · ~{estimateMinutesToFinishDay(dayCompletion)} phút
        </Link>
      ) : mode === SESSION_MODES.FLOW ? (
        <Link className="btn block mt-4" href="/hoc/flow">🌊 Tiếp một vòng nữa</Link>
      ) : null}
      <Link className={`btn ${remainingToday > 0 || mode === SESSION_MODES.FLOW ? 'ghost' : ''} block mt-2`} href="/hoc/more">Học thêm 5 phút</Link>
      <Link className="btn quiet block mt-2" href="/nghi">Đủ rồi, nghỉ thôi</Link>
      <p className="tiny muted mt-3.5">Dừng lại đúng lúc cũng là một phần của việc học.</p>
    </div>
  );
}
