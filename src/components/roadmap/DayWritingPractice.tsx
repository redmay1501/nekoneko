'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StrokeOrder } from '@/components/learning/StrokeOrder';

export interface DayWritingCharacter {
  character: string;
  /** Trang luyện viết của chữ này (Hiragana / Katakana / Kanji). */
  writingHref: string;
}

/**
 * "Cách viết" trên trang ngày của lộ trình: chọn một chữ của ngày → xem thứ tự nét ngay tại đó,
 * muốn tập viết tay thì sang khung luyện viết của đúng chữ đó.
 */
export function DayWritingPractice({ characters }: { characters: DayWritingCharacter[] }) {
  const [selected, setSelected] = useState(characters[0]);
  if (!selected) return null;
  return (
    <section className="card tight mt-3 day-writing" aria-label="Cách viết">
      <b className="sm">✍️ Cách viết</b>
      <div className="writing-picker mt-2.5" role="radiogroup" aria-label="Chọn chữ để xem cách viết">
        {characters.map((entry) => (
          <button key={entry.character} type="button" role="radio" aria-checked={entry.character === selected.character}
            className={`chip jp glyph ${entry.character === selected.character ? 'pink' : ''}`} onClick={() => setSelected(entry)}>
            {entry.character}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <StrokeOrder key={selected.character} character={selected.character} size={180} />
      </div>
      <p className="center mt-2"><Link className="btn ghost sm" href={selected.writingHref}>Tập viết chữ {selected.character}</Link></p>
    </section>
  );
}
