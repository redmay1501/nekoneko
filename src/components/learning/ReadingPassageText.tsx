'use client';

import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import type { ReadingGlossaryEntry } from '@/types/content';

/**
 * Đoạn văn bài đọc: chữ gốc (font gothic dễ nhận mặt chữ), công tắc "Xem cách đọc" (bản kana cả đoạn) và
 * "Từ cần chú ý" — từ của bài Minna sau, có cách đọc + nghĩa — để không bắt người học đoán từ chưa được giới thiệu.
 */
export function ReadingPassageText({ textJp, textKana, glossary = [] }: { textJp: string; textKana?: string; glossary?: ReadingGlossaryEntry[] }) {
  const [showKana, setShowKana] = useState(false);
  return (
    <div className="card mt-3" style={{ background: '#FFFDF8' }}>
      <p className="reading-text" lang="ja">{textJp}</p>
      {textKana && showKana ? <p className="reading-text reading-kana mt-2" lang="ja" aria-label="Cách đọc">{textKana}</p> : null}
      <div className="row wrap mt-3" style={{ gap: 8, alignItems: 'center' }}>
        <AudioButton text={textJp} label="Nghe cả đoạn" className="btn ghost sm" showText />
        {textKana ? (
          <button type="button" className={`chip ${showKana ? 'pink' : ''}`} aria-pressed={showKana} onClick={() => setShowKana((value) => !value)}>
            {showKana ? 'Ẩn cách đọc' : 'Xem cách đọc (kana)'}
          </button>
        ) : null}
      </div>
      {glossary.length ? (
        <div className="reading-glossary mt-3">
          <p className="tiny muted">📌 Từ cần chú ý — chưa học tới, có cách đọc và nghĩa để bạn đọc hiểu</p>
          <ul className="mt-1">
            {glossary.map((entry) => (
              <li key={entry.word} className="sm">
                <b className="jp">{entry.word}</b>{entry.reading !== entry.word ? <span className="jp soft">（{entry.reading}）</span> : null}
                {' '}= {entry.meaning} <span className="chip tiny">{entry.lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
