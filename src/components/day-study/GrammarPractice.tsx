'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { shuffle } from '@/features/games/match-game';
import { orderTokens } from '@/features/learning/day-study-quiz';
import type { StudyGrammarCard, StudyGrammarExample } from '@/features/learning/day-study';
import { compareJapanese, normalizeJapanese } from '@/lib/utils/japanese-text';

interface PracticeItem {
  id: string;
  pattern: string;
  example: StudyGrammarExample;
  tokens: string[];
}

/** Mảnh của câu sắp xếp, kèm vị trí gốc (hai mảnh giống nhau vẫn phân biệt được). */
interface Piece { index: number; text: string }

const MIN_PIECES = 3;

/**
 * Luyện thêm ngữ pháp — CHỈ LUYỆN, không ghi trí nhớ (đã thống nhất): chấm trong trình duyệt, xem đáp án ngay.
 *  - "sap-xep": chạm các mảnh theo đúng thứ tự câu tiếng Nhật.
 *  - "tu-viet": đọc câu tiếng Việt, tự gõ câu tiếng Nhật (chấp nhận kana hoặc có chữ Hán, bỏ qua dấu câu / khoảng trắng).
 */
export function GrammarPractice({ cards, kind, onRestart }: { cards: readonly StudyGrammarCard[]; kind: 'sap-xep' | 'tu-viet'; onRestart: () => void }) {
  const items = useMemo<PracticeItem[]>(() => shuffle(cards.flatMap((card) => card.examples.map((example, index) => ({
    id: `${card.key}:${index}`, pattern: card.pattern, example, tokens: orderTokens(example.jp),
  })))).filter((item) => kind === 'tu-viet' || item.tokens.length >= MIN_PIECES), [cards, kind]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [typed, setTyped] = useState('');
  const [placed, setPlaced] = useState<Piece[]>([]);
  const item = items[index];
  const pieces = useMemo(() => (item ? shuffle(item.tokens.map((text, position) => ({ index: position, text }))) : []), [item]);

  function check(isCorrect: boolean) {
    setResult(isCorrect);
    if (isCorrect) setCorrectCount((current) => current + 1);
  }

  function next() {
    setIndex((current) => current + 1);
    setResult(null);
    setTyped('');
    setPlaced([]);
  }

  function place(piece: Piece) {
    if (result !== null) return;
    const nextPlaced = [...placed, piece];
    setPlaced(nextPlaced);
    if (nextPlaced.length === item.tokens.length) {
      check(nextPlaced.map((entry) => entry.text).join('') === item.tokens.join(''));
    }
  }

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    if (!typed.trim() || result !== null) return;
    check(compareJapanese(typed, [item.example.jp, item.example.reading].filter(Boolean)).isCorrect
      || normalizeJapanese(typed) === normalizeJapanese(item.example.reading || item.example.jp));
  }

  useEnterToContinue(result !== null && index < items.length, next);

  if (!items.length) return <p className="sm soft card tight">Câu ví dụ của ngày hơi ngắn để sắp xếp — thử “Tự viết câu” nhé.</p>;

  if (index >= items.length) {
    return (
      <section className="card study-result" aria-live="polite">
        <p className="chip mint">Luyện xong</p>
        <p className="study-result-score">{correctCount}/{items.length} câu đúng</p>
        <p className="sm soft">Bài luyện thêm — không tính vào trí nhớ.</p>
        <button type="button" className="btn ghost mt-3" onClick={onRestart}>↻ Làm lại</button>
      </section>
    );
  }

  const placedSet = new Set(placed.map((piece) => piece.index));
  return (
    <section className="card study-quiz" aria-live="polite">
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{items.length} · Luyện thêm, không tính điểm</span>
        <span className="chip lav jp">{item.pattern}</span>
      </div>
      <div className="study-progress" aria-hidden="true"><span style={{ width: `${(index / items.length) * 100}%` }} /></div>
      <p className="study-prompt">{item.example.vi}</p>
      {kind === 'sap-xep' ? (
        <>
          <div className={`order-answer jp ${result === true ? 'is-correct' : result === false ? 'is-wrong' : ''}`} aria-label="Câu bạn ghép">
            {placed.length ? placed.map((piece) => (
              <button key={piece.index} type="button" className="order-piece" disabled={result !== null}
                onClick={() => setPlaced(placed.filter((entry) => entry.index !== piece.index))}>{piece.text}</button>
            )) : <span className="tiny muted">Chạm các mảnh bên dưới theo thứ tự</span>}
          </div>
          <div className="order-pool jp">
            {pieces.map((piece) => (
              <button key={piece.index} type="button" className="order-piece" disabled={placedSet.has(piece.index) || result !== null}
                onClick={() => place(piece)}>{piece.text}</button>
            ))}
          </div>
        </>
      ) : (
        <form className="study-typing mt-3" onSubmit={submitTyped}>
          <input className="input jp" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={result !== null}
            lang="ja" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Gõ câu tiếng Nhật…" aria-label="Câu tiếng Nhật"
            onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} />
          {result === null ? <button type="submit" className="btn" disabled={!typed.trim()}>Kiểm tra</button> : null}
        </form>
      )}
      {result !== null ? (
        <div className={`feedback ${result ? '' : 'miss'}`}>
          <p>{result ? 'Đúng rồi! 🎉' : 'Gần đúng rồi — so với câu mẫu nhé.'}</p>
          <div className="row mt-1" style={{ gap: 6, alignItems: 'center' }}>
            <b className="jp">{item.example.jp}</b>
            <AudioButton text={item.example.reading || item.example.jp} />
          </div>
          {item.example.romaji ? <p className="romaji">{item.example.romaji}</p> : null}
          <button type="button" className="btn block mt-3" onClick={next}>{index + 1 === items.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
        </div>
      ) : null}
    </section>
  );
}
