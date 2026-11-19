'use client';

import { ContentImageView } from '@/components/common/ContentImageView';
import { fitTextStyle } from '@/lib/utils/fit-text';
import { AudioButton, SpeakableFace } from '@/components/common/AudioButton';
import { StrokeOrder } from '@/components/learning/StrokeOrder';
import { strokeOrderCharacters } from '@/features/learning/stroke-order';

const WRITABLE_TYPES = new Set(['hiragana', 'katakana', 'kanji']);
/** "kanji-12" → "kanji". */
const contentTypeOf = (contentKey: string) => contentKey.slice(0, contentKey.lastIndexOf('-'));
import { KNOWLEDGE_TYPE_LABEL } from '@/features/learning/knowledge-origin';
import {
  DISCOVER_ACKNOWLEDGED,
  phaseOfStep,
  type PublicSessionStep,
  SELF_REPORT_ANSWERS,
  type DiscoverStep,
  type RecallStep,
  type StepAnswerFeedback,
  type SurpriseStep,
  type UseChooseSentenceStep,
  type UseFillBlankStep,
} from '@/features/learning/session-types';
import { useSheetStore } from '@/stores/sheet-store';
import { KanaReading } from '@/components/common/KanaReading';
import { AnswerOptions } from './AnswerOptions';
import { StepFeedback } from './StepFeedback';
import { KanjiStoryNudge } from '@/components/learning/KanjiStoryNudge';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** Một kiểu bước = một component. Tất cả chỉ hiển thị và báo lựa chọn lên useLearningSession. */

/** Có chữ Nhật (kana / Kanji) — lựa chọn nghĩa tiếng Việt không dùng font tiếng Nhật (vỡ dấu: "Ky˜sư"). */
const JAPANESE = /[぀-ヿ一-鿿]/;

const PHASE_VERB = { review: 'Ôn tập', backlog: 'Học bù', new: 'Học mới', use: 'Dùng trong câu' } as const;

/**
 * Nhãn ngữ cảnh trên đầu mỗi câu: đang làm gì với loại kiến thức nào, thuộc bài nào, ngày nào, mới hay đã học —
 * "Ôn tập từ vựng · Bài 1 · Ngày 14 · Đã học". Phiên cũ (chưa có origin) thì không hiện.
 */
export function StepOrigin({ step }: { step: PublicSessionStep }) {
  const origin = step.origin;
  if (!origin) return null;
  const phase = phaseOfStep(step);
  const verb = step.type === 'recall' && step.isPractice ? 'Luyện ngay' : PHASE_VERB[phase];
  const isLearned = phase === 'review' || phase === 'use';
  const type = KNOWLEDGE_TYPE_LABEL[origin.type];
  return (
    <p className="step-origin" aria-label="Kiến thức của câu này">
      <b>{verb} {type === 'Hiragana' || type === 'Katakana' ? type : type.toLowerCase()}</b>
      <span>{[origin.lesson ? `Bài ${origin.lesson}` : '', origin.day ? `Ngày ${origin.day}` : ''].filter(Boolean).map((part) => `\u00a0·\u00a0${part}`).join('')}</span>
      <span className={`step-origin-tag ${isLearned ? 'is-learned' : 'is-new'}`}>{isLearned ? 'Đã học' : step.type === 'discover' ? 'Mới' : 'Vừa học'}</span>
    </p>
  );
}

/** Câu hỏi cách đọc: phát âm trước khi trả lời là lộ đáp án. Phiên cũ không có `ask` → suy từ câu hỏi. */
function asksReading(step: RecallStep): boolean {
  if (step.ask) return step.ask === 'reading';
  return step.question !== '' && !/nghĩa/.test(step.question);
}

interface StepInteraction {
  feedback: StepAnswerFeedback | null;
  chosenAnswer: string | null;
  isBusy: boolean;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
  /** Đang chờ tự chuyển câu (công tắc "Tự chuyển câu" bật, trả lời đúng, đã lưu). */
  isAutoNext?: boolean;
}

export function SurpriseStepView({ step, feedback, chosenAnswer, isBusy, onAnswer, onContinue, isAutoNext = false, isDaily = false }: StepInteraction & { step: SurpriseStep; isDaily?: boolean }) {
  const openKnowledge = useSheetStore((store) => store.openKnowledge);
  const wasRemembered = feedback?.isCorrect === true;
  const isSending = (answer: string) => isBusy && !feedback && chosenAnswer === answer;
  return (
    <section className="surprise pop">
      <StepOrigin step={step} />
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
          {isDaily ? <button type="button" className={`btn block mt-2 streak-next${isAutoNext ? ' is-auto' : ''}`} onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>{isAutoNext ? 'Tự chuyển… · bấm để sang ngay →' : 'Tiếp tục'}</button> : null}
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
                    wasRemembered ? <span className="fade-in"> Bạn đã gặp nó {feedback.memory.lastEncounterText}.</span> : null
                  ) : null}
                </p>
              </div>
              <AudioButton text={step.audioText} />
            </div>
            {!isDaily ? <div className="row mt-3" style={{ gap: 8 }}>
              <button type="button" className="btn sm" onClick={() => openKnowledge(step.contentKey)}>Xem kỹ hơn</button>
            </div> : null}
          </div>
          {/* "Chưa nhớ" một Kanji → gợi ý câu chốt của câu chuyện; điểm vẫn do câu trả lời quyết định. */}
          {!wasRemembered ? <KanjiStoryNudge contentKey={step.contentKey} /> : null}
          {!isDaily ? <button type="button" className="btn block mt-2.5" onClick={onContinue} disabled={isBusy} aria-busy={isBusy}>Tiếp tục</button> : null}
        </>
      ) : null}
    </section>
  );
}

export function RecallStepView({ step, isDaily = false, ...interaction }: StepInteraction & { step: RecallStep; isDaily?: boolean }) {
  // Câu hỏi nghĩa: nghe được ngay (không lộ đáp án). Câu hỏi cách đọc: chỉ nghe sau khi trả lời.
  const canListen = Boolean(interaction.feedback) || !asksReading(step);
  const audioText = step.audioText || step.face;
  // Phiên cũ còn lưu "Nó nghĩa là gì?" — không lặp lại cụm này ở mỗi câu.
  const instruction = /nghĩa là gì/i.test(step.question) ? '' : step.question;
  return (
    <div className="s-card pop">
      <StepOrigin step={step} />
      <div className="fit-box"><div className="s-big fit-text" style={{ margin: '12px 0 8px', ...fitTextStyle(step.face, 48, 24) }}>{step.face}</div></div>
      {canListen ? <div className="center"><AudioButton text={audioText} label="Nghe từ này" /></div> : null}
      {/* Trả lời xong: mặt chữ có Kanji hiện kèm cách đọc kana + romaji. */}
      {interaction.feedback ? <p className="center" style={{ marginTop: -4 }}><KanaReading text={step.face} reading={step.readings?.[step.face]} block /></p> : null}
      {instruction ? <p className="sm soft">{instruction}</p> : null}
      {interaction.feedback && isDaily ? <StepFeedback kind={step.isPractice ? 'practice' : 'recall'} feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} isAutoNext={interaction.isAutoNext} readings={step.readings} compact /> : null}
      <AnswerOptions options={step.options} chosenAnswer={interaction.chosenAnswer} feedback={interaction.feedback}
        isDisabled={interaction.isBusy} isJapanese={step.options.some((option) => JAPANESE.test(option))} readings={step.readings} onChoose={interaction.onAnswer} />
      {interaction.feedback && !isDaily ? <StepFeedback kind={step.isPractice ? 'practice' : 'recall'} feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} isAutoNext={interaction.isAutoNext} readings={step.readings} /> : null}
      {interaction.feedback?.isCorrect === false ? <KanjiStoryNudge contentKey={step.contentKey} /> : null}
    </div>
  );
}

export function DiscoverStepView({ step, isBusy, onAcknowledge }: { step: DiscoverStep; isBusy: boolean; onAcknowledge: (answer: string) => void }) {
  const { card } = step;
  return (
    <div className="s-card pop">
      <StepOrigin step={step} />
      {step.fromDay ? (
        <span className="chip" style={{ background: 'var(--cream)' }}><EmojiIcon emoji="📦" size={16} /> Học bù · từ ngày {step.fromDay}</span>
      ) : (
        <span className="chip mint"><EmojiIcon emoji="🌱" size={16} /> Một thứ mới, nhỏ thôi</span>
      )}
      <ContentImageView image={card.image} className="vocab-image mx-auto mt-3" />
      <div className="fit-box"><SpeakableFace text={card.audioText} face={card.face} className="s-big fit-text" style={{ margin: '16px auto 6px', ...fitTextStyle(card.face, 58, 26) }} /></div>
      <p className="jp soft">{card.reading}</p>
      {card.romaji ? <p className="romaji">{card.romaji}</p> : null}
      <h3 style={{ margin: '8px 0 10px' }}>{card.meaning}</h3>
      {/* Chữ cái và Kanji: học cách viết ngay khi gặp chữ mới (thứ tự nét, xem từng nét). */}
      {WRITABLE_TYPES.has(contentTypeOf(step.contentKey)) && strokeOrderCharacters(card.face).length ? (
        <div className="row wrap discover-strokes" style={{ justifyContent: 'center', gap: 14 }}>
          {strokeOrderCharacters(card.face).map((character, index) => (
            <StrokeOrder key={`${character}-${index}`} character={character} size={strokeOrderCharacters(card.face).length > 1 ? 130 : 160} />
          ))}
        </div>
      ) : null}
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
      <AudioButton text={card.audioText} label="Nghe" className="btn ghost mt-3.5" showText />
      <button type="button" className="btn block mt-3" disabled={isBusy} aria-busy={isBusy} onClick={() => onAcknowledge(DISCOVER_ACKNOWLEDGED)}>
        Mình hiểu rồi
      </button>
    </div>
  );
}

export function UseStepView({ step, isDaily = false, ...interaction }: StepInteraction & { step: UseChooseSentenceStep | UseFillBlankStep; isDaily?: boolean }) {
  // Trả lời xong mới nghe câu đúng (nghe trước là lộ đáp án).
  const answer = interaction.feedback?.correctAnswer;
  const fullSentence = answer ? (step.variant === 'fill-blank' ? step.sentenceJp.replace('＿＿', answer) : answer) : null;
  return (
    <div className="s-card pop">
      <StepOrigin step={step} />
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
      {interaction.feedback && isDaily ? <StepFeedback kind="use" feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} isAutoNext={interaction.isAutoNext} readings={step.readings} compact /> : null}
      <AnswerOptions options={step.options} chosenAnswer={interaction.chosenAnswer} feedback={interaction.feedback}
        isDisabled={interaction.isBusy} isJapanese readings={step.readings} onChoose={interaction.onAnswer} />
      {fullSentence ? <div className="center mt-2"><AudioButton text={fullSentence} label="Nghe câu đúng" showText /></div> : null}
      {interaction.feedback && !isDaily ? <StepFeedback kind="use" feedback={interaction.feedback} isBusy={interaction.isBusy} onContinue={interaction.onContinue} isAutoNext={interaction.isAutoNext} readings={step.readings} /> : null}
    </div>
  );
}
