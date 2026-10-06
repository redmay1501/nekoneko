'use client';

import { type FormEvent, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import type { DictationItem } from '@/features/learning/skill-practice';
import { answerVocabularyCheck } from '@/features/memory/memory-api';
import { type JapaneseComparison, compareJapanese } from '@/lib/utils/japanese-text';

type Mode = 'words' | 'sentences';

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
  const [showHint, setShowHint] = useState(false);
  const [current, setCurrent] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const items = mode === 'words' ? words : sentences;

  function switchMode(next: Mode) {
    setMode(next);
    setIndex(0);
    setResults([]);
    setCurrent(null);
    setTyped('');
    setShowHint(false);
  }

  function check(event: FormEvent) {
    event.preventDefault();
    const item = items[index];
    if (!item || !typed.trim() || current) return;
    const result = { item, typed, comparison: compareJapanese(typed, item.accepted, { foldKatakana: true }) };
    setCurrent(result);
    setResults((list) => [...list, result]);
    if (mode === 'words') answerVocabularyCheck(item.contentKey, typed, 'reading').catch(() => undefined);
  }

  function next() {
    setCurrent(null);
    setTyped('');
    setShowHint(false);
    setIndex((value) => value + 1);
  }

  const tabs = (
    <div className="pill-tabs mb-3" role="tablist" aria-label="Kiểu nghe – gõ">
      <button type="button" role="tab" aria-selected={mode === 'words'} className={`tab ${mode === 'words' ? 'on' : ''}`}
        onClick={() => switchMode('words')} disabled={!words.length}>🔤 Gõ từ</button>
      <button type="button" role="tab" aria-selected={mode === 'sentences'} className={`tab ${mode === 'sentences' ? 'on' : ''}`}
        onClick={() => switchMode('sentences')} disabled={!sentences.length}>💬 Gõ câu</button>
    </div>
  );

  if (!items.length) {
    return <section className="card">{tabs}<p className="sm soft">Học thêm vài từ và mẫu câu đầu tiên (từ ngày 15) là có bài nghe – gõ ở đây.</p></section>;
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
                <p className="jp">{result.item.display}</p>
                <p className="tiny muted">Bạn gõ: <span className="jp">{result.typed}</span> · {result.comparison.score}%</p>
              </div>
            ))}
          </div>
        ) : null}
        <button type="button" className="btn block mt-3" onClick={() => switchMode(mode)}>Làm lại</button>
      </section>
    );
  }

  const item = items[index];
  return (
    <section className="card" aria-live="polite">
      {tabs}
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{items.length}</span>
        <button type="button" className="link tiny" onClick={() => setShowHint((value) => !value)}>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý nghĩa'}</button>
      </div>
      <div className="center mt-2">
        <AudioButton text={item.audioText} label="🔊 Nghe" className="btn ghost" />
        {showHint || mode === 'words' ? <p className="sm soft mt-2">“{item.hint}”</p> : null}
      </div>
      <form onSubmit={check} className="mt-3">
        <input className="input jp" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={Boolean(current)}
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
          {!current.comparison.isCorrect ? <p className="tiny muted mt-1">Đáp án: <span className="jp">{item.display}</span></p> : null}
          <button type="button" className="btn block mt-2.5" onClick={next} autoFocus>{index + 1 === items.length ? 'Xem kết quả' : 'Câu tiếp'}</button>
        </div>
      ) : null}
    </section>
  );
}
