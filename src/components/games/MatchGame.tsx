'use client';

import Link from 'next/link';
import { RatingCat } from '@/components/common/RatingCat';
import { type CSSProperties, useEffect, useState } from 'react';
import { LottieAnimation } from '@/components/common/LottieAnimation';
import { NekoButton } from '@/components/common/NekoButton';
import { useSpeech } from '@/hooks/useSpeech';
import { useEnterToContinue } from '@/hooks/useEnterToContinue';
import { postJson } from '@/lib/api/api-client';
import { focusSessionHref } from '@/features/learning/session-modes';
import {
  MATCH_GAME, type GameRecord, type MatchCard, accuracyOf, formatDuration, pickMatchRound, shuffle,
} from '@/features/games/match-game';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

interface MatchGameProps {
  pool: MatchCard[];
  /** Phạm vi lưu kỷ lục, ví dụ "tu-vung:tat-ca" — cộng thêm cỡ bàn (":6" / ":8") khi lưu. */
  scope: string;
  /** Kỷ lục đã có theo số cặp của bàn (6 = 12 ô, 8 = 16 ô). */
  recordsByPairs: Partial<Record<BoardPairs, GameRecord>>;
  unit: string;
}

/** Cỡ bàn: 12 ô (6 cặp) hoặc 16 ô (8 cặp) — lưới 4 cột ô vuông. */
const BOARD_SIZES = [6, 8] as const;
export type BoardPairs = (typeof BOARD_SIZES)[number];

type Side = 'face' | 'answer';
interface Tile { side: Side; card: MatchCard }
interface Round { cards: MatchCard[]; tiles: Tile[]; startedAt: number }
interface Finished { pairs: number; mistakes: number; timeMs: number; missed: MatchCard[] }
interface SaveState { status: 'saving' | 'saved' | 'error'; record: GameRecord | null; isNewBest: boolean }

/** Thời gian lật sai hiện đỏ trước khi úp lại. */
const WRONG_FLASH_MS = 550;

/**
 * Ghép thẻ: chạm một thẻ tiếng Nhật rồi chạm nghĩa của nó. Ghép hết là xong — có thời gian, số lần sai,
 * độ chính xác và kỷ lục. Kết quả KHÔNG đổi điểm trí nhớ; thẻ ghép sai được gợi ý "Ôn ngay" (ghi trí nhớ thật).
 */
export function MatchGame({ pool, scope, recordsByPairs, unit }: MatchGameProps) {
  const [pairs, setPairs] = useState<BoardPairs>(6);
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<{ side: Side; key: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  /** Cặp vừa ghép sai (theo từng cột) — hiện đỏ một chút rồi úp lại. */
  const [wrong, setWrong] = useState<{ face: string; answer: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [save, setSave] = useState<SaveState | null>(null);
  const [records, setRecords] = useState(recordsByPairs);
  const record = records[pairs] ?? null;
  const [now, setNow] = useState(0);
  const { speak } = useSpeech();
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);

  // Đồng hồ chạy trong lúc chơi.
  useEffect(() => {
    if (!round || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [round, finished]);

  // Enter: màn bắt đầu → bắt đầu; màn kết quả → chơi lại. Trong lúc chơi thì không (ghép thẻ bằng chạm / chuột).
  useEnterToContinue(pool.length >= 3 && (!round || Boolean(finished)), () => start());

  function start() {
    const cards = pickMatchRound(pool, Math.random, pairs);
    // Chữ Nhật và nghĩa trộn chung một lưới — tìm cặp bằng mắt, không phải đọc theo hai cột.
    setRound({ cards, tiles: shuffle(cards.flatMap((card) => [{ side: 'face' as const, card }, { side: 'answer' as const, card }])), startedAt: Date.now() });
    setNow(Date.now());
    setPicked(null);
    setMatched([]);
    setWrong(null);
    setMistakes(0);
    setMissed([]);
    setFinished(null);
    setSave(null);
  }

  function finish(currentRound: Round, finalMistakes: number, finalMissed: string[]) {
    const result = { pairs: currentRound.cards.length, mistakes: finalMistakes, timeMs: Math.max(1000, Date.now() - currentRound.startedAt) };
    setFinished({ ...result, missed: currentRound.cards.filter((card) => finalMissed.includes(card.contentKey)) });
    setSave({ status: 'saving', record: null, isNewBest: false });
    postJson<{ record: GameRecord; isNewBest: boolean }>('/api/games/result', { game: MATCH_GAME, scope: `${scope}:${currentRound.cards.length}`, ...result })
      .then(({ record: saved, isNewBest }) => { setRecords((current) => ({ ...current, [pairs]: saved })); setSave({ status: 'saved', record: saved, isNewBest }); })
      .catch(() => setSave({ status: 'error', record: null, isNewBest: false }));
  }

  function choose(side: Side, card: MatchCard) {
    if (!round || finished || matched.includes(card.contentKey) || wrong) return;
    if (!picked || picked.side === side) {
      setPicked(picked?.side === side && picked.key === card.contentKey ? null : { side, key: card.contentKey });
      return;
    }
    setPicked(null);
    if (picked.key === card.contentKey) {
      const nextMatched = [...matched, card.contentKey];
      setMatched(nextMatched);
      if (autoplayAudio) speak(card.audioText);
      if (nextMatched.length === round.cards.length) finish(round, mistakes, missed);
      return;
    }
    // Ghép sai: cả hai thẻ đều là thứ người học đang nhầm → gợi ý ôn.
    const pair = [picked.key, card.contentKey];
    setMistakes((count) => count + 1);
    setMissed((current) => [...new Set([...current, ...pair])]);
    setWrong(side === 'face' ? { face: card.contentKey, answer: picked.key } : { face: picked.key, answer: card.contentKey });
    window.setTimeout(() => setWrong(null), WRONG_FLASH_MS);
  }

  if (pool.length < 3) {
    return (
      <div className="card center">
        <p className="soft">Phần này chưa đủ 3 {unit} để chơi — chọn phần khác nhé.</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="card center match-start">
        <div className="match-intro">
          <LottieAnimation src="/animations/lurking-cat.json" className="match-intro-cat" stillFrame={20} />
          <div className="match-intro-text">
            <h2>Ghép thẻ</h2>
            <p className="sm soft">Tìm từng cặp <b>{unit} ↔ nghĩa</b> — nhanh và không sai để được 5 sao.</p>
          </div>
        </div>
        {/* Ví dụ ghép bằng chính 2 mục đầu của phần đang chọn (nội dung học thật, không phải hình minh hoạ). */}
        <div className="match-demo" aria-hidden="true">
          {pool.slice(0, 2).map((card) => (
            <div key={card.contentKey} className="match-demo-pair">
              <span className="match-tile face jp">{card.face}</span>
              <span className="match-demo-link">↔</span>
              <span className="match-tile answer">{card.answer}</span>
            </div>
          ))}
        </div>
        <ol className="match-steps">
          <li><b>1</b> Chạm một ô chữ Nhật</li>
          <li><b>2</b> Chạm ô nghĩa của nó</li>
          <li><b>3</b> Ghép hết, không sai = ★★★★★</li>
        </ol>
        <div className="match-size mt-3" role="radiogroup" aria-label="Cỡ bàn">
          {BOARD_SIZES.map((size) => (
            <button key={size} type="button" role="radio" aria-checked={pairs === size} disabled={pool.length < size}
              className={`match-size-option ${pairs === size ? 'on' : ''}`} onClick={() => setPairs(size)}>
              <b>{size * 2} ô</b><span>{size} cặp</span>
            </button>
          ))}
        </div>
        <p className="sm soft mt-1">Lấy ngẫu nhiên từ {pool.length} {unit} của phần này · mỗi ván một bộ khác.</p>
        <RecordLine record={record} />
        <div className="mt-3.5"><NekoButton variant="game" catPose="none" onClick={start}>▶ Bắt đầu</NekoButton></div>
        <p className="tiny muted mt-2">hoặc nhấn Enter</p>
      </div>
    );
  }

  if (finished) {
    const accuracy = accuracyOf(finished);
    return (
      <div className="card center match-result" role="status" aria-live="polite">
        <RatingCat stars={starsOf(accuracy)} />
        <h2 className="mt-1.5">{accuracy === 100 ? 'Hoàn hảo!' : accuracy >= 75 ? 'Giỏi lắm!' : 'Xong ván!'}</h2>
        <div className="match-stats mt-3">
          <span><b>{finished.pairs}/{finished.pairs}</b> cặp</span>
          <span><b>{finished.mistakes}</b> lần sai</span>
          <span><b>{accuracy}%</b> chính xác</span>
          <span><b>{formatDuration(finished.timeMs)}</b></span>
        </div>
        {save?.isNewBest ? <p className="chip pink mt-3">🎖️ Kỷ lục mới!</p> : null}
        {save?.status === 'error' ? <p className="sm mt-2" role="alert">Chưa lưu được kỷ lục — mạng hơi chập chờn.</p> : null}
        <RecordLine record={record} />
        {accuracy < 100 ? <p className="sm soft mt-2">Mục tiêu: <b>100%</b> — ghép hết không sai lần nào.</p> : null}
        {finished.missed.length ? (
          <div className="card tight mt-3.5" style={{ textAlign: 'left' }}>
            <b className="sm">Bạn hay nhầm:</b>
            <div className="row wrap mt-2" style={{ gap: 6 }}>
              {finished.missed.map((card) => <span key={card.contentKey} className="chip"><b className="jp">{card.face}</b> {card.answer}</span>)}
            </div>
            <Link className="btn ghost sm mt-2.5" href={focusSessionHref(finished.missed.map((card) => card.contentKey))}>
              🔁 Ôn {finished.missed.length} {unit} này
            </Link>
          </div>
        ) : null}
        <div className="mt-3.5"><NekoButton variant="game" catPose="none" onClick={start}>↺ Chơi lại</NekoButton></div>
        <p className="tiny muted mt-1.5">hoặc nhấn Enter</p>
        <p className="tiny muted mt-2.5">Điểm trò chơi không tính vào trí nhớ. Muốn nhớ lâu, hãy ôn trong phiên học.</p>
      </div>
    );
  }

  const tileClass = (side: Side, card: MatchCard) => [
    'match-tile', side === 'face' ? 'jp glyph face' : 'answer', lengthClass(side, card),
    matched.includes(card.contentKey) ? 'done' : '',
    picked?.side === side && picked.key === card.contentKey ? 'picked' : '',
    wrong?.[side] === card.contentKey ? 'wrong' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="match-board">
      <div className="between mb-1.5">
        <span className="sm">Đã ghép <b>{matched.length}/{round.cards.length}</b> cặp · sai <b>{mistakes}</b></span>
        <span className="chip" aria-label="Thời gian">⏱ {formatDuration(Math.max(0, now - round.startedAt))}</span>
      </div>
      <div className="match-progress" role="progressbar" aria-label="Tiến độ ghép thẻ" aria-valuemin={0} aria-valuemax={round.cards.length} aria-valuenow={matched.length}>
        <i style={{ width: `${(matched.length / round.cards.length) * 100}%` }} />
      </div>
      <div className={`match-board-grid size-${round.tiles.length}`}>
        {round.tiles.map((tile, index) => (
          <button key={`${tile.side}-${tile.card.contentKey}`} type="button" className={tileClass(tile.side, tile.card)}
            disabled={matched.includes(tile.card.contentKey)} style={{ '--i': index } as CSSProperties}
            aria-pressed={picked?.side === tile.side && picked.key === tile.card.contentKey}
            aria-label={tile.side === 'face' ? `${tile.card.tag ? `${tile.card.tag} ` : 'Chữ '}${tile.card.face}` : `Nghĩa: ${tile.card.answer}`}
            onClick={() => choose(tile.side, tile.card)}>
            {tile.side === 'face' && tile.card.tag ? <small className="match-tile-tag">{tile.card.tag}</small> : null}
            <span>{tile.side === 'face' ? tile.card.face : tile.card.answer}</span>
          </button>
        ))}
      </div>
      <p className="tiny muted center mt-2.5">Chạm một ô chữ Nhật và ô nghĩa của nó (thứ tự nào cũng được).</p>
    </div>
  );
}

/**
 * Cỡ chữ theo độ dài nội dung — ô vuông nhỏ (≈ 80 px trên điện thoại) nên từ / nghĩa dài phải nhỏ lại thay vì tràn ô.
 * Mặt chữ Nhật: 1–2 chữ to nhất; nghĩa tiếng Việt: theo số ký tự.
 */
function lengthClass(side: Side, card: MatchCard): string {
  const length = [...(side === 'face' ? card.face : card.answer)].length;
  if (side === 'face') return length <= 2 ? '' : length <= 4 ? 'len-m' : length <= 6 ? 'len-l' : 'len-xl';
  return length <= 12 ? '' : length <= 22 ? 'len-m' : length <= 34 ? 'len-l' : 'len-xl';
}

function RecordLine({ record }: { record: GameRecord | null }) {
  if (!record) return <p className="sm muted mt-2">Chưa có kỷ lục — ván đầu tiên nào!</p>;
  return (
    <p className="sm mt-2">
      Kỷ lục: <b>{record.bestAccuracy}%</b> · <b>{formatDuration(record.bestTimeMs)}</b>
      <span className="muted"> · {record.plays} lần chơi</span>
    </p>
  );
}

/** 5 sao: 100% · 4: ≥ 90% · 3: ≥ 75% · 2: ≥ 50% · 1: còn lại — mục tiêu rõ để muốn chơi lại. */
export function starsOf(accuracy: number): number {
  return accuracy === 100 ? 5 : accuracy >= 90 ? 4 : accuracy >= 75 ? 3 : accuracy >= 50 ? 2 : 1;
}
