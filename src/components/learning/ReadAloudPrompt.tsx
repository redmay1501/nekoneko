'use client';

import { AudioButton } from '@/components/common/AudioButton';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { FAILURE_MESSAGES, type ReadAloudResult, toReadAloudResult } from '@/features/speech/read-aloud-status';
import { fitTextStyle } from '@/lib/utils/fit-text';

interface ReadAloudPromptProps {
  lessonLabel: string;
  sentenceJp: string;
  /** Cách đọc bằng kana (có thể rỗng). */
  reading: string;
  meaningVi: string;
  chipClass: string;
}

/**
 * Đọc theo câu mẫu: nghe mẫu → bấm "Bắt đầu nói" → trình duyệt nhận diện → so chữ nhận diện với câu mẫu.
 * CHỈ so khớp chữ: không có điểm phát âm, không nói "phát âm chuẩn"; không ghi trí nhớ / tiến độ.
 */
export function ReadAloudPrompt({ lessonLabel, sentenceJp, reading, meaningVi, chipClass }: ReadAloudPromptProps) {
  const { isSupported, phase, interim, outcome, start, stop, reset } = useSpeechRecognition();
  const result = outcome ? toReadAloudResult(outcome, [sentenceJp, reading]) : null;
  const isListening = phase === 'listening';

  return (
    <div className="card mb-3 read-aloud">
      <span className={`chip ${chipClass}`}>{lessonLabel}</span>
      <p className="sm soft" style={{ margin: '10px 0 4px' }}>Đọc to câu này:</p>
      <div className="fit-box"><p className="jp fit-text read-aloud-sentence" style={fitTextStyle(sentenceJp, 22, 16)}>{sentenceJp}</p></div>
      {reading && reading !== sentenceJp ? <p className="jp sm soft">{reading}</p> : null}
      <p className="sm mt-1">{meaningVi}</p>

      <div className="row wrap mt-3" style={{ gap: 8, alignItems: 'center' }}>
        <AudioButton text={sentenceJp} label="Nghe mẫu" className="btn ghost sm" showText />
        {isSupported === false ? null : isListening ? (
          <button type="button" className="btn sm read-aloud-mic is-listening" onClick={stop} aria-live="polite">⏹ Dừng</button>
        ) : (
          <button type="button" className="btn sm read-aloud-mic" onClick={start} disabled={isSupported === null}>
            🎙️ {result ? 'Đọc lại' : 'Bắt đầu nói'}
          </button>
        )}
        {result && !isListening ? <button type="button" className="btn quiet sm" onClick={reset}>Xoá kết quả</button> : null}
      </div>

      {isSupported === false && !result ? (
        <p className="read-aloud-note mt-2.5" role="status">{FAILURE_MESSAGES['no-api']}</p>
      ) : null}

      {isListening ? (
        <div className="read-aloud-box mt-2.5" role="status" aria-live="polite">
          <span className="read-aloud-dot" aria-hidden="true" /> Đang nghe… hãy đọc câu trên.
          {interim ? <p className="jp mt-1">{interim}</p> : null}
        </div>
      ) : null}

      {result && !isListening ? <ResultView result={result} /> : null}
    </div>
  );
}

function ResultView({ result }: { result: ReadAloudResult }) {
  if (result.status !== 'matched' && result.status !== 'different') {
    return (
      <div className={`read-aloud-box mt-2.5 is-${result.status}`} role="status">
        <b className="sm">{TITLES[result.status]}</b>
        {result.reason ? <p className="sm mt-1">{FAILURE_MESSAGES[result.reason]}</p> : null}
      </div>
    );
  }
  const comparison = result.comparison!;
  return (
    <div className={`read-aloud-box mt-2.5 is-${result.status}`} role="status">
      <b className="sm">{TITLES[result.status]}</b>
      <p className="sm mt-1">Trình duyệt nghe được: <span className="jp">{result.transcript}</span></p>
      {result.status === 'different' ? (
        <>
          <p className="tiny muted mt-2">So với câu mẫu (đã bỏ dấu câu, khoảng trắng; Katakana đổi sang Hiragana):</p>
          <p className="jp read-aloud-diff">
            {comparison.segments.map((segment, index) => (
              <span key={index} className={`diff-${segment.kind}`} title={segment.kind === 'missing' ? 'Có trong câu mẫu, không nghe thấy' : segment.kind === 'extra' ? 'Nghe thấy thêm' : undefined}>
                {segment.text}
              </span>
            ))}
          </p>
          <p className="tiny muted"><span className="diff-missing">gạch chân đỏ</span> = có trong câu mẫu nhưng không nghe thấy · <span className="diff-extra">nền vàng</span> = nghe thấy thêm</p>
          {comparison.mayBeScriptDifference ? (
            <p className="tiny mt-1">Phần khác có chữ Hán — có thể trình duyệt chỉ viết khác (Kanji ↔ kana), không hẳn là bạn đọc khác.</p>
          ) : null}
        </>
      ) : null}
      <p className="tiny muted mt-2">Đây chỉ là so khớp chữ trình duyệt nhận ra — chưa phải chấm phát âm. Nghe lại mẫu và tự so cách đọc của mình.</p>
    </div>
  );
}

const TITLES: Record<ReadAloudResult['status'], string> = {
  matched: '✓ Trình duyệt nhận ra đúng câu mẫu',
  different: 'Trình duyệt nhận ra câu khác câu mẫu',
  not_recognized: 'Chưa nhận ra câu nào',
  unsupported: 'Trình duyệt chưa hỗ trợ',
  permission_denied: 'Chưa có quyền dùng micro',
  error: 'Chưa nhận diện được',
};
