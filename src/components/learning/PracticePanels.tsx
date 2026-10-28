'use client';

import { useState } from 'react';
import type { DictationPools, ListeningPools } from '@/features/learning/skill-practice';
import { DictationPractice } from './DictationPractice';
import { ListeningQuiz } from './ListeningQuiz';
import { RangePicker } from './RangePicker';

const LISTENING_QUESTIONS = 8;
const LISTENING_DISTRACTORS = 3;
const DICTATION_WORDS = 8;
const DICTATION_SENTENCES = 4;

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
  const [questions, setQuestions] = useState(() => buildQuestions(pools, range.keys, `${rangeId}:0`));

  function deal(id: string, nextRound: number) {
    const target = pools.ranges.find((candidate) => candidate.id === id) ?? pools.ranges[0];
    setRangeId(id);
    setRound(nextRound);
    setQuestions(buildQuestions(pools, target.keys, `${id}:${nextRound}`, true));
  }

  return (
    <>
      <RangePicker title="Phạm vi" current={rangeId} onSelect={(id) => deal(id, 0)}
        options={pools.ranges.map((option, index) => ({ id: option.id, label: option.label, caption: `${option.keys.length} từ`, group: option.group ?? groupOf(index) }))} />
      <ListeningQuiz key={`${rangeId}:${round}`} title="Nghe và chọn nghĩa" description="Nghe từng từ, chọn nghĩa rồi bấm câu tiếp theo. Cuối bài có kết quả và nút làm lại."
        questions={questions} emptyMessage="Phần này chưa có từ để nghe — chọn “Tất cả” hoặc một bài nhé." />
      <p className="center mt-2.5"><button type="button" className="btn ghost sm" onClick={() => deal(rangeId, round + 1)}>↻ Bài khác</button></p>
    </>
  );
}

/** Lần đầu (dựng ở server) lấy theo thứ tự cố định để HTML server và trình duyệt khớp nhau; các lần sau mới ngẫu nhiên. */
function buildQuestions(pools: ListeningPools, keys: readonly string[], seed: string, isRandom = false) {
  const pick = isRandom ? sample(keys, LISTENING_QUESTIONS) : keys.slice(0, LISTENING_QUESTIONS);
  const distractorPool = keys.length > LISTENING_DISTRACTORS * 2 ? keys : Object.keys(pools.words);
  return pick.map((key, index) => {
    const word = pools.words[key];
    const others = distractorPool.filter((other) => other !== key && pools.words[other].meaning !== word.meaning);
    const distractors = isRandom ? sample(others, LISTENING_DISTRACTORS) : others.slice(index, index + LISTENING_DISTRACTORS);
    const options = [word.meaning, ...distractors.map((other) => pools.words[other].meaning)];
    return { contentKey: key, audioText: word.audioText, answer: word.meaning, options: isRandom ? sample(options, options.length) : rotate(options, seed.length + index) };
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
  const [picked, setPicked] = useState(() => pickDictation(pools, startRange, false));

  function deal(id: string, nextRound: number) {
    setRangeId(id);
    setRound(nextRound);
    setPicked(pickDictation(pools, id, true));
  }

  return (
    <>
      <RangePicker title="Phạm vi" current={rangeId} onSelect={(id) => deal(id, 0)}
        options={pools.ranges.map((option, index) => ({ id: option.id, label: option.label, caption: `${option.wordKeys.length} từ · ${option.sentenceIds.length} câu`, group: groupOf(index) }))} />
      <DictationPractice key={`${rangeId}:${round}`} words={picked.words} sentences={picked.sentences} />
      <p className="center mt-2.5"><button type="button" className="btn ghost sm" onClick={() => deal(rangeId, round + 1)}>↻ Bài khác</button></p>
    </>
  );
}

function pickDictation(pools: DictationPools, rangeId: string, isRandom: boolean) {
  const range = pools.ranges.find((candidate) => candidate.id === rangeId) ?? pools.ranges[0];
  const choose = <T,>(items: readonly T[], count: number) => (isRandom ? sample(items, count) : items.slice(0, count));
  return {
    words: choose(range.wordKeys, DICTATION_WORDS).map((key) => pools.words[key]),
    sentences: choose(range.sentenceIds, DICTATION_SENTENCES).map((id) => pools.sentences[id]),
  };
}
