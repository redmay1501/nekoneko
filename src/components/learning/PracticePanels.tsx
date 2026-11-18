'use client';

import { useEffect, useState } from 'react';
import { resolveQuestionCount } from '@/features/learning/question-count';
import { QuestionCountPicker } from './QuestionCountPicker';
import type { DictationPools, ListeningPools } from '@/features/learning/skill-practice';
import { DictationPractice } from './DictationPractice';
import { ListeningQuiz } from './ListeningQuiz';
import { RangePicker } from './RangePicker';

/** Số câu mặc định khi người học chưa chọn lần nào (chọn rồi thì nhớ trên máy này). */
const DEFAULT_QUESTION_COUNT = 10;
const LISTENING_DISTRACTORS = 3;
const LISTENING_COUNT_KEY = 'neko-listening-count';
const DICTATION_COUNT_KEY = 'neko-dictation-count';

function readCount(key: string): number | null {
  try { const value = Number(localStorage.getItem(key)); return Number.isFinite(value) && localStorage.getItem(key) !== null ? value : null; } catch { return null; }
}
function saveCount(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* chế độ riêng tư */ }
}

function sample<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy.slice(0, count);
}

const groupOf = (index: number) => (index < 2 ? 'Gợi ý' : 'Theo bài');

/**
 * Luyện nghe từ vựng — đổi phạm vi / "Bài khác" ngay trong trình duyệt (kho mọi phạm vi có sẵn, không chuyển trang).
 * Phương án nhiễu lấy trong cùng phạm vi; phạm vi quá nhỏ thì mượn cả kho.
 */
export function ListeningPanel({ pools, initialRange }: { pools: ListeningPools; initialRange?: string }) {
  const startRange = pools.ranges.some((range) => range.id === initialRange) ? initialRange! : pools.defaultRange;
  const [rangeId, setRangeId] = useState(startRange);
  const [round, setRound] = useState(0);
  const range = pools.ranges.find((candidate) => candidate.id === rangeId) ?? pools.ranges[0];
  // Bộ câu đổi khi đổi phạm vi / bấm "Bài khác"; tạo ở trình duyệt sau khi người học bấm (không lệch với server).
  const [count, setCount] = useState(DEFAULT_QUESTION_COUNT);
  const [questions, setQuestions] = useState(() => buildQuestions(pools, range.keys, `${rangeId}:0`, DEFAULT_QUESTION_COUNT));
  // Số câu đã chọn lần trước (trên máy này) — đọc sau khi gắn vào trang để HTML server và trình duyệt khớp nhau.
  useEffect(() => {
    const saved = readCount(LISTENING_COUNT_KEY);
    if (saved === null || saved === DEFAULT_QUESTION_COUNT) return;
    setCount(saved);
    setQuestions(buildQuestions(pools, range.keys, `${rangeId}:0`, saved));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ lần đầu

  function deal(id: string, nextRound: number, nextCount = count) {
    const target = pools.ranges.find((candidate) => candidate.id === id) ?? pools.ranges[0];
    setRangeId(id);
    setRound(nextRound);
    setQuestions(buildQuestions(pools, target.keys, `${id}:${nextRound}`, nextCount, true));
  }
  function chooseCount(value: number) {
    setCount(value);
    saveCount(LISTENING_COUNT_KEY, value);
    deal(rangeId, round + 1, value);
  }

  return (
    <>
      <RangePicker title="Phạm vi" current={rangeId} onSelect={(id) => deal(id, 0)}
        options={pools.ranges.map((option, index) => ({ id: option.id, label: option.label, caption: `${option.keys.length} từ`, group: option.group ?? groupOf(index) }))} />
      <QuestionCountPicker available={range.keys.length} value={count} onChange={chooseCount} unit="từ" />
      <ListeningQuiz key={`${rangeId}:${round}`} title="Nghe và chọn nghĩa" description="Nghe từng từ, chọn nghĩa rồi bấm câu tiếp theo. Cuối bài có kết quả và nút làm lại."
        questions={questions} emptyMessage="Phần này chưa có từ để nghe — chọn “Tất cả” hoặc một bài nhé." />
      <p className="center mt-2.5"><button type="button" className="btn ghost sm" onClick={() => deal(rangeId, round + 1)}>↻ Bài khác</button></p>
    </>
  );
}

/** Lần đầu (dựng ở server) lấy theo thứ tự cố định để HTML server và trình duyệt khớp nhau; các lần sau mới ngẫu nhiên. */
export function buildQuestions(pools: ListeningPools, keys: readonly string[], seed: string, count: number, isRandom = false) {
  // Mỗi từ tối đa một câu — chọn nhiều hơn số từ của phạm vi thì làm hết phạm vi, không lặp lại từ.
  const total = resolveQuestionCount(count, keys.length);
  const pick = isRandom ? sample(keys, total) : keys.slice(0, total);
  const distractorPool = keys.length > LISTENING_DISTRACTORS * 2 ? keys : Object.keys(pools.words);
  return pick.map((key, index) => {
    const word = pools.words[key];
    const others = distractorPool.filter((other) => other !== key && pools.words[other].meaning !== word.meaning);
    const distractors = isRandom ? sample(others, LISTENING_DISTRACTORS) : others.slice(index, index + LISTENING_DISTRACTORS);
    const options = [word.meaning, ...distractors.map((other) => pools.words[other].meaning)];
    return { contentKey: key, audioText: word.audioText, answer: word.meaning, reveal: { face: word.face, reading: word.reading }, options: isRandom ? sample(options, options.length) : rotate(options, seed.length + index) };
  });
}

function rotate<T>(items: T[], by: number): T[] {
  const shift = by % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

/** Nghe – gõ — đổi phạm vi / "Bài khác" ngay trong trình duyệt. */
export function DictationPanel({ pools, initialRange }: { pools: DictationPools; initialRange?: string }) {
  const startRange = pools.ranges.some((range) => range.id === initialRange) ? initialRange! : pools.defaultRange;
  const [rangeId, setRangeId] = useState(startRange);
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(DEFAULT_QUESTION_COUNT);
  const [picked, setPicked] = useState(() => pickDictation(pools, startRange, DEFAULT_QUESTION_COUNT, false));
  const range = pools.ranges.find((candidate) => candidate.id === rangeId) ?? pools.ranges[0];
  useEffect(() => {
    const saved = readCount(DICTATION_COUNT_KEY);
    if (saved === null || saved === DEFAULT_QUESTION_COUNT) return;
    setCount(saved);
    setPicked(pickDictation(pools, startRange, saved, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ lần đầu

  function deal(id: string, nextRound: number, nextCount = count) {
    setRangeId(id);
    setRound(nextRound);
    setPicked(pickDictation(pools, id, nextCount, true));
  }
  function chooseCount(value: number) {
    setCount(value);
    saveCount(DICTATION_COUNT_KEY, value);
    deal(rangeId, round + 1, value);
  }

  return (
    <>
      <RangePicker title="Phạm vi" current={rangeId} onSelect={(id) => deal(id, 0)}
        options={pools.ranges.map((option, index) => ({ id: option.id, label: option.label, caption: `${option.wordKeys.length} từ · ${option.sentenceIds.length} câu`, group: groupOf(index) }))} />
      <QuestionCountPicker available={Math.max(range.wordKeys.length, range.sentenceIds.length)} value={count} onChange={chooseCount}
        availableLabel={`có ${range.wordKeys.length} từ (gõ từ) · ${range.sentenceIds.length} câu (gõ câu) khả dụng`} />
      <DictationPractice key={`${rangeId}:${round}`} words={picked.words} sentences={picked.sentences} />
      <p className="center mt-2.5"><button type="button" className="btn ghost sm" onClick={() => deal(rangeId, round + 1)}>↻ Bài khác</button></p>
    </>
  );
}

/** Gõ từ và gõ câu dùng cùng số câu đã chọn, mỗi phần không vượt quá số mục khả dụng của nó (không lặp mục). */
export function pickDictation(pools: DictationPools, rangeId: string, count: number, isRandom: boolean) {
  const range = pools.ranges.find((candidate) => candidate.id === rangeId) ?? pools.ranges[0];
  const choose = <T,>(items: readonly T[]) => {
    const total = resolveQuestionCount(count, items.length);
    return isRandom ? sample(items, total) : items.slice(0, total);
  };
  return {
    words: choose(range.wordKeys).map((key) => pools.words[key]),
    sentences: choose(range.sentenceIds).map((id) => pools.sentences[id]),
  };
}
