'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { NokoMessage } from '@/components/common/NokoMessage';
import { ErrorState } from '@/components/common/StateViews';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useRescueKnowledge } from '@/features/memory/hooks/useRescueKnowledge';
import type { RescueView } from '@/features/memory/rescue-view';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const STEP_LABELS = ['Sắp quên', 'Gợi ý', 'Nhớ lại', 'Ngữ cảnh', 'Đã cứu'] as const;
const STEP = { AT_RISK: 0, HINT: 1, RECALL: 2, CONTEXT: 3, RESCUED: 4 } as const;
type RescueStep = (typeof STEP)[keyof typeof STEP];

const LONG_FACE_LENGTH = 3;
const bigFace = (face: string, short: number, long: number) => ({ fontSize: face.length > LONG_FACE_LENGTH ? long : short });

/** Luồng 5 bước cứu một kiến thức. Trạng thái bước là của riêng màn này → useState. */
export function RescueFlow({ view }: { view: RescueView }) {
  const [step, setStep] = useState<RescueStep>(STEP.AT_RISK);
  const [chosenMeaning, setChosenMeaning] = useState<string | null>(null);
  const rescue = useRescueKnowledge(view.contentKey);

  const goToContext = () => setStep(STEP.CONTEXT);
  const finishRescue = () => {
    setStep(STEP.RESCUED);
    rescue.mutate();
  };

  return (
    <div className="session">
      <div className="between mb-3">
        <Link className="link" href="/tri-nho/sap-quen">✕ Để sau</Link>
        <span className="chip">{STEP_LABELS[step]}</span>
      </div>
      <div className="rescue-steps" aria-hidden="true">
        {STEP_LABELS.map((label, index) => <i key={label} className={index <= step ? 'on' : ''} />)}
      </div>

      {step === STEP.AT_RISK ? (
        <div className="s-card pop">
          <span className="chip" style={{ background: 'var(--cream)' }}><EmojiIcon emoji="🍂" size={16} /> {view.reason}</span>
          <p className="sm soft mt-3.5">Bạn còn nhớ cái này không?</p>
          <div className="s-big" style={{ margin: '12px 0 6px', ...bigFace(view.face, 62, 40) }}>{view.face}</div>
          <p className="tiny muted">Bạn đã học nó {view.lastEncounterText} · đã gặp {view.encounterCount} lần</p>
          <div className="s-opt" style={{ flexDirection: 'row', gap: 9 }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setStep(STEP.RECALL)}>Tôi nhớ</button>
            <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={() => setStep(STEP.HINT)}>Chưa nhớ</button>
          </div>
        </div>
      ) : null}

      {step === STEP.HINT ? (
        <div className="s-card pop">
          <span className="chip lav"><EmojiIcon emoji="💡" size={16} /> Gợi ý nhỏ</span>
          <div className="s-big" style={{ margin: '14px 0 4px', ...bigFace(view.face, 56, 38) }}>{view.face}</div>
          <p className="jp soft" style={{ fontSize: 17 }}>{view.reading}</p>
          <p className="sm mt-3" style={{ textAlign: 'left' }}>{view.hint.hintText}</p>
          {view.hint.parts.length ? (
            <div className="row wrap mt-3" style={{ justifyContent: 'center', gap: 6 }}>
              {view.hint.parts.map((part) => <span key={part.face} className="chip jp">{part.face} = {part.label}</span>)}
            </div>
          ) : null}
          <NokoMessage state="thinking" className="mt-3" />
          <button type="button" className="btn block mt-3.5" onClick={() => setStep(STEP.RECALL)}>Mình nhớ ra rồi</button>
        </div>
      ) : null}

      {step === STEP.RECALL ? (
        <div className="s-card pop">
          <span className="chip pink"><EmojiIcon emoji="🧠" size={16} /> Nhớ lại</span>
          <div className="s-big" style={{ margin: '14px 0 4px', ...bigFace(view.face, 56, 38) }}>{view.face}</div>
          <p className="jp soft">{view.reading}</p>
          <p className="sm soft mt-2.5">Nó có nghĩa là gì?</p>
          <div className="s-opt">
            {view.meaningOptions.map((option) => {
              const isAnswered = chosenMeaning !== null;
              const isCorrect = option === view.meaning;
              return (
                <button key={option} type="button" disabled={isAnswered} onClick={() => setChosenMeaning(option)}
                  className={`opt ${isAnswered && isCorrect ? 'ok' : ''} ${isAnswered && option === chosenMeaning && !isCorrect ? 'no' : ''}`}>
                  {option}
                </button>
              );
            })}
          </div>
          {chosenMeaning !== null ? (
            <div className={`feedback ${chosenMeaning === view.meaning ? '' : 'miss'}`} aria-live="polite">
              {chosenMeaning === view.meaning ? (
                <><b>✨ Bạn vẫn nhớ!</b><p className="sm mt-1">Nó chỉ đang mờ đi thôi, chưa mất.</p></>
              ) : (
                <><b>Chưa nhớ cũng không sao.</b><p className="sm mt-1">Mình xem nó trong một câu thật nhé.</p></>
              )}
              <button type="button" className="btn block mt-3" onClick={goToContext}>Tiếp tục</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === STEP.CONTEXT ? (
        <div className="s-card pop">
          <span className="chip sky"><EmojiIcon emoji="💬" size={16} /> Gặp lại trong câu</span>
          <p className="jp" style={{ fontSize: 21, margin: '16px 0 6px', lineHeight: 1.7 }}>{view.context.sentenceJp}</p>
          <p className="sm soft">{view.context.translationVi}</p>
          <AudioButton text={view.context.sentenceJp} label="🔊 Nghe" className="btn ghost sm mt-3" />
          <p className="tiny muted mt-3">Gặp trong câu thật là cách giữ lại lâu nhất.</p>
          <button type="button" className="btn block mt-3" onClick={finishRescue}>Tiếp tục</button>
        </div>
      ) : null}

      {step === STEP.RESCUED ? (
        <div className="s-card pop">
          <SpriteIcon name="noko" size={96} className="mx-auto" />
          <h2 className="mt-2">🌸 Bộ nhớ đã được cứu!</h2>
          <p className="sm soft mt-1.5">{view.face} · {view.meaning}</p>
          {rescue.isError ? <ErrorState message={rescue.error.message} onRetry={() => rescue.mutate()} /> : (
            <div className="card tight mt-4" style={{ textAlign: 'left' }}>
              <div className="between">
                <span className="sm muted">Sức nhớ</span>
                <b className="sm">
                  <span style={{ color: 'var(--ink-3)' }}>{view.scoreBefore}</span> →{' '}
                  <span style={{ color: 'var(--sage)' }}>{rescue.data ? rescue.data.memory.memoryScore : '…'}</span>
                </b>
              </div>
              <ProgressBar percent={rescue.data?.memory.memoryScore ?? view.scoreBefore} variant="thin-mint" label="Sức nhớ sau khi cứu" className="my-2" />
            </div>
          )}
          <NokoMessage state="recovered" className="mt-3" />
          {view.nextAtRisk ? (
            <Link className="btn block mt-3.5" href={`/tri-nho/cuu/${view.nextAtRisk.contentKey}`}>Cứu tiếp {view.nextAtRisk.face}</Link>
          ) : null}
          <Link className="btn quiet block mt-2" href="/">Đủ rồi, về trang chủ</Link>
        </div>
      ) : null}
    </div>
  );
}
