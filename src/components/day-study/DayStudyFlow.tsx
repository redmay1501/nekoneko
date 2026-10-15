'use client';

import Link from 'next/link';
import { fitTextStyle } from '@/lib/utils/fit-text';
import { useEffect, useMemo, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { NekoButton } from '@/components/common/NekoButton';
import { StrokeOrder } from '@/components/learning/StrokeOrder';
import { MatchGame } from '@/components/games/MatchGame';
import { MIN_MATCH_POOL } from '@/features/games/match-game';
import type { DayStudyData, StudyGrammarCard, StudyKanaCard, StudyKanjiCard, StudyRadicalCard, StudyVocabCard } from '@/features/learning/day-study';
import {
  GRAMMAR_QUIZZES, KANA_QUIZZES, KANJI_QUIZZES, type KanjiQuizId, RADICAL_QUIZZES, STUDY_STEPS, type StudyStepId, VOCAB_QUIZZES, buildGrammarQuiz, buildKanaQuiz, buildKanjiQuiz, buildRadicalQuiz, buildVocabQuiz,
} from '@/features/learning/day-study-quiz';
import { MAX_FOCUS_ITEMS, focusSessionHref } from '@/features/learning/session-modes';
import { Flashcards } from './Flashcards';
import { ContentImageView } from '@/components/common/ContentImageView';
import { GrammarPractice } from './GrammarPractice';
import { StudyQuiz } from './StudyQuiz';


/** Chế độ trong một bước: "the" = thẻ học / bài học, còn lại là id bài quiz của bước đó. */
type ModeId = string;
const LESSON_MODE = 'the';

interface Tracking {
  wrong: string[];
  marked: string[];
}

function setUrlParams(params: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  window.history.replaceState(window.history.state, '', url);
}

function readTracking(day: number): Tracking {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`day-study:${day}`) ?? 'null') as Tracking | null;
    return { wrong: saved?.wrong ?? [], marked: saved?.marked ?? [] };
  } catch {
    return { wrong: [], marked: [] };
  }
}

/**
 * Học theo ngày — 4 bước theo thứ tự Từ vựng → Ngữ pháp → Kanji → Ôn tập. Mỗi bước: thẻ / bài học trước, rồi các bài quiz.
 * Đổi bước / chế độ ngay trong trình duyệt (dữ liệu đã có sẵn), URL chỉ ghi lại vị trí (?buoc=…&che-do=…).
 * Câu sai + mục "Đánh dấu ôn" được gom lại (giữ trong phiên trình duyệt) → bước Ôn tập ôn chúng trước tiên.
 */
export function DayStudyFlow({ data, initialStep, initialMode }: { data: DayStudyData; initialStep: StudyStepId | null; initialMode: ModeId }) {
  const steps = STUDY_STEPS.filter((step) => step.id === 'on-tap' || (step.id === 'chu-cai' && data.kana.length)
    || (step.id === 'tu-vung' && data.vocab.length) || (step.id === 'ngu-phap' && data.grammar.length)
    || (step.id === 'bo-thu' && data.radicals.length) || (step.id === 'kanji' && data.kanji.length));
  const [stepId, setStepId] = useState<StudyStepId>(steps.find((step) => step.id === initialStep)?.id ?? steps[0].id);
  const [mode, setMode] = useState<ModeId>(initialMode || LESSON_MODE);
  /** Lần chạy quiz (tăng = tạo bộ câu mới) và tập mục đang làm lại (rỗng = tất cả). */
  const [run, setRun] = useState(0);
  const [retryKeys, setRetryKeys] = useState<string[]>([]);
  const [tracking, setTracking] = useState<Tracking>({ wrong: [], marked: [] });

  useEffect(() => setTracking(readTracking(data.day)), [data.day]);
  function updateTracking(update: (current: Tracking) => Tracking) {
    setTracking((current) => {
      const next = update(current);
      try { sessionStorage.setItem(`day-study:${data.day}`, JSON.stringify(next)); } catch { /* chế độ riêng tư — chỉ giữ trong trang */ }
      return next;
    });
  }
  const marked = useMemo(() => new Set(tracking.marked), [tracking.marked]);
  const toggleMark = (key: string) => updateTracking((current) => ({
    ...current, marked: current.marked.includes(key) ? current.marked.filter((entry) => entry !== key) : [...current.marked, key],
  }));
  const addWrong = (key: string) => updateTracking((current) => (current.wrong.includes(key) ? current : { ...current, wrong: [...current.wrong, key] }));

  function goTo(nextStep: StudyStepId, nextMode: ModeId = LESSON_MODE) {
    setStepId(nextStep);
    setMode(nextMode);
    setRetryKeys([]);
    setRun((current) => current + 1);
    setUrlParams({ buoc: nextStep, 'che-do': nextMode });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const restart = () => { setRetryKeys([]); setRun((current) => current + 1); };
  const retryWrong = (keys: string[]) => { setRetryKeys(keys); setRun((current) => current + 1); };

  const stepIndex = steps.findIndex((step) => step.id === stepId);
  const nextStep = steps[stepIndex + 1];
  const quizzes = stepId === 'chu-cai' ? KANA_QUIZZES : stepId === 'tu-vung' ? VOCAB_QUIZZES.filter((quiz) => quiz.id !== 'ghep' || data.vocab.length >= MIN_MATCH_POOL)
    : stepId === 'ngu-phap' ? GRAMMAR_QUIZZES : stepId === 'bo-thu' ? RADICAL_QUIZZES : stepId === 'kanji' ? KANJI_QUIZZES : [];
  const quizProps = { onRestart: restart, onRetryWrong: retryWrong, onWrong: addWrong };
  // Bộ câu hỏi dựng MỘT lần cho mỗi lượt (đổi chế độ / làm lại) — không xáo lại khi trang vẽ lại giữa bài.
  const questions = useMemo(() => {
    const only = <T extends { key: string }>(cards: readonly T[]) => (retryKeys.length ? cards.filter((card) => retryKeys.includes(card.key)) : cards);
    if (stepId === 'chu-cai' && (mode === 'doc' || mode === 'chu')) return buildKanaQuiz(data, mode, only(data.kana));
    if (stepId === 'tu-vung' && (mode === 'nghia' || mode === 'tu' || mode === 'go')) return buildVocabQuiz(data, mode, only(data.vocab));
    if (stepId === 'ngu-phap' && (mode === 'viet-nhat' || mode === 'nhat-viet')) return buildGrammarQuiz(data, mode, only(data.grammar));
    if (stepId === 'bo-thu' && mode === 'nghia') return buildRadicalQuiz(data, only(data.radicals));
    if (stepId === 'kanji' && KANJI_QUIZZES.some((quiz) => quiz.id === mode)) return buildKanjiQuiz(data, mode as KanjiQuizId, only(data.kanji));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` tăng = tạo bộ câu mới
  }, [data, stepId, mode, retryKeys, run]);

  return (
    <div className="day-study">
      <nav className="study-steps" aria-label="Các bước học">
        {steps.map((step, index) => {
          const counts = { 'chu-cai': [data.learned.kana, data.kana.length], 'tu-vung': [data.learned.vocab, data.vocab.length], 'ngu-phap': [data.learned.grammar, data.grammar.length],
            'bo-thu': [data.learned.radical, data.radicals.length], kanji: [data.learned.kanji, data.kanji.length], 'on-tap': [0, 0] }[step.id];
          const [learned, total] = counts;
          return (
            <button key={step.id} type="button" className={`study-step ${step.id === stepId ? 'on' : ''} ${index < stepIndex ? 'done' : ''}`}
              aria-current={step.id === stepId ? 'step' : undefined} onClick={() => goTo(step.id)}>
              <span className="study-step-n">{index + 1}</span>
              <span className="study-step-label">{step.label}</span>
              {total ? <span className="study-step-count">{learned}/{total}</span> : null}
            </button>
          );
        })}
      </nav>

      {stepId !== 'on-tap' ? (
        <div className="study-modes" role="tablist" aria-label="Chế độ học">
          <button type="button" role="tab" aria-selected={mode === LESSON_MODE} className={`tab ${mode === LESSON_MODE ? 'on' : ''}`} onClick={() => goTo(stepId)}>
            📇 {stepId === 'ngu-phap' ? 'Bài học' : 'Thẻ học'}
          </button>
          {quizzes.map((quiz) => (
            <button key={quiz.id} type="button" role="tab" aria-selected={mode === quiz.id} className={`tab ${mode === quiz.id ? 'on' : ''}`}
              onClick={() => goTo(stepId, quiz.id)}>
              <span aria-hidden="true">{quiz.icon}</span> {quiz.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3" key={`${stepId}:${mode}:${run}`}>
        {stepId === 'chu-cai' && mode === LESSON_MODE ? (
          <Flashcards cards={data.kana} unit="chữ" marked={marked} onToggleMark={toggleMark} audioText={(card) => card.face}
            front={(card) => <span className="glyph flashcard-glyph">{card.face}</span>} back={(card) => <KanaBack card={card} />}
            footer={(card) => <StrokeToggle key={card.key} character={card.face} />} />
        ) : null}
        {stepId === 'chu-cai' && mode !== LESSON_MODE ? <StudyQuiz questions={questions} unit="chữ" {...quizProps} /> : null}

        {stepId === 'tu-vung' && mode === LESSON_MODE ? (
          <Flashcards cards={data.vocab} unit="từ" marked={marked} onToggleMark={toggleMark}
            audioText={(card) => card.kana} front={(card) => <VocabFront card={card} />} back={(card) => <VocabBack card={card} />} />
        ) : null}
        {stepId === 'tu-vung' && mode === 'ghep' ? (
          <MatchGame pool={data.vocab.map((card) => ({ contentKey: card.key, face: card.face, answer: card.meaning, audioText: card.kana }))}
            scope={`ngay-${data.day}`} recordsByPairs={{}} unit="từ" />
        ) : null}
        {stepId === 'tu-vung' && (mode === 'nghia' || mode === 'tu' || mode === 'go') ? (
          <StudyQuiz questions={questions} unit="từ" {...quizProps} />
        ) : null}

        {stepId === 'ngu-phap' && mode === LESSON_MODE ? (
          <div className="stack" style={{ gap: 12 }}>
            {data.grammar.map((card) => <GrammarTopic key={card.key} card={card} isMarked={marked.has(card.key)} onToggleMark={() => toggleMark(card.key)} />)}
          </div>
        ) : null}
        {stepId === 'ngu-phap' && (mode === 'viet-nhat' || mode === 'nhat-viet') ? (
          <StudyQuiz questions={questions} unit="câu" {...quizProps} />
        ) : null}
        {stepId === 'ngu-phap' && (mode === 'sap-xep' || mode === 'tu-viet') ? <GrammarPractice cards={data.grammar} kind={mode} onRestart={restart} /> : null}

        {stepId === 'bo-thu' && mode === LESSON_MODE ? (
          <>
            <p className="sm soft mb-2">Bộ thủ là “mảnh ghép” giúp nhận ra và nhớ cấu tạo chữ Hán. Học bộ thủ không thay cho học Kanji — Kanji có bước riêng.</p>
            <Flashcards cards={data.radicals} unit="bộ" marked={marked} onToggleMark={toggleMark}
              front={(card) => <span className="glyph flashcard-glyph">{card.glyph}</span>} back={(card) => <RadicalBack card={card} />} />
          </>
        ) : null}
        {stepId === 'bo-thu' && mode === 'nghia' ? <StudyQuiz questions={questions} unit="bộ" {...quizProps} /> : null}

        {stepId === 'kanji' && mode === LESSON_MODE ? (
          <>
            {data.kanji.length ? (
              <Flashcards cards={data.kanji} unit="chữ" marked={marked} onToggleMark={toggleMark}
                audioText={(card) => card.words[0]?.reading ?? card.readings[0] ?? card.character}
                front={(card) => <span className="glyph flashcard-glyph">{card.character}</span>}
                back={(card) => <KanjiBack card={card} />} footer={(card) => <StrokeToggle key={card.key} character={card.character} />} />
            ) : null}
          </>
        ) : null}
        {stepId === 'kanji' && mode !== LESSON_MODE ? (
          <StudyQuiz questions={questions} unit="câu" {...quizProps} />
        ) : null}

        {stepId === 'on-tap' ? <ReviewStep data={data} tracking={tracking} /> : null}
      </div>

      {nextStep ? (
        <div className="study-next">
          <span className="tiny muted">Xong phần này?</span>
          <button type="button" className="btn" onClick={() => goTo(nextStep.id)}>Tiếp: {nextStep.label} →</button>
        </div>
      ) : null}
    </div>
  );
}

function KanaBack({ card }: { card: StudyKanaCard }) {
  return (
    <>
      <span className="glyph" style={{ fontSize: 56, lineHeight: 1.1 }}>{card.face}</span>
      <b className="flashcard-meaning" style={{ letterSpacing: '.06em' }}>{card.romaji}</b>
      <span className="tiny muted">{card.script}</span>
      {card.exampleWords.length ? (
        <span className="flashcard-example">
          <span className="tiny muted">Từ có chữ này</span>
          {card.exampleWords.map((word) => <span key={word.face} className="sm"><b className="jp">{word.face}</b> — {word.meaning}</span>)}
        </span>
      ) : null}
    </>
  );
}

function VocabFront({ card }: { card: StudyVocabCard }) {
  return (
    <>
      <span className="fit-box"><span className="glyph flashcard-glyph fit-text" style={fitTextStyle(card.face, 56, 26)}>{card.face}</span></span>
      {card.kanji ? <span className="jp soft">{card.kana}</span> : null}
    </>
  );
}

function VocabBack({ card }: { card: StudyVocabCard }) {
  return (
    <>
      <ContentImageView image={card.image} size={72} />
      <span className="fit-box"><span className="glyph fit-text" style={fitTextStyle(card.face, 34, 22)}>{card.face}</span></span>
      {card.kanji ? <span className="jp">{card.kana}</span> : null}
      <span className="romaji">{card.romaji}</span>
      <b className="flashcard-meaning">{card.meaning}</b>
      {card.example ? (
        <span className="flashcard-example">
          <span className="jp">{card.example.jp}</span>
          {card.example.romaji ? <span className="romaji">{card.example.romaji}</span> : null}
          <span className="sm soft">{card.example.vi}</span>
        </span>
      ) : null}
    </>
  );
}

function KanjiBack({ card }: { card: StudyKanjiCard }) {
  return (
    <>
      <ContentImageView image={card.image} size={72} />
      <span className="row" style={{ gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <span className="glyph" style={{ fontSize: 44 }}>{card.character}</span>
        <span style={{ textAlign: 'left' }}><b>{card.hanViet}</b><br /><span className="sm">{card.meaning}</span></span>
      </span>
      <span className="kanji-readings sm">
        {card.onReading ? <span><span className="tiny muted">On</span> <b className="jp">{card.onReading}</b></span> : null}
        {card.kunReading ? <span><span className="tiny muted">Kun</span> <b className="jp">{card.kunReading}</b></span> : null}
      </span>
      {card.readingRomaji ? <span className="romaji">{card.readingRomaji}</span> : null}
      {card.words.length ? (
        <span className="flashcard-example">
          <span className="tiny muted">Từ ghép</span>
          {card.words.map((word) => <span key={word.word} className="sm"><b className="jp">{word.word}</b> <span className="jp soft">({word.reading})</span> {word.meaning}</span>)}
        </span>
      ) : null}
      {card.radicals.length ? (
        <span className="sm soft">Bộ thủ trong chữ: <span className="jp">{card.radicals.map((radical) => `${radical.glyph} (${radical.meaning.split(/[,;]/)[0].toLowerCase()})`).join(' + ')}</span></span>
      ) : null}
      {card.relatedVocab.length ? (
        <span className="sm soft">Trong từ vựng: {card.relatedVocab.map((word) => `${word.face} (${word.kana})`).join(' · ')}</span>
      ) : null}
      {card.tip ? <span className="sm flashcard-tip">💡 {card.tip}</span> : null}
    </>
  );
}

function RadicalBack({ card }: { card: StudyRadicalCard }) {
  return (
    <>
      <ContentImageView image={card.image} size={72} />
      <span className="row" style={{ gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <span className="glyph" style={{ fontSize: 44 }}>{card.glyph}</span>
        <span style={{ textAlign: 'left' }}><b>Bộ {card.meaning}</b><br /><span className="sm jp soft">{card.name}</span></span>
      </span>
      {card.kanji.length ? (
        <span className="flashcard-example">
          <span className="tiny muted">Kanji có bộ này</span>
          <span className="sm">{card.kanji.map((kanji) => <span key={kanji.character} style={{ marginRight: 10 }}><b className="jp">{kanji.character}</b> {kanji.meaning.split(/[,;]/)[0]}</span>)}</span>
        </span>
      ) : null}
      {card.tip ? <span className="sm flashcard-tip">💡 {card.tip}</span> : null}
    </>
  );
}

function StrokeToggle({ character }: { character: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="center mt-2">
      <button type="button" className="btn ghost sm" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
        ✍️ {isOpen ? 'Ẩn thứ tự nét' : 'Xem thứ tự nét'}
      </button>
      {isOpen ? (
        <div className="mt-2">
          <StrokeOrder character={character} size={170} />
          <Link className="link sm" href={`/luyen-tap/viet?chu=${encodeURIComponent(character)}`}>Luyện viết chữ này →</Link>
        </div>
      ) : null}
    </div>
  );
}

function GrammarTopic({ card, isMarked, onToggleMark }: { card: StudyGrammarCard; isMarked: boolean; onToggleMark: () => void }) {
  return (
    <article className="card grammar-topic">
      <div className="between" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div>
          <p className="tiny muted">Công thức</p>
          <h2 className="jp grammar-pattern">{card.pattern}</h2>
          {card.romaji ? <p className="romaji">{card.romaji}</p> : null}
        </div>
        <button type="button" className={`btn sm ${isMarked ? 'review' : 'ghost'}`} aria-pressed={isMarked} onClick={onToggleMark}>
          {isMarked ? '★ Đã đánh dấu' : '☆ Đánh dấu ôn'}
        </button>
      </div>
      <dl className="grammar-facts">
        <dt>Ý nghĩa</dt><dd>{card.meaning}</dd>
        {card.whenToUse ? <><dt>Khi nào dùng</dt><dd>{card.whenToUse}</dd></> : null}
        {card.commonMistake ? <><dt>Lỗi hay gặp</dt><dd>⚠️ {card.commonMistake}</dd></> : null}
      </dl>
      <p className="tiny muted mt-2">Ví dụ</p>
      <ul className="grammar-examples">
        {card.examples.map((example) => (
          <li key={example.jp}>
            <span className="row" style={{ gap: 6, alignItems: 'center' }}>
              <b className="jp">{example.jp}</b>
              <AudioButton text={example.reading || example.jp} />
            </span>
            {example.reading ? <span className="jp tiny muted">{example.reading}</span> : null}
            {example.romaji ? <span className="romaji">{example.romaji}</span> : null}
            <span className="sm soft">{example.vi}</span>
          </li>
        ))}
      </ul>
      <p className="sm grammar-apply mt-2">✍️ <b>Áp dụng:</b> thử đặt một câu của bạn theo mẫu <span className="jp">{card.pattern}</span> — rồi luyện ở “Việt → Nhật”, “Sắp xếp câu”, “Tự viết câu”.</p>
    </article>
  );
}

function ReviewStep({ data, tracking }: { data: DayStudyData; tracking: Tracking }) {
  const faces = new Map<string, string>([
    ...data.kana.map((card) => [card.key, card.face] as const),
    ...data.vocab.map((card) => [card.key, card.face] as const),
    ...data.grammar.map((card) => [card.key, card.pattern] as const),
    ...data.radicals.map((card) => [card.key, card.glyph] as const),
    ...data.kanji.map((card) => [card.key, card.character] as const),
  ]);
  const ownKeys = new Set(faces.keys());
  const wrong = tracking.wrong.filter((key) => ownKeys.has(key));
  const marked = tracking.marked.filter((key) => ownKeys.has(key) && !wrong.includes(key));
  const keys = [...new Set([...wrong, ...marked, ...data.weakestKeys])].slice(0, MAX_FOCUS_ITEMS);
  const show = (list: string[]) => list.map((key) => faces.get(key)).filter(Boolean).join('・');
  return (
    <section className="card">
      <h2 style={{ fontSize: 18 }}>🔁 Ôn tập ngày {data.day}</h2>
      <p className="sm soft mt-1">Một phiên gặp lại mọi thứ của ngày: câu bạn làm sai và mục đã đánh dấu đi trước, sau đó tới thứ còn yếu nhất.</p>
      <ul className="sm mt-3 stack" style={{ gap: 6 }}>
        <li>❌ Câu sai hôm nay: <b>{wrong.length}</b>{wrong.length ? <span className="jp soft"> — {show(wrong)}</span> : null}</li>
        <li>☆ Đã đánh dấu: <b>{marked.length}</b>{marked.length ? <span className="jp soft"> — {show(marked)}</span> : null}</li>
        <li>📚 Tổng cộng: <b>{keys.length}</b> mục của ngày</li>
      </ul>
      {keys.length ? (
        <div className="mt-4"><NekoButton href={focusSessionHref(keys)} size="lg">Bắt đầu ôn {keys.length} mục</NekoButton></div>
      ) : <p className="sm soft mt-3">Ngày này chưa có gì để ôn.</p>}
      <p className="sm mt-3"><Link className="link" href={`/lo-trinh/ngay/${data.day}`}>← Về trang ngày {data.day}</Link></p>
    </section>
  );
}
