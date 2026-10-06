'use client';

import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { VocabularyContent } from '@/types/content';
import { firstMeaning } from '@/lib/utils/text';

/** Desktop mở nghĩa ngay dưới từ; màn hình cảm ứng mở thẻ chi tiết dạng popup. */
export function DayVocabularyList({ words }: { words: VocabularyContent[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="stack mt-2.5" style={{ gap: 6 }}>
      <span className="tiny muted">Từ vựng · bấm để xem cách đọc và nghe phát âm</span>
      {words.map((word) => {
        const contentKey = toContentKey('vocabulary', word.id);
        const face = word.kanji || word.kana;
        const panelId = `day-vocab-${word.id}`;
        return (
          <div key={word.id}>
            <div className="day-vocab-desktop">
              <button type="button" className="list-row" style={{ padding: '9px 12px' }}
                aria-expanded={open === word.id} aria-controls={panelId}
                onClick={() => setOpen((current) => current === word.id ? null : word.id)}>
                <span className="mid">
                  <b className="jp" style={{ fontSize: 15 }}>{face}</b>
                  <span><span className="jp">{word.kana}</span> · {firstMeaning(word.meaning)}</span>
                </span>
                <span className="end"><span className="tiny muted" aria-hidden="true">{open === word.id ? '−' : '+'}</span></span>
              </button>
              {open === word.id ? (
                <div id={panelId} className="day-vocab-details">
                  <div className="day-vocab-details-head">
                    <b className="jp">{face}</b>
                    <span className="day-vocab-read">Cách đọc: {word.kana}</span>
                    <AudioButton text={word.kana} className="btn ghost sm" label="Nghe cách đọc" />
                  </div>
                  <p className="sm mt-1">{word.meaning}</p>
                  {word.tip?.trim() ? <p className="tiny soft mt-1"><b>Mẹo nhớ:</b> {word.tip}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="day-vocab-mobile">
              <KnowledgeChipButton contentKey={contentKey} className="list-row" style={{ padding: '9px 12px' }}>
                <span className="mid">
                  <b className="jp" style={{ fontSize: 15 }}>{face}</b>
                  <span><span className="jp">{word.kana}</span> · {firstMeaning(word.meaning)}</span>
                </span>
                <span className="end"><span className="tiny muted" aria-hidden="true">↗</span></span>
              </KnowledgeChipButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
