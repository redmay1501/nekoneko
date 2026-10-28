'use client';

import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { AnimatedEmoji, EmojiIcon } from '@/components/common/EmojiIcon';
import { LottieAnimation } from '@/components/common/LottieAnimation';
import { NekoButton } from '@/components/common/NekoButton';
import { postJson } from '@/lib/api/api-client';
import { GAMES_HOME } from '@/features/games/game-catalog';
import {
  MIN_STREAK_QUESTIONS, type StreakItem, type StreakQuestion, type StreakState,
  applyStreakAnswer, buildStreakDeck, initialStreakState, streakMilestone,
} from '@/features/games/neko-streak';

interface NekoStreakProps {
  items: StreakItem[];
  initialBest: number;
  journeyDay: number;
  /** Khoá sessionStorage của phiên (theo tài khoản + ngày đang học). */
  sessionKey: string;
}

interface SavedSession { streak: number; answered: number; correct: number; used: string[]; savedAt: number }
/** Phiên bỏ dở quá lâu thì không khôi phục (bắt đầu chuỗi mới). */
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

function readSession(key: string): SavedSession | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') as SavedSession | null;
    if (!saved || Date.now() - saved.savedAt > SESSION_TTL_MS || !Array.isArray(saved.used)) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSession(key: string, session: SavedSession | null) {
  try {
    if (session) sessionStorage.setItem(key, JSON.stringify(session));
    else sessionStorage.removeItem(key);
  } catch { /* chế độ riêng tư — chỉ giữ trong trang */ }
}

type Phase = 'intro' | 'play' | 'exhausted';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** "Tự chuyển câu" — BẬT mặc định; người học tắt thì nhớ trên máy này (localStorage). */
const AUTO_NEXT_KEY = 'neko-streak-auto-next';
/** Trả lời ĐÚNG: thấy kết quả bấy nhiêu rồi tự sang câu. Trả lời SAI: không tự chuyển — người học đọc giải thích, tự bấm. */
const AUTO_NEXT_AFTER_CORRECT_MS = 1500;

function readAutoNext(): boolean {
  try { return localStorage.getItem(AUTO_NEXT_KEY) !== '0'; } catch { return true; }
}

/** Cấp "ngọn lửa" theo độ dài chuỗi — chỉ đổi màu / nhãn để khích lệ, không đổi luật chơi. */
const TIERS = [
  { id: 'cold', from: 0, label: 'Khởi động' }, { id: 'warm', from: 1, label: 'Ấm máy' }, { id: 'hot', from: 5, label: 'Vào guồng' },
  { id: 'blaze', from: 10, label: 'Bùng cháy' }, { id: 'super', from: 20, label: 'Siêu trí nhớ' }, { id: 'legend', from: 50, label: 'Huyền thoại' },
] as const;
const tierOf = (streak: number) => [...TIERS].reverse().find((tier) => streak >= tier.from)!;

const TYPE_CLASS: Record<string, string> = { Hiragana: 'kana', Katakana: 'kana', 'Bộ thủ': 'radical', Kanji: 'kanji', 'Từ vựng': 'vocab', 'Ngữ pháp': 'grammar' };
const typeOfLabel = (label: string) => TYPE_CLASS[label] ?? 'vocab';

/** Mưa cánh hoa ngắn khi lập kỷ lục mới (CSS, ~1 s, không chặn bấm). */
function StreakConfetti() {
  return (
    <span className="streak-confetti" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}
    </span>
  );
}
type Feedback = { chosen: string; isCorrect: boolean; isNewBest: boolean; milestone: string | null } | null;

/**
 * Neko Streak — trắc nghiệm 4 đáp án liên tục: đúng → chuỗi +1 (không giới hạn), sai → chuỗi về 0, kỷ lục giữ nguyên.
 * Kỷ lục lưu server (giá trị lớn nhất, gửi tuần tự — không bao giờ lùi); chuỗi đang chạy lưu sessionStorage để tải lại vẫn chơi tiếp.
 * Không phát âm thanh tự động; không đổi trí nhớ / tiến độ.
 */
export function NekoStreak({ items, initialBest, journeyDay, sessionKey }: NekoStreakProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [restored, setRestored] = useState<SavedSession | null>(null);
  const [state, setState] = useState<StreakState>(() => initialStreakState(initialBest));
  const [deck, setDeck] = useState<StreakQuestion[]>([]);
  const [position, setPosition] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saveError, setSaveError] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const goNextRef = useRef<() => void>(() => {});

  useEffect(() => { setAutoNext(readAutoNext()); }, []);
  function toggleAutoNext() {
    setAutoNext((current) => {
      const next = !current;
      try { localStorage.setItem(AUTO_NEXT_KEY, next ? '1' : '0'); } catch { /* chế độ riêng tư */ }
      return next;
    });
  }
  const usedRef = useRef<Set<string>>(new Set());
  const lockedRef = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  /** Kỷ lục đã lưu server + hàng đợi gửi (một yêu cầu một lúc; luôn gửi giá trị lớn nhất đang chờ). */
  const saved = useRef({ best: initialBest, pending: 0, inFlight: false, sessionCounted: false });

  const totalQuestions = useMemo(() => buildStreakDeck(items, () => 0.5).length, [items]);
  const canPlay = totalQuestions >= MIN_STREAK_QUESTIONS;
  const kindCounts = useMemo(() => {
    const labels: Array<[string, string, string[]]> = [['Chữ cái', 'kana', ['hiragana', 'katakana']], ['Bộ thủ', 'radical', ['radical']], ['Kanji', 'kanji', ['kanji']], ['Từ vựng', 'vocab', ['vocabulary']], ['Ngữ pháp', 'grammar', ['grammar']]];
    return labels.map(([label, type, types]) => ({ label, type, count: items.filter((item) => types.includes(item.type)).length })).filter((kind) => kind.count > 0);
  }, [items]);
  const question = deck[position] ?? null;

  useEffect(() => { setRestored(readSession(sessionKey)); }, [sessionKey]);

  const flushSave = useCallback(() => {
    const store = saved.current;
    if (store.inFlight || store.pending <= store.best) return;
    const value = store.pending;
    const newSession = !store.sessionCounted;
    store.inFlight = true;
    store.sessionCounted = true;
    postJson<{ best: number }>('/api/games/streak', { streak: value, newSession })
      .then((result) => {
        store.inFlight = false;
        store.best = Math.max(store.best, result.best);
        setSaveError(false);
        if (store.pending > store.best) flushSave(); // trong lúc gửi chuỗi đã dài thêm → gửi nốt giá trị mới nhất
      })
      // Lỗi mạng: không thử dồn dập — lần trả lời kế tiếp (hoặc lúc rời trang) sẽ gửi lại giá trị lớn nhất.
      .catch(() => { store.inFlight = false; setSaveError(true); if (newSession) store.sessionCounted = false; });
  }, []);

  const queueSave = useCallback((best: number) => {
    saved.current.pending = Math.max(saved.current.pending, best);
    flushSave();
  }, [flushSave]);

  // Rời trang khi còn kỷ lục chưa gửi → gửi nốt (postJson dùng keepalive).
  useEffect(() => {
    const onHide = () => { if (saved.current.pending > saved.current.best) { saved.current.inFlight = false; flushSave(); } };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flushSave]);

  function dealDeck(resetUsed: boolean) {
    if (resetUsed) usedRef.current = new Set();
    const next = buildStreakDeck(items, Math.random, usedRef.current);
    setDeck(next);
    setPosition(0);
    setFeedback(null);
    lockedRef.current = false;
    setPhase(next.length ? 'play' : 'exhausted');
  }

  function start(resume: boolean) {
    const session = resume ? restored : null;
    usedRef.current = new Set(session?.used ?? []);
    setState(initialStreakState(Math.max(initialBest, saved.current.best), session));
    if (!resume) writeSession(sessionKey, null);
    setRestored(null);
    dealDeck(false);
  }

  function choose(option: string) {
    if (!question || lockedRef.current) return; // khoá: một câu chỉ ghi nhận một lần
    lockedRef.current = true;
    const isCorrect = option === question.answer;
    usedRef.current.add(question.id);
    const next = applyStreakAnswer(state, isCorrect);
    setState(next);
    // "KỶ LỤC MỚI!" đúng một lần: câu làm chuỗi VƯỢT qua kỷ lục đang có (các câu sau chỉ cập nhật số lặng lẽ).
    const crossedRecord = next.isNewBest && state.best > 0 && state.streak === state.best;
    setFeedback({ chosen: option, isCorrect, isNewBest: crossedRecord, milestone: isCorrect ? streakMilestone(next.streak) : null });
    if (next.best > saved.current.best) queueSave(next.best);
    writeSession(sessionKey, { streak: next.streak, answered: next.answered, correct: next.correct, used: [...usedRef.current], savedAt: Date.now() });

    // Sau khi chọn: cuộn mượt tới vùng phản hồi để nút "Câu tiếp" nằm trong tầm tay (nhất là điện thoại), rồi focus nút.
    window.requestAnimationFrame(() => {
      const next = nextRef.current;
      if (!next) return;
      next.scrollIntoView({ block: 'end', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      next.focus({ preventScroll: true });
    });
  }

  goNextRef.current = goNext;
  function goNext() {
    if (!feedback) return;
    if (position + 1 < deck.length) {
      setPosition(position + 1);
      setFeedback(null);
      lockedRef.current = false;
      // Câu mới: đưa bảng điểm + câu hỏi trở lại tầm nhìn (nếu đang cuộn xuống dưới).
      window.requestAnimationFrame(() => boardRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
      return;
    }
    // Hết bộ câu: còn câu chưa hỏi trong phiên thì chia tiếp, hết hẳn thì báo và cho xáo lại.
    dealDeck(false);
  }

  // Tự chuyển câu (chỉ khi trả lời ĐÚNG): ~1,5 giây sau sang câu tiếp. Sai → đứng lại cho người học đọc giải thích và tự bấm.
  // Bấm "Câu tiếp" / tắt công tắc → huỷ.
  useEffect(() => {
    if (!feedback?.isCorrect || !autoNext || phase !== 'play') return;
    const pause = AUTO_NEXT_AFTER_CORRECT_MS + (feedback.isNewBest || feedback.milestone ? 500 : 0);
    const timer = window.setTimeout(() => goNextRef.current(), pause);
    return () => window.clearTimeout(timer);
  }, [feedback, autoNext, phase]);

  // Phím tắt: 1–4 chọn đáp án, Enter / Space sang câu tiếp.
  useEffect(() => {
    if (phase !== 'play') return;
    function onKey(event: KeyboardEvent) {
      if ((event.target as HTMLElement | null)?.closest('input, textarea')) return;
      if (!feedback && question && /^[1-4]$/.test(event.key)) { event.preventDefault(); choose(question.options[Number(event.key) - 1]); }
      else if (feedback && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); goNext(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const autoToggle = (
    <button type="button" className={`streak-auto${autoNext ? ' is-on' : ''}`} role="switch" aria-checked={autoNext} onClick={toggleAutoNext}
      title="Trả lời đúng: tự sang câu tiếp sau 1,5 giây · trả lời sai: dừng lại để bạn xem giải thích">
      <span className="streak-auto-knob" aria-hidden="true" /> ⏩ Tự chuyển câu
    </button>
  );
  const header = (
    <div className="between mb-2.5 streak-header">
      <Link className="link sm" href={GAMES_HOME}>← Trò chơi</Link>
      <span className="streak-scope-chip">📚 Đã học · ngày 1–{journeyDay}</span>
    </div>
  );

  if (!canPlay) {
    return (
      <section className="streak-game">
        {header}
        <div className="card streak-hero">
          <LottieAnimation src="/animations/lurking-cat.json" className="streak-mascot" stillFrame={20} />
          <p className="streak-kicker">Neko Streak</p>
          <h1>Mèo cần thêm kiến thức!</h1>
          <p className="soft">Hiện mới có {totalQuestions} câu hợp lệ — cần ít nhất {MIN_STREAK_QUESTIONS} câu để chơi.</p>
          <p className="sm soft">Học thêm trong Lộ trình rồi quay lại nhé — chỉ kiến thức đã học mới vào game.</p>
          <div className="mt-3"><NekoButton href="/lo-trinh" variant="primary">Đến Lộ trình</NekoButton></div>
        </div>
      </section>
    );
  }

  if (phase === 'intro') {
    const best = Math.max(initialBest, saved.current.best);
    return (
      <section className="streak-game">
        {header}
        <div className="card streak-hero">
          <span className="streak-hero-paws" aria-hidden="true" />
          <LottieAnimation src="/animations/dance-cat.json" className="streak-mascot is-big" />
          <p className="streak-kicker">Neko Streak</p>
          <h1>Mèo nhớ siêu đỉnh! <span aria-hidden="true">🐾</span></h1>
          <p className="streak-lead">Bạn có thể trả lời đúng liên tiếp bao nhiêu câu?</p>
          <div className="streak-intro-stats">
            <span className="is-record"><EmojiIcon emoji="🏆" size={34} /><span><small>Kỷ lục của bạn</small><b>{best}</b></span></span>
            <span><EmojiIcon emoji="📚" size={34} /><span><small>Câu trong phạm vi</small><b>{totalQuestions}</b></span></span>
          </div>
          <div className="streak-kinds" aria-label="Kiến thức trong game">
            {kindCounts.map((kind) => <span key={kind.label} className={`streak-kind is-${kind.type}`}>{kind.label} · {kind.count}</span>)}
          </div>
          <ol className="streak-steps">
            <li><EmojiIcon emoji="🎯" size={26} /><span><b>Chọn 1 trong 4</b> đáp án</span></li>
            <li><EmojiIcon emoji="🔥" size={26} /><span><b>Đúng liên tiếp</b> để giữ lửa</span></li>
            <li><EmojiIcon emoji="🏆" size={26} /><span><b>Phá kỷ lục</b> của chính mình</span></li>
          </ol>
          <div className="mt-3">{autoToggle}</div>
          {restored && restored.streak > 0 ? (
            <div className="stack mt-3 streak-cta" style={{ gap: 8 }}>
              <NekoButton variant="game" catPose="none" onClick={() => start(true)}>🔥 Chơi tiếp chuỗi {restored.streak}</NekoButton>
              <button type="button" className="btn ghost sm" onClick={() => start(false)}>Bắt đầu chuỗi mới</button>
            </div>
          ) : (
            <div className="mt-3 streak-cta"><NekoButton variant="game" catPose="none" onClick={() => start(false)}>▶ Bắt đầu chơi</NekoButton></div>
          )}
          <p className="tiny muted mt-2.5">Sai một câu thì chuỗi về 0 — kỷ lục vẫn giữ. Không giới hạn số câu. Chơi không đổi điểm trí nhớ hay lộ trình.</p>
        </div>
      </section>
    );
  }

  if (phase === 'exhausted' || !question) {
    return (
      <section className="streak-game">
        {header}
        <div className="card streak-hero" role="status">
          <AnimatedEmoji name="party-popper" size={64} />
          <h2>Bạn đã ôn hết {totalQuestions} câu trong phạm vi!</h2>
          <p className="soft">Chuỗi hiện tại <b>{state.streak}</b> · kỷ lục <b>{state.best}</b>. Chơi tiếp với câu được xáo lại — chuỗi vẫn giữ nguyên.</p>
          <div className="mt-3 streak-cta"><NekoButton variant="game" catPose="none" onClick={() => dealDeck(true)}>↻ Xáo lại và chơi tiếp</NekoButton></div>
          <p className="tiny muted mt-2">Học thêm ngày mới trong Lộ trình là có thêm câu hỏi mới.</p>
        </div>
      </section>
    );
  }

  const tier = tierOf(state.streak);
  const toBest = state.best > 0 ? Math.min(1, state.streak / state.best) : 0;
  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : null;
  const isAboveOldBest = state.streak > initialBest && initialBest > 0;
  return (
    <section className={`streak-game tier-${tier.id}`} aria-label="Neko Streak — đang chơi">
      {header}
      <div ref={boardRef} className="streak-board card">
        <div className="streak-scores">
          <div className={`streak-flame${feedback?.isCorrect ? ' is-up' : ''}${feedback && !feedback.isCorrect ? ' is-reset' : ''}`} aria-live="polite">
            <EmojiIcon emoji="🔥" size={30} className="streak-flame-icon" />
            <b key={state.streak}>{state.streak}</b>
            <small>chuỗi đúng</small>
          </div>
          <div className="streak-side">
            <span className="streak-tier">{tier.label}</span>
            <span className="streak-best-chip"><EmojiIcon emoji="🏆" size={20} /> Kỷ lục <b>{state.best}</b></span>
            <span className="tiny muted">{state.answered} câu{accuracy !== null ? ` · đúng ${accuracy}%` : ''}</span>
          </div>
        </div>
        <div className="streak-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${toBest})` }} />
          <span className="streak-progress-paw" style={{ left: `clamp(9px, ${toBest * 100}%, calc(100% - 9px))` }}>🐾</span>
        </div>
        <p className="tiny streak-progress-label">
          {state.best === 0 ? 'Trả lời đúng câu đầu tiên để có kỷ lục!' : state.streak >= state.best ? (isAboveOldBest ? `Đang vượt kỷ lục cũ +${state.streak - initialBest} — cứ thế!` : 'Bằng kỷ lục — thêm một câu là phá!') : `Còn ${state.best - state.streak + 1} câu để phá kỷ lục`}
        </p>
      </div>

      <div className="streak-toolbar">{autoToggle}</div>
      <article className="card streak-question" key={question.id}>
        {feedback?.isNewBest ? <StreakConfetti /> : null}
        <p className="streak-prompt"><span className={`streak-kind is-${typeOfLabel(question.typeLabel)}`}>{question.typeLabel}</span> {question.prompt}</p>
        <div className="streak-face">
          <span className={question.faceIsJapanese ? 'jp' : ''} lang={question.faceIsJapanese ? 'ja' : 'vi'}>{question.face}</span>
          {question.faceIsJapanese && question.audioText ? <AudioButton text={question.audioText} /> : null}
        </div>
        <div className="streak-options" role="group" aria-label="Bốn đáp án">
          {question.options.map((option, index) => {
            const look = !feedback ? '' : option === question.answer ? ' is-answer' : option === feedback.chosen ? ' is-wrong' : ' is-dim';
            return (
              <button key={option} type="button" className={`streak-option key-${index + 1}${look}${question.optionsAreJapanese ? ' jp' : ''}`}
                lang={question.optionsAreJapanese ? 'ja' : 'vi'} disabled={Boolean(feedback)} onClick={() => choose(option)}>
                <span className="streak-option-key" aria-hidden="true">{index + 1}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
        <div className="streak-feedback" aria-live="polite">
          {feedback ? (
            <>
              {feedback.isNewBest ? <p className="streak-record"><AnimatedEmoji name="party-popper" size={28} /> KỶ LỤC MỚI! Bạn đã vượt qua chính mình!</p> : null}
              {feedback.isCorrect
                ? <p className="streak-ok"><EmojiIcon emoji="✨" size={22} /> <b>Chính xác!</b>{feedback.milestone ? <span> {feedback.milestone}</span> : null}</p>
                : (
                  <div className="streak-miss">
                    <p><b>Tiếc quá!</b> Chuỗi về 0 — kỷ lục <b>{state.best}</b> vẫn còn đó.</p>
                    <p className="streak-explain"><EmojiIcon emoji="💡" size={18} /> <span>{question.explanation}</span></p>
                  </div>
                )}
              <button ref={nextRef} type="button" className={`btn block mt-2 streak-next${autoNext && feedback.isCorrect ? ' is-auto' : ''}`} onClick={goNext}>
                {autoNext && feedback.isCorrect ? 'Tự chuyển… · bấm để sang ngay →' : 'Câu tiếp →'}
              </button>
            </>
          ) : <p className="tiny muted center streak-hint">Chọn một đáp án · phím 1–4 · Enter để sang câu</p>}
        </div>
        {saveError ? <p className="tiny muted mt-1" role="alert">Chưa lưu được kỷ lục — mạng chập chờn, Neko sẽ thử lại.</p> : null}
      </article>
    </section>
  );
}
