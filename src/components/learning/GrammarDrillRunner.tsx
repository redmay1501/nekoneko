'use client';

import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import type { DialogueDrill, GrammarDrill, ItemDrill } from '@/features/learning/grammar-drills';
import { checkBlank, checkItem, renderLine, similarity, type ExerciseItem } from '@/lib/utils/drill-checker';

/** Kết quả một câu: đúng / sai / tự đánh giá (hỏi đáp tự do: người học bấm "đúng ý" hay "chưa đúng"). */
type ItemState = { input: string; status: 'idle' | 'correct' | 'wrong' | 'review'; selfCorrect?: boolean };

/**
 * Bài tập luyện tập ngữ pháp (content/seed/grammar-drills.json): luyện thay thế, biến đổi câu, hỏi đáp theo gợi ý,
 * hội thoại điền chỗ trống. Chấm bằng drill-checker (NFKC, bỏ dấu câu, chấp nhận gõ toàn kana). Mục ví dụ (is_example)
 * hiện sẵn đáp án, không tính điểm. Không ghi kết quả vào trí nhớ — chỉ luyện.
 */
export function GrammarDrillRunner({ drills }: { drills: readonly GrammarDrill[] }) {
  const [index, setIndex] = useState(0);
  if (!drills.length) return <p className="card tight sm soft">Chưa có bài tập cho phạm vi này.</p>;
  const drill = drills[Math.min(index, drills.length - 1)];
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="tiny muted">Bài {index + 1}/{drills.length} · {drill.lessonLabel}</span>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn ghost sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Bài trước</button>
          <button type="button" className="btn ghost sm" disabled={index >= drills.length - 1} onClick={() => setIndex(index + 1)}>Bài sau →</button>
        </div>
      </div>
      {/* key: đổi bài → làm lại từ đầu, không giữ câu trả lời của bài trước. */}
      {drill.type === 'dialogue' ? <DialogueView key={drill.id} drill={drill} /> : <ItemDrillView key={drill.id} drill={drill} />}
      {index < drills.length - 1 ? (
        <button type="button" className="btn block" onClick={() => { setIndex(index + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Bài tiếp theo →</button>
      ) : null}
    </div>
  );
}

function DrillHeader({ drill, subtitle }: { drill: GrammarDrill; subtitle?: string }) {
  return (
    <div>
      <p className="tiny muted">{drill.type_vi}{subtitle ? ` · ${subtitle}` : ''}</p>
      <div className="row wrap mt-1" style={{ gap: 6 }}>
        {drill.patterns.map((pattern) => <span key={pattern} className="chip lav jp">{pattern}</span>)}
      </div>
      <p className="sm mt-2"><b>{drill.instruction_vi}</b></p>
    </div>
  );
}

function ItemDrillView({ drill }: { drill: ItemDrill }) {
  const [states, setStates] = useState<Record<number, ItemState>>({});
  const scored = drill.items.filter((item) => !item.is_example);
  const done = scored.filter((item) => {
    const state = states[item.n];
    return state && (state.status === 'correct' || state.status === 'wrong' || state.selfCorrect !== undefined);
  });
  const correct = scored.filter((item) => states[item.n]?.status === 'correct' || states[item.n]?.selfCorrect === true).length;

  const EMPTY: ItemState = { input: '', status: 'idle' };
  const update = (n: number, patch: Partial<ItemState>) => setStates((current) => ({ ...current, [n]: { ...EMPTY, ...current[n], ...patch } }));
  const submit = (item: ExerciseItem) => {
    const input = states[item.n]?.input ?? '';
    if (!input.trim()) return;
    const result = checkItem(input, item);
    // Hỏi đáp tự do: không khớp đáp án mẫu → cho xem mẫu và tự đánh giá (câu trả lời khác chữ vẫn có thể đúng ý).
    update(item.n, { status: result.correct ? 'correct' : drill.answer_mode === 'model' ? 'review' : 'wrong' });
  };

  return (
    <article className="card">
      <DrillHeader drill={drill} />
      {drill.frame ? <p className="jp mt-2" style={{ fontSize: 18 }}>Khung câu: <b>{drill.frame}</b></p> : null}
      <ol className="stack mt-3" style={{ gap: 10, listStyle: 'none', padding: 0 }}>
        {drill.items.map((item) => {
          const state = states[item.n];
          const status = state?.status ?? 'idle';
          return (
            <li key={item.n} className="card tight" style={{ background: item.is_example ? 'var(--cream)' : undefined }}>
              <p className="sm">
                {item.is_example ? <span className="chip mint" style={{ marginRight: 6 }}>Ví dụ</span> : <b style={{ marginRight: 6 }}>{item.n}.</b>}
                <span className="jp">{item.prompt}</span>
                {item.cue_vi ? <span className="chip sky" style={{ marginLeft: 6 }}>Gợi ý: {item.cue_vi}</span> : null}
              </p>
              {item.is_example ? (
                <p className="jp mt-1.5" style={{ fontSize: 17 }}>→ {item.answers[0]} <AudioButton text={item.readings[0] || item.answers[0]} /></p>
              ) : (
                <>
                  <form className="row mt-2" style={{ gap: 8 }} onSubmit={(event) => { event.preventDefault(); submit(item); }}>
                    <input className="input jp" value={state?.input ?? ''} disabled={status !== 'idle'} lang="ja" autoComplete="off"
                      aria-label={`Câu trả lời ${item.n}`} placeholder="Gõ câu trả lời (có thể gõ toàn kana)"
                      onChange={(event) => update(item.n, { input: event.target.value })} />
                    {status === 'idle' ? <button type="submit" className="btn sm">Kiểm tra</button> : null}
                  </form>
                  {status === 'correct' ? <p className="sm mt-1.5" style={{ color: 'var(--sage-deep, #4F8F56)' }}>✓ Đúng rồi! <span className="jp">{item.answers[0]}</span></p> : null}
                  {status === 'wrong' || status === 'review' ? (
                    <div className="mt-1.5">
                      <p className="sm">{status === 'wrong' ? '✗ Chưa đúng. ' : ''}Đáp án mẫu: <b className="jp">{item.answers[0]}</b> <AudioButton text={item.readings[0] || item.answers[0]} /></p>
                      <p className="tiny muted jp">{item.readings[0]}</p>
                      {status === 'review' && state?.selfCorrect === undefined ? (
                        <div className="row wrap mt-1.5" style={{ gap: 6 }}>
                          <span className="tiny muted">Độ giống đáp án mẫu ~{Math.round(similarity(state.input, item.answers[0]) * 100)}% · </span>
                          <button type="button" className="btn sm" onClick={() => update(item.n, { selfCorrect: true })}>Mình trả lời đúng ý</button>
                          <button type="button" className="btn ghost sm" onClick={() => update(item.n, { selfCorrect: false })}>Chưa đúng</button>
                        </div>
                      ) : null}
                      {status === 'wrong' || state?.selfCorrect === false ? (
                        <button type="button" className="link tiny mt-1" onClick={() => update(item.n, { status: 'idle', selfCorrect: undefined, input: '' })}>Làm lại câu này</button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
      </ol>
      {done.length === scored.length ? <p className="sm mt-3"><b>Kết quả: {correct}/{scored.length} câu đúng</b> {correct === scored.length ? '🎉' : ''}</p> : null}
    </article>
  );
}

function DialogueView({ drill }: { drill: DialogueDrill }) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [showVi, setShowVi] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const correct = drill.blanks.filter((blank) => choices[blank.n] !== undefined && checkBlank(choices[blank.n], blank)).length;
  const answeredAll = drill.blanks.every((blank) => choices[blank.n] !== undefined);
  const fill = (n: number) => {
    const blank = drill.blanks.find((item) => item.n === n);
    const choice = choices[n];
    return blank && choice !== undefined ? `【${blank.options[choice - 1]}】` : `（${n}）＿＿`;
  };
  return (
    <article className="card">
      <DrillHeader drill={drill} subtitle={drill.title_vi} />
      <div className="row wrap mt-2" style={{ gap: 6 }}>
        <button type="button" className={`chip ${showVi ? 'pink' : ''}`} aria-pressed={showVi} onClick={() => setShowVi(!showVi)}>Xem bản dịch</button>
        <button type="button" className={`chip ${showReading ? 'pink' : ''}`} aria-pressed={showReading} onClick={() => setShowReading(!showReading)}>Xem cách đọc</button>
      </div>
      <div className="stack mt-3" style={{ gap: 8 }}>
        {drill.lines.map((line, index) => (
          <div key={index} className="row" style={{ gap: 8, alignItems: 'flex-start', justifyContent: line.speaker === 'A' ? 'flex-start' : 'flex-end' }}>
            <div className="card tight" style={{ maxWidth: '86%', background: line.speaker === 'A' ? 'var(--sky)' : 'var(--mint)', borderColor: 'transparent' }}>
              <p className="tiny muted">{line.speaker}</p>
              <p className="jp" style={{ fontSize: 17 }}>{renderLine(line.text, fill)}</p>
              {showReading ? <p className="tiny muted jp">{line.reading}</p> : null}
              {showVi ? <p className="tiny soft">{line.vi}</p> : null}
              {answeredAll ? <AudioButton text={line.text_full} /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="stack mt-3" style={{ gap: 10 }}>
        {drill.blanks.map((blank) => {
          const choice = choices[blank.n];
          const answered = choice !== undefined;
          return (
            <div key={blank.n}>
              <p className="sm"><b>Chỗ trống ({blank.n})</b>{answered ? (checkBlank(choice, blank) ? ' — ✓ Đúng' : ` — ✗ Đáp án: ${blank.options[blank.answer_index - 1]}`) : ''}</p>
              <div className="row wrap mt-1" style={{ gap: 6 }}>
                {blank.options.map((option, optionIndex) => {
                  const value = optionIndex + 1;
                  const isAnswer = value === blank.answer_index;
                  const style = answered && (value === choice || isAnswer)
                    ? { background: isAnswer ? '#DDF2DD' : '#FFE2E2', borderColor: isAnswer ? '#7DBA82' : '#E9A0A8' } : undefined;
                  return (
                    <button key={option} type="button" className="chip jp" disabled={answered} style={style}
                      onClick={() => setChoices((current) => ({ ...current, [blank.n]: value }))}>{option}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {answeredAll ? (
        <div className="row wrap mt-3" style={{ gap: 8, alignItems: 'center' }}>
          <b className="sm">Kết quả: {correct}/{drill.blanks.length} chỗ đúng {correct === drill.blanks.length ? '🎉' : ''}</b>
          <button type="button" className="btn ghost sm" onClick={() => setChoices({})}>Làm lại</button>
        </div>
      ) : null}
    </article>
  );
}
