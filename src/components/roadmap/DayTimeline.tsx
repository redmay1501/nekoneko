import type { DayPlanView } from '@/features/roadmap/day-plan';
import { percentOf } from '@/lib/utils/text';

/** "Buổi học diễn ra thế nào" — dải thời gian + dòng thời gian các chặng trong ngày. */
export function DayTimeline({ plan }: { plan: DayPlanView }) {
  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Buổi học diễn ra thế nào</h2>
        <span className="tiny muted">{plan.tasks.length} chặng · {plan.totalMinutes} phút</span>
      </div>
      <div className="ribbon" aria-hidden="true">
        {plan.tasks.map((task, index) => (
          <span key={index} style={{ width: `${percentOf(task.minutes, plan.totalMinutes)}%`, background: task.background }} title={task.name} />
        ))}
      </div>
      <div className="tl">
        {plan.tasks.map((task, index) => (
          <div key={index} className="tl-i">
            <span className="tl-dot" style={{ background: task.background, color: task.color }} aria-hidden="true">{task.glyph}</span>
            <div className="tl-body">
              <div className="hd"><b>{task.name}</b><span className="tiny muted">{task.minutes} phút</span></div>
              {task.lines.map((line, lineIndex) => {
                if (line.kind === 'bullet') {
                  return (
                    <div key={lineIndex} className="tl-bullet">
                      <span className="d" aria-hidden="true">◆</span><span className="jp">{line.text}</span>
                    </div>
                  );
                }
                return <p key={lineIndex} className={line.kind === 'sub' ? 'tl-sub' : 'tl-line'}>{line.text}</p>;
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
