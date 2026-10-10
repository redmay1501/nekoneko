'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { postJson } from '@/lib/api/api-client';
import { focusSessionHref } from '@/features/learning/session-modes';
import {
  MATCH_GAME, type GameRecord, type MatchCard, accuracyOf, formatDuration, pickMatchRound, shuffle,
} from '@/features/games/match-game';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

interface MatchGameProps {
  pool: MatchCard[];
  /** Phạm vi lưu kỷ lục, ví dụ "tu-vung:tat-ca". */
  scope: string;
  initialRecord: GameRecord | null;
  unit: string;
}

type Side = 'face' | 'answer';
interface Round { cards: MatchCard[]; faces: MatchCard[]; answers: MatchCard[]; startedAt: number }
interface Finished { pairs: number; mistakes: number; timeMs: number; missed: MatchCard[] }
interface SaveState { status: 'saving' | 'saved' | 'error'; record: GameRecord | null; isNewBest: boolean }

/** Thời gian lật sai hiện đỏ trước khi úp lại. */
const WRONG_FLASH_MS = 550;

/**
 * Ghép thẻ: chạm một thẻ tiếng Nhật rồi chạm nghĩa của nó. Ghép hết là xong — có thời gian, số lần sai,
 * độ chính xác và kỷ lục. Kết quả KHÔNG đổi điểm trí nhớ; thẻ ghép sai được gợi ý "Ôn ngay" (ghi trí nhớ thật).
 */
export function MatchGame({ pool, scope, initialRecord, unit }: MatchGameProps) {
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<{ side: Side; key: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  /** Cặp vừa ghép sai (theo từng cột) — hiện đỏ một chút rồi úp lại. */
  const [wrong, setWrong] = useState<{ face: string; answer: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [save, setSave] = useState<SaveState | null>(null);
  const [record, setRecord] = useState(initialRecord);
  const [now, setNow] = useState(0);
  const { speak } = useSpeech();
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);

  // Đồng hồ chạy trong lúc chơi.
  useEffect(() => {
    if (!round || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [round, finished]);

  function start() {
    const cards = pickMatchRound(pool);
    setRound({ cards, faces: shuffle(cards), answers: shuffle(cards), startedAt: Date.now() });
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
    postJson<{ record: GameRecord; isNewBest: boolean }>('/api/games/result', { game: MATCH_GAME, scope, ...result })
      .then(({ record: saved, isNewBest }) => { setRecord(saved); setSave({ status: 'saved', record: saved, isNewBest }); })
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
        <p className="soft">Cần ít nhất 3 {unit} đã học trong phạm vi này để chơi.</p>
        <Link className="btn sm mt-3" href="/hoc/daily">Học hôm nay</Link>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="card center match-start">
        <div style={{ fontSize: 44 }} aria-hidden="true">🃏</div>
        <p className="mt-2"><b>Ghép {Math.min(6, pool.length)} cặp</b> {unit} ↔ nghĩa, nhanh và không sai.</p>
        <p className="sm soft mt-1">Chọn từ {pool.length} {unit} bạn đã học · mỗi ván một bộ khác.</p>
        <RecordLine record={record} />
        <button type="button" className="btn mt-3.5" onClick={start}>▶ Bắt đầu</button>
      </div>
    );
  }

  if (finished) {
    const accuracy = accuracyOf(finished);
    return (
      <div className="card center match-result" role="status" aria-live="polite">
        <div style={{ fontSize: 44 }} aria-hidden="true">{accuracy === 100 ? '🏆' : '🎉'}</div>
        <h2 className="mt-1.5">{accuracy === 100 ? 'Hoàn hảo!' : 'Xong ván!'}</h2>
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
        <button type="button" className="btn block mt-3.5" onClick={start}>↺ Chơi lại</button>
        <p className="tiny muted mt-2.5">Điểm trò chơi không tính vào trí nhớ. Muốn nhớ lâu, hãy ôn trong phiên học.</p>
      </div>
    );
  }

  const tileClass = (side: Side, card: MatchCard) => [
    'match-tile', side === 'face' ? 'jp glyph' : '',
    matched.includes(card.contentKey) ? 'done' : '',
    picked?.side === side && picked.key === card.contentKey ? 'picked' : '',
    wrong?.[side] === card.contentKey ? 'wrong' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="match-board">
      <div className="between mb-2.5">
        <span className="sm">Đã ghép <b>{matched.length}/{round.cards.length}</b> · sai <b>{mistakes}</b></span>
        <span className="chip" aria-label="Thời gian">⏱ {formatDuration(Math.max(0, now - round.startedAt))}</span>
      </div>
      <div className="match-grid">
        <div className="match-col" aria-label="Tiếng Nhật">
          {round.faces.map((card) => (
            <button key={card.contentKey} type="button" className={tileClass('face', card)} disabled={matched.includes(card.contentKey)}
              aria-pressed={picked?.side === 'face' && picked.key === card.contentKey} onClick={() => choose('face', card)}>
              {card.face}
            </button>
          ))}
        </div>
        <div className="match-col" aria-label="Nghĩa">
          {round.answers.map((card) => (
            <button key={card.contentKey} type="button" className={tileClass('answer', card)} disabled={matched.includes(card.contentKey)}
              aria-pressed={picked?.side === 'answer' && picked.key === card.contentKey} onClick={() => choose('answer', card)}>
              {card.answer}
            </button>
          ))}
        </div>
      </div>
      <p className="tiny muted center mt-2.5">Chạm một thẻ bên trái rồi chạm nghĩa của nó bên phải.</p>
    </div>
  );
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
