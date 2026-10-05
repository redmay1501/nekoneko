'use client';

import { AudioButton } from '@/components/common/AudioButton';
import {
  DISCOVER_ACKNOWLEDGED,
  SELF_REPORT_ANSWERS,
  type DiscoverStep,
  type RecallStep,
  type StepAnswerFeedback,
  type SurpriseStep,
  type UseChooseSentenceStep,
  type UseFillBlankStep,
} from '@/features/learning/session-types';
import { useSheetStore } from '@/stores/sheet-store';
import { AnswerOptions } from './AnswerOptions';
import { StepFeedback } from './StepFeedback';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** Một kiểu bước = một component. Tất cả chỉ hiển thị và báo lựa chọn lên useLearningSession. */

interface StepInteraction {
  feedback: StepAnswerFeedback | null;
  chosenAnswer: string | null;
  isBusy: boolean;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
}

const LONG_FACE_LENGTH = 3;
const faceSize = (face: string, short: number, long: number) => ({ fontSize: face.length > LONG_FACE_LENGTH ? long : short });

export function SurpriseStepView({ step, feedback, chosenAnswer, isBusy, onAnswer, onContinue, isDaily = false }: StepInteraction & { step: SurpriseStep; isDaily?: boolean }) {
  const openKnowledge = useSheetStore((store) => store.openKnowledge);
  const wasRemembered = feedback?.isCorrect === true;
  const isSending = (answer: string) => isBusy && !feedback && chosenAnswer === answer;
  return (
    <section className="surprise pop">
      <span className="chip pink"><EmojiIcon emoji="🌸" size={16} /> Gặp lại kiến thức</span>
      <p className="sm soft mt-3">Bạn còn nhớ cái này không?</p>
      <div className="face">{step.face}</div>
      <div className="yn">
        <button type="button" className="btn" disabled={Boolean(feedback) || isBusy} style={feedback ? { opacity: 0.45 } : undefined}
          aria-busy={isSending(SELF_REPORT_ANSWERS.REMEMBERED)} onClick={() => onAnswer(SELF_REPORT_ANSWERS.REMEMBERED)}>Tôi nhớ</button>
        <button type="button" className="btn ghost" disabled={Boolean(feedback) || isBusy} style={feedback ? { opacity: 0.45 } : undefined}
          aria-busy={isSending(SELF_REPORT_ANSWERS.FORGOT)} onClick={() => onAnswer(SELF_REPORT_ANSWERS.FORGOT)}>Chưa nhớ</button>
      </div>
      {feedback ? (
        <>
          {isDaily ? <button type="button" className="btn block mt-2" onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>Tiếp tục</button> : null}
          <div className={`reveal ${wasRemembered ? 'ok' : 'no'}`} aria-live="polite">
            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p className="jp" style={{ fontSize: 19 }}>{step.reading}</p>
                <b>{step.meaning}</b>
                <p className="sm mt-2">
                  {isDaily
                    ? (wasRemembered ? 'Bạn nhớ tốt lắm!' : 'Không sao, mình ôn tiếp nhé.')
                    : (wasRemembered ? '✨ Bạn vẫn nhớ!' : 'Không sao. Neko Neko sẽ đưa nó quay lại sớm hơn.')}
                  {/* Chi tiết từ trí nhớ chỉ có khi server ghi xong — hiện thêm vào, không chặn người học. */}
                  {!isDaily && feedback.memory ? (
                    <span className="fade-in">
                      {wasRemembered
                        ? ` Bạn đã gặp nó ${feedback.memory.lastEncounterText}.`
                        : ` Lần tới: ${feedback.memory.nextEncounterText.toLowerCase()}.`}
                    </span>
                  ) : null}
                </p>
              </div>
              <AudioButton text={step.audioText} />
            </div>
            {!isDaily ? <div className="row mt-3" style={{ gap: 8 }}>
              <button type="button" className="btn sm" onClick={() => openKnowledge(step.contentKey)}>Xem kỹ hơn</button>
            </div> : null}
          </div>
          {!isDaily ? <button type="button" className="btn block mt-2.5" onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>Tiếp tục</button> : null}
        </>
      ) : null}
    </section>
  );
}

export function RecallStepView({ step, isDaily = false, ...interaction }: StepInteraction & { step: RecallStep; isDaily?: boolean }) {
  return (
    <div className="s-card pop">
      {step.isPractice
        ? <span className="chip mint"><EmojiIcon emoji="✏️" size={16} /> Luyện ngay</span>
        : <p className="sm muted">Bạn còn nhớ cái này không? 🌸</p>}
      <div className="s-big" style={{ margin: '16px 0 10px' }}>{step.face}</div>
      <p className="sm soft">{step.question}</p>
      {interaction.feedback && isDaily ? <StepFeedback kind={step.isPractice ? 'practice' : 'recall'} feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} compact /> : null}
      <AnswerOptions options={step.options} chosenAnswer={interaction.chosenAnswer} feedback={interaction.feedback}
        isDisabled={interaction.isBusy} isJapanese onChoose={interaction.onAnswer} />
      {interaction.feedback && !isDaily ? <StepFeedback kind={step.isPractice ? 'practice' : 'recall'} feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} /> : null}
    </div>
  );
}

export function DiscoverStepView({ step, isBusy, onAcknowledge }: { step: DiscoverStep; isBusy: boolean; onAcknowledge: (answer: string) => void }) {
  const { card } = step;
  return (
    <div className="s-card pop">
      {step.fromDay ? (
        <span className="chip" style={{ background: 'var(--cream)' }}><EmojiIcon emoji="📦" size={16} /> Học bù · từ ngày {step.fromDay}</span>
      ) : (
        <span className="chip mint"><EmojiIcon emoji="🌱" size={16} /> Một thứ mới, nhỏ thôi</span>
      )}
      <div className="s-big" style={{ margin: '16px 0 6px', ...faceSize(card.face, 58, 38) }}>{card.face}</div>
      <p className="jp soft">{card.reading}</p>
      <h3 style={{ margin: '8px 0 10px' }}>{card.meaning}</h3>
      {card.detailLines.filter(Boolean).map((line, index) => (
        <p key={index} className={`sm ${index === 0 && card.detailLines.length > 1 ? 'soft' : 'mt-2'}`}>{line}</p>
      ))}
      {card.relatedChips.length ? (
        <div className="row wrap mt-3" style={{ justifyContent: 'center', gap: 7 }}>
          {card.relatedChips.map((chip) => (
            <span key={chip.face} className="chip jp">{chip.label ? `${chip.face} = ${chip.label}` : chip.face}</span>
          ))}
        </div>
      ) : null}
      {card.bridgeText ? (
        <div className="card tight mt-3" style={{ background: 'var(--lav)', borderColor: 'transparent' }}>
          <p className="sm">🔗 {card.bridgeText}</p>
        </div>
      ) : null}
      {card.example ? (
        <div className="card tight mt-3" style={{ background: 'var(--cream)', borderColor: 'transparent', textAlign: 'left' }}>
          <p className="tiny muted">📖 Trong câu</p>
          <div className="row" style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
            <p className="jp" style={{ fontSize: 17, flex: 1 }}>{card.example.jp}</p>
            <AudioButton text={card.example.jp} label="🔊" className="btn ghost sm" />
          </div>
          <p className="sm soft">{card.example.vi}</p>
          {card.example.knownFaces.length ? (
            <p className="tiny mt-2" style={{ color: 'var(--sakura)' }}>✨ Bạn đã từng gặp: <span className="jp">{card.example.knownFaces.join('、')}</span></p>
          ) : null}
        </div>
      ) : null}
      {card.exampleWords?.length ? (
        <div className="row wrap mt-3" style={{ justifyContent: 'center', gap: 7 }}>
          {card.exampleWords.map((word) => (
            <span key={word.face} className="chip"><span className="jp">{word.face}</span>&nbsp;— {word.meaning}</span>
          ))}
        </div>
      ) : null}
      <AudioButton text={card.audioText} label="🔊 Nghe" className="btn ghost sm mt-3.5" />
      <button type="button" className="btn block mt-3" disabled={isBusy} aria-busy={isBusy} onClick={() => onAcknowledge(DISCOVER_ACKNOWLEDGED)}>
        Mình hiểu rồi
      </button>
    </div>
  );
}

export function UseStepView({ step, isDaily = false, ...interaction }: StepInteraction & { step: UseChooseSentenceStep | UseFillBlankStep; isDaily?: boolean }) {
  return (
    <div className="s-card pop">
      {step.variant === 'choose-sentence' ? (
        <>
          <span className="chip sky"><EmojiIcon emoji="💬" size={16} /> Dùng thử trong câu</span>
          <p className="sm soft" style={{ margin: '14px 0 6px' }}>Nói câu này bằng tiếng Nhật:</p>
          <h3 style={{ fontSize: 19 }}>{step.promptVi}</h3>
        </>
      ) : (
        <>
          <span className="chip sky"><EmojiIcon emoji="💬" size={16} /> Điền vào chỗ trống</span>
          {step.contextJp
            ? <p className="jp" style={{ fontSize: 17, margin: '16px 0 4px' }}>{step.contextJp}</p>
            : <div style={{ height: 14 }} />}
          <p className="jp" style={{ fontSize: 22 }}>
            {step.sentenceJp.split('＿＿').map((part, index, parts) => (
              <span key={index}>{part}{index < parts.length - 1 ? <span style={{ color: 'var(--sakura)' }}>______</span> : null}</span>
            ))}
          </p>
          <p className="sm soft mt-2.5">{step.promptVi}</p>
        </>
      )}
      {interaction.feedback && isDaily ? <StepFeedback kind="use" feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} compact /> : null}
      <AnswerOptions options={step.options} chosenAnswer={interaction.chosenAnswer} feedback={interaction.feedback}
        isDisabled={interaction.isBusy} isJapanese onChoose={interaction.onAnswer} />
      {interaction.feedback && !isDaily ? <StepFeedback kind="use" feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} /> : null}
    </div>
  );
}
