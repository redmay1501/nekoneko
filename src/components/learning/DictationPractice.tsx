'use client';

import { KanaReading } from '@/components/common/KanaReading';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { AutoNextToggle } from '@/components/common/AutoNextToggle';
import { useAutoAdvance } from '@/hooks/useAutoNext';
import { useScrollToAnswerFeedback } from '@/hooks/useScrollToAnswerFeedback';
import type { DictationItem } from '@/features/learning/skill-practice';
import { answerVocabularyCheck } from '@/features/memory/memory-api';
import { ApiClientError } from '@/lib/api/api-client';
import { shouldFocusAnswerInput } from '@/features/learning/input-focus';
import { type JapaneseComparison, compareJapanese } from '@/lib/utils/japanese-text';

type Mode = 'words' | 'sentences';

/** "Hiện nghĩa tiếng Việt" khi gõ từ / gõ câu — một lựa chọn cho cả hai chế độ, nhớ trên máy này. */
const SHOW_MEANING_KEY = 'neko-dictation-show-meaning';
function readShowMeaning(): boolean {
  try { return localStorage.getItem(SHOW_MEANING_KEY) !== '0'; } catch { return true; }
}
/** Máy có chuột / bàn phím thật: focus ô gõ ngay khi mở được. Màn cảm ứng: chỉ focus sau khi người học thao tác (tránh bật bàn phím ảo). */
const hasFinePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

interface Result {
  item: DictationItem;
  typed: string;
  comparison: JapaneseComparison;
}

/**
 * Nghe → hiểu → gõ tiếng Nhật → kiểm tra → điểm (học theo ý tưởng dictation, giao diện của Neko Neko).
 * So khớp đã chuẩn hoá: bỏ dấu câu / khoảng trắng, toàn ↔ nửa chiều rộng, Katakana ↔ Hiragana; chấp nhận chữ Hán hoặc kana.
 * Chỗ sai được tô đỏ trên đáp án; mỗi câu có điểm theo số ký tự đúng.
 */
export function DictationPractice({ words, sentences }: { words: DictationItem[]; sentences: DictationItem[] }) {
  const [mode, setMode] = useState<Mode>(words.length ? 'words' : 'sentences');
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [showHint, setShowHint] = useState(true);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
  /** Người học đã thao tác trong bài (đổi chế độ, chấm, sang câu) — từ đó mới tự focus trên màn cảm ứng. */
  const hasInteracted = useRef(false);
  const [current, setCurrent] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useScrollToAnswerFeedback(nextButtonRef, current);
  const items = mode === 'words' ? words : sentences;
  const isDone = items.length > 0 && index >= items.length;
  // Xong bài → focus nút "Làm lại" để Enter làm lại ngay.
  useEffect(() => { if (isDone) restartButtonRef.current?.focus({ preventScroll: true }); }, [isDone]);
  useEffect(() => setShowHint(readShowMeaning()), []);
  function toggleMeaning() {
    setShowHint((value) => {
      try { localStorage.setItem(SHOW_MEANING_KEY, value ? '0' : '1'); } catch { /* chế độ riêng tư */ }
      return !value;
    });
  }
  // Câu mới / đổi chế độ: focus ô gõ SAU khi câu mới đã vẽ (requestAnimationFrame) — không focus khi đã chấm (ô chỉ đọc) hay xong bài.
  useEffect(() => {
    if (!shouldFocusAnswerInput({ hasItems: items.length > 0, isAnswered: Boolean(current), isDone, hasInteracted: hasInteracted.current, hasFinePointer: hasFinePointer() })) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [mode, index, current, isDone, items.length]);

  function switchMode(next: Mode) {
    setMode(next);
    setIndex(0);
    setResults([]);
    setCurrent(null);
    setTyped('');
    hasInteracted.current = true;
  }

  /** Enter trong ô gõ: lần đầu chấm, lần sau sang câu tiếp (ô gõ giữ focus suốt — gõ liền tay không cần chuột). */
  function check(event: FormEvent) {
    event.preventDefault();
    if (current) { next(); return; }
    const item = items[index];
    if (!item || !typed.trim()) return;
    const result = { item, typed, comparison: compareJapanese(typed, item.accepted, { foldKatakana: true }) };
    setCurrent(result);
    setResults((list) => [...list, result]);
    hasInteracted.current = true;
    if (mode === 'words') {
      // Từ chưa học: server không ghi trí nhớ (404) — vẫn coi là đã ghi nhận câu trả lời.
      setSaveState('saving');
      const asked = index;
      answerVocabularyCheck(item.contentKey, typed, 'reading')
        .then(() => { if (indexRef.current === asked) setSaveState('saved'); })
        .catch((error: unknown) => {
          if (indexRef.current !== asked) return;
          setSaveState(error instanceof ApiClientError && error.status === 404 ? 'saved' : 'error');
        });
    } else {
      setSaveState('saved');
    }
  }
  const indexRef = useRef(index);
  indexRef.current = index;

  function next() {
    setCurrent(null);
    setTyped('');
    setSaveState('saved');
    hasInteracted.current = true;
    setIndex((value) => value + 1);
    // Bấm "Câu tiếp" bằng chuột / chạm → đưa con trỏ lại ô gõ cho câu mới.
    inputRef.current?.focus({ preventScroll: true });
  }

  const isAutoNext = useAutoAdvance({
    answerKey: current ? `${mode}:${index}` : null,
    isCorrect: current?.comparison.isCorrect,
    isReady: saveState === 'saved',
    onNext: next,
  });

  const tabs = (
    <div className="pill-tabs mb-3" role="tablist" aria-label="Kiểu nghe – gõ">
      <button type="button" role="tab" aria-selected={mode === 'words'} className={`tab ${mode === 'words' ? 'on' : ''}`}
        onClick={() => switchMode('words')} disabled={!words.length}>🔤 Gõ từ</button>
      <button type="button" role="tab" aria-selected={mode === 'sentences'} className={`tab ${mode === 'sentences' ? 'on' : ''}`}
        onClick={() => switchMode('sentences')} disabled={!sentences.length}>💬 Gõ câu</button>
    </div>
  );

  if (!items.length) {
    return <section className="card">{tabs}<p className="sm soft">Học thêm vài từ và mẫu câu đầu tiên (từ ngày 14) là có bài nghe – gõ ở đây.</p></section>;
  }

  if (index >= items.length) {
    const average = Math.round(results.reduce((sum, result) => sum + result.comparison.score, 0) / results.length);
    const perfect = results.filter((result) => result.comparison.isCorrect).length;
    return (
      <section className="card" aria-live="polite">
        {tabs}
        <div className="center">
          <p className="chip mint">Xong bài nghe – gõ</p>
          <p style={{ fontSize: 30, fontWeight: 700, margin: '10px 0 2px' }}>{average}%</p>
          <p className="sm soft">{perfect}/{results.length} câu đúng hoàn toàn</p>
        </div>
        {results.some((result) => !result.comparison.isCorrect) ? (
          <div className="stack mt-3" style={{ gap: 6 }}>
            <b className="sm">Xem lại câu chưa đúng</b>
            {results.filter((result) => !result.comparison.isCorrect).map((result) => (
              <div key={result.item.display} className="card tight">
                <p><span className="jp">{result.item.display}</span><KanaReading text={result.item.display} reading={result.item.reading} block /></p>
                <p className="tiny muted">Bạn gõ: <span className="jp">{result.typed}</span> · {result.comparison.score}%</p>
              </div>
            ))}
          </div>
        ) : null}
        <button ref={restartButtonRef} type="button" className="btn block mt-3" onClick={() => switchMode(mode)}>Làm lại</button>
      </section>
    );
  }

  const item = items[index];
  return (
    <section className="card" aria-live="polite">
      {tabs}
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{items.length}</span>
        <AutoNextToggle />
      </div>
      {/* Hiện / ẩn nghĩa tiếng Việt — cùng một công tắc cho gõ từ và gõ câu, đổi được giữa bài. Chỉ là nghĩa, không lộ chữ Nhật. */}
      <label className="row mt-2 tiny" style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" checked={showHint} onChange={toggleMeaning} />
        Hiện nghĩa tiếng Việt
      </label>
      <div className="center mt-2">
        <AudioButton text={item.audioText} label="🔊 Nghe" className="btn ghost" />
        {showHint ? <p className="sm soft mt-2"><span className="tiny muted">Nghĩa: </span>“{item.hint}”</p> : <p className="tiny muted mt-2">Nghe rồi gõ lại bằng tiếng Nhật.</p>}
      </div>
      <form onSubmit={check} className="mt-3">
        <input ref={inputRef} className="input jp" value={typed} onChange={(event) => setTyped(event.target.value)} readOnly={Boolean(current)}
          // Đã chấm: chỉ đọc (KHÔNG disabled — disabled làm mất focus, Enter không còn tác dụng).
          // Enter để CHỐT CHỮ của bộ gõ tiếng Nhật không được nộp bài (Safari gửi Enter ngay sau khi chốt).
          onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }}
          lang="ja" autoComplete="off" autoCorrect="off" spellCheck={false}
          placeholder={mode === 'words' ? 'Gõ từ bạn nghe được (kana hoặc chữ Hán)' : 'Gõ cả câu bạn nghe được'} aria-label="Câu trả lời" />
        {!current ? <button type="submit" className="btn block mt-2.5" disabled={!typed.trim()}>Kiểm tra</button> : null}
      </form>
      {current ? (
        <div className={`feedback ${current.comparison.isCorrect ? '' : 'miss'}`}>
          <p>{current.comparison.isCorrect
            ? (current.comparison.isLenient ? 'Đúng rồi! (khác chút dấu câu / cách viết — vẫn tính đúng) 🌸' : 'Chính xác! 🌸')
            : `Gần đúng ${current.comparison.score}% — chữ đỏ là chỗ cần sửa.`}</p>
          <p className="jp mt-1.5" style={{ fontSize: 18 }} aria-label={`Đáp án: ${item.display}`}>
            {current.comparison.isCorrect ? item.display : current.comparison.diff.map((cell, position) => (
              <span key={position} className={cell.isMatch ? 'dict-ok' : 'dict-miss'}>{cell.character}</span>
            ))}
          </p>
          {current.comparison.isCorrect ? <KanaReading text={item.display} reading={item.reading} block /> : null}
          {!current.comparison.isCorrect ? (
            <p className="tiny muted mt-1">Đáp án: <span className="jp">{item.display}</span><KanaReading text={item.display} reading={item.reading} block /></p>
          ) : null}
          {saveState === 'error' ? <p className="tiny mt-2" role="alert">Chưa lưu được câu này (mạng?) — bài vẫn tiếp tục.</p> : null}
          <button ref={nextButtonRef} type="button" className={`btn block mt-2.5 streak-next${isAutoNext ? ' is-auto' : ''}`} onClick={next}>
            {isAutoNext ? 'Tự chuyển… · bấm để sang ngay →' : <>{index + 1 === items.length ? 'Xem kết quả' : 'Câu tiếp'} <span className="tiny muted">(Enter)</span></>}
          </button>
        </div>
      ) : null}
    </section>
  );
}
