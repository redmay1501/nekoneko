'use client';

import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';

interface SpeakingPromptProps {
  lessonLabel: string;
  promptVi: string;
  answerJp: string;
  chipClass: string;
}

/** Một câu luyện nói: đọc nghĩa tiếng Việt, tự nói, rồi mới xem đáp án. */
export function SpeakingPrompt({ lessonLabel, promptVi, answerJp, chipClass }: SpeakingPromptProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <div className="card mb-3">
      <span className={`chip ${chipClass}`}>{lessonLabel}</span>
      <p className="sm soft" style={{ margin: '10px 0 4px' }}>Hãy nói câu này:</p>
      <p style={{ fontSize: 15 }}>{promptVi}</p>
      <div className="between mt-3">
        <AudioButton text={answerJp} label="Nghe mẫu" className="btn ghost sm" />
        {isRevealed ? null : <button type="button" className="btn sm" onClick={() => setIsRevealed(true)}>Xem đáp án</button>}
      </div>
      {isRevealed ? (
        <p className="jp mt-3" style={{ fontSize: 18, padding: 12, background: 'var(--mint)', borderRadius: 14 }}>{answerJp}</p>
      ) : null}
    </div>
  );
}
