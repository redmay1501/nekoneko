'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { AsrError, useOnDeviceAsr } from '@/hooks/useOnDeviceAsr';
import { ASR_FIRST_DOWNLOAD_MB, ASR_MODEL_LABEL, ASR_MODEL_MB } from '@/features/speech/asr-protocol';
import { type AudioCheck, type AudioStats, MAX_RECORDING_SEC, analyzeAudio, checkAudio, moraRate } from '@/features/speech/audio-quality';
import { type TranscriptComparison, compareTranscriptWithDictionary, matchesIgnoringLength } from '@/features/speech/transcript-compare';
import { countMora } from '@/features/speech/audio-quality';
import { ASR_SAMPLE_RATE, type ActiveRecording, decodeToMono16k, recorderFailureOf, startRecording } from '@/lib/speech/recorder';
import { fitTextStyle } from '@/lib/utils/fit-text';

interface OnDeviceReadAloudProps {
  lessonLabel: string;
  sentenceJp: string;
  /** Cách đọc bằng kana (có thể rỗng) — dùng để so chữ và đếm mora. */
  reading: string;
  meaningVi: string;
  chipClass: string;
  kanaDictionary?: ReadonlyArray<readonly [string, string]>;
}

type Failure =
  | 'silent' | 'too_short' | 'too_quiet' | 'too_noisy' | 'too_long' | 'not_recognized'
  | 'permission_denied' | 'no_microphone' | 'unsupported' | 'failed' | 'model_memory' | 'model_network' | 'model_unsupported' | 'model_unknown';

type Phase =
  | { kind: 'idle' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'processing'; step: 'decode' | 'asr' }
  | { kind: 'failure'; reason: Failure }
  | { kind: 'result'; transcript: string; comparison: TranscriptComparison; looseMatch: boolean; stats: AudioStats; check: AudioCheck; rate: number | null; asrMs: number };

const GUIDE_KEY = 'neko-speak-guide-seen';
const JAPANESE = /[぀-ヿ㐀-鿿]/;

const FAILURES: Record<Failure, { title: string; body: string }> = {
  silent: { title: 'Không nghe thấy tiếng', body: 'Bản ghi gần như im lặng. Kiểm tra micro, đưa máy lại gần rồi đọc to hơn một chút.' },
  too_short: { title: 'Bản ghi quá ngắn', body: 'Chỉ nghe được một tiếng rất ngắn. Bấm ghi, đọc trọn câu rồi mới bấm dừng.' },
  too_quiet: { title: 'Tiếng quá nhỏ', body: 'Âm lượng quá nhỏ để nhận diện. Nói to và rõ hơn, hoặc đưa micro lại gần.' },
  too_noisy: { title: 'Xung quanh quá ồn', body: 'Tiếng ồn nền to ngang giọng nói nên không tách được lời. Tìm chỗ yên tĩnh hơn rồi thử lại.' },
  too_long: { title: 'Bản ghi quá dài', body: `Mỗi lần chỉ ghi tối đa ${MAX_RECORDING_SEC} giây. Đọc riêng câu này rồi bấm dừng.` },
  not_recognized: { title: 'Chưa nhận ra lời nào', body: 'Whisper không nhận ra chữ tiếng Nhật nào trong bản ghi. Nghe lại mẫu, đọc chậm và rõ hơn rồi thử lại.' },
  permission_denied: { title: 'Chưa có quyền dùng micro', body: 'Trình duyệt đang chặn micro. Mở cài đặt trang (biểu tượng ổ khoá cạnh địa chỉ) → cho phép Micro, rồi bấm ghi lại.' },
  no_microphone: { title: 'Không tìm thấy micro', body: 'Thiết bị chưa có micro hoặc micro đang bị ứng dụng khác dùng.' },
  unsupported: { title: 'Trình duyệt chưa ghi âm được', body: 'Trình duyệt này không hỗ trợ ghi âm (MediaRecorder). Hãy dùng Chrome, Edge hoặc Safari bản mới; trang phải mở qua https.' },
  failed: { title: 'Chưa ghi âm được', body: 'Có lỗi khi ghi hoặc đọc bản ghi. Thử lại; nếu vẫn lỗi hãy tải lại trang.' },
  model_memory: { title: 'Thiết bị không đủ bộ nhớ', body: 'Mô hình nhận diện cần khoảng 300 MB RAM. Đóng bớt tab / ứng dụng rồi thử lại.' },
  model_network: { title: 'Chưa tải được mô hình', body: `Cần mạng để tải bộ nhận diện (~${ASR_FIRST_DOWNLOAD_MB} MB) lần đầu. Kiểm tra kết nối rồi thử lại — tải xong sẽ được lưu trong trình duyệt.` },
  model_unsupported: { title: 'Trình duyệt chưa hỗ trợ', body: 'Trình duyệt này không chạy được mô hình nhận diện (cần WebAssembly). Hãy dùng Chrome, Edge hoặc Safari bản mới.' },
  model_unknown: { title: 'Nhận diện thất bại', body: 'Mô hình gặp lỗi khi xử lý. Thử lại; nếu vẫn lỗi hãy tải lại trang.' },
};

/**
 * Đọc theo mẫu với AI chạy TRÊN THIẾT BỊ: nghe mẫu → ghi âm → nghe lại → Whisper (trong Web Worker) nhận diện lời → so chữ với
 * câu mẫu + đo âm thanh (thời gian nói, tốc độ mora, âm lượng / ồn / rè). Âm thanh không rời thiết bị, không lưu.
 * KHÔNG chấm phát âm: Whisper chỉ nhận diện nội dung; trường âm / っ / ん / cao độ chưa có phương pháp đáng tin → ghi rõ "chưa hỗ trợ".
 */
export function OnDeviceReadAloud({ lessonLabel, sentenceJp, reading, meaningVi, chipClass, kanaDictionary = [] }: OnDeviceReadAloudProps) {
  const { model, preload, transcribe } = useOnDeviceAsr();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recordingRef = useRef<ActiveRecording | null>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const playerRef = useRef<HTMLAudioElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  // Âm / từ đứng riêng ngắn (≤ 4 mora): Whisper hay thêm / bớt っ, ー — cảnh báo kết quả chỉ để tham khảo.
  const isShort = (countMora(reading || sentenceJp) ?? (reading || sentenceJp).replace(/\s/g, '').length) <= 4;

  useEffect(() => {
    try { setShowGuide(localStorage.getItem(GUIDE_KEY) !== '1'); } catch { setShowGuide(true); }
  }, []);
  // Bản ghi chỉ giữ trong phiên trang: đổi câu / rời trang → huỷ URL, dừng ghi.
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => () => recordingRef.current?.cancel(), []);
  // Có kết quả / báo lỗi → đưa vào tầm nhìn (điện thoại: hộp kết quả thường nằm dưới mép màn hình).
  useEffect(() => {
    if (phase.kind !== 'result' && phase.kind !== 'failure') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    outcomeRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [phase.kind]);

  // Đang ghi: thanh mức âm + đồng hồ (ghi thẳng style, không setState mỗi khung); tự dừng ở MAX_RECORDING_SEC.
  useEffect(() => {
    if (phase.kind !== 'recording') return;
    let frame = 0;
    const tick = () => {
      const level = recordingRef.current?.level() ?? 0;
      if (levelRef.current) levelRef.current.style.transform = `scaleX(${Math.max(0.04, level)})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timer = window.setInterval(() => {
      const seconds = (performance.now() - phase.startedAt) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SEC) void stop();
    }, 200);
    return () => { cancelAnimationFrame(frame); window.clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi đổi pha
  }, [phase]);

  async function start() {
    if (showGuide) { try { localStorage.setItem(GUIDE_KEY, '1'); } catch { /* bỏ qua */ } setShowGuide(false); }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    try {
      recordingRef.current = await startRecording();
    } catch (error) {
      setPhase({ kind: 'failure', reason: recorderFailureOf(error) });
      return;
    }
    preload(); // tải mô hình song song trong lúc người học đọc
    setElapsed(0);
    setPhase({ kind: 'recording', startedAt: performance.now() });
  }

  async function stop() {
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    setPhase({ kind: 'processing', step: 'decode' });
    let samples: Float32Array;
    let blob: Blob | null = null;
    try {
      blob = await recording.stop();
      setAudioUrl(URL.createObjectURL(blob));
      samples = await decodeToMono16k(blob);
    } catch {
      // Không có dữ liệu âm thanh nào (micro im lặng hoàn toàn / bị tắt tiếng) → "không nghe thấy tiếng", không phải lỗi ghi.
      setPhase({ kind: 'failure', reason: blob && blob.size < 2000 ? 'silent' : 'failed' });
      return;
    }
    const stats = analyzeAudio(samples, ASR_SAMPLE_RATE);
    const check = checkAudio(stats);
    // Cổng chất lượng: im lặng / quá ngắn / quá nhỏ / quá ồn → KHÔNG đưa vào Whisper (mô hình hay "bịa" chữ khi không có lời).
    if (check.verdict !== 'ok') { setPhase({ kind: 'failure', reason: check.verdict === 'too_long' ? 'too_long' : check.verdict }); return; }
    setPhase({ kind: 'processing', step: 'asr' });
    try {
      const { text, ms } = await transcribe(samples);
      if (!text || !JAPANESE.test(text)) { setPhase({ kind: 'failure', reason: 'not_recognized' }); return; }
      setPhase({
        kind: 'result', transcript: text, comparison: compareTranscriptWithDictionary(text, [sentenceJp, reading], kanaDictionary),
        looseMatch: matchesIgnoringLength(text, [sentenceJp, reading], kanaDictionary),
        stats, check, rate: moraRate(reading || sentenceJp, stats), asrMs: ms,
      });
    } catch (error) {
      const reason = error instanceof AsrError ? error.reason : 'unknown';
      setPhase({ kind: 'failure', reason: `model_${reason}` as Failure });
    }
  }

  const isRecording = phase.kind === 'recording';
  const isBusy = phase.kind === 'processing';
  const hasResult = phase.kind === 'result' || phase.kind === 'failure';

  return (
    <div className="card mb-3 read-aloud ondevice-read">
      <span className={`chip ${chipClass}`}>{lessonLabel}</span>
      <p className="sm soft" style={{ margin: '10px 0 4px' }}>Đọc to:</p>
      <div className="fit-box"><p className="jp fit-text read-aloud-sentence" style={fitTextStyle(sentenceJp, 22, 16)} lang="ja">{sentenceJp}</p></div>
      {reading && reading !== sentenceJp ? <p className="jp sm soft" lang="ja">{reading}</p> : null}
      <p className="sm mt-1">{meaningVi}</p>

      {showGuide && phase.kind === 'idle' ? (
        <div className="ondevice-guide mt-2.5" role="note">
          <b className="sm">🎙️ Lần đầu dùng micro</b>
          <ol className="tiny">
            <li>Bấm <b>Ghi âm</b> — trình duyệt sẽ hỏi quyền dùng micro, chọn <b>Cho phép</b>.</li>
            <li>Đọc to câu trên rồi bấm <b>Dừng</b> (tối đa {MAX_RECORDING_SEC} giây).</li>
            <li>Lần đầu Neko tải bộ nhận diện <b>~{ASR_FIRST_DOWNLOAD_MB} MB</b> (mô hình {ASR_MODEL_MB} MB từ Hugging Face + bộ chạy) — nên dùng Wi-Fi; sau đó trình duyệt giữ lại.</li>
          </ol>
          <p className="tiny muted">Bản ghi được xử lý <b>ngay trên máy bạn</b>, không gửi lên máy chủ nào và không được lưu lại.</p>
        </div>
      ) : null}

      <div className="row wrap mt-3 ondevice-actions">
        <AudioButton text={sentenceJp} label="Nghe mẫu" className="btn ghost sm" showText />
        {isRecording ? (
          <button type="button" className="btn sm read-aloud-mic is-listening" onClick={() => void stop()}>⏹ Dừng · {elapsed.toFixed(0)}s</button>
        ) : (
          <button type="button" className="btn sm read-aloud-mic" onClick={() => void start()} disabled={isBusy}>
            🎙️ {hasResult ? 'Ghi lại' : 'Ghi âm'}
          </button>
        )}
        {audioUrl && !isRecording ? (
          <button type="button" className="btn ghost sm" onClick={() => { const player = playerRef.current; if (player) { player.currentTime = 0; void player.play(); } }}>▶ Nghe lại bản ghi</button>
        ) : null}
        {audioUrl ? <audio ref={playerRef} src={audioUrl} preload="auto" hidden /> : null}
      </div>

      {isRecording ? (
        <div className="read-aloud-box mt-2.5" role="status" aria-live="polite">
          <span className="read-aloud-dot" aria-hidden="true" /> Đang ghi âm… đọc câu trên rồi bấm Dừng.
          <span className="ondevice-level" aria-hidden="true"><span ref={levelRef} /></span>
          {model.status === 'loading' ? <p className="tiny muted mt-1">Đang tải mô hình nhận diện{model.totalMb ? ` · ${model.loadedMb}/${model.totalMb} MB` : ''}…</p> : null}
        </div>
      ) : null}

      {isBusy ? (
        <div className="read-aloud-box mt-2.5" role="status" aria-live="polite">
          <span className="ondevice-spinner" aria-hidden="true" />
          {phase.step === 'decode' ? 'Đang đọc bản ghi…'
            : model.status === 'loading' ? `Đang tải mô hình nhận diện${model.totalMb ? ` · ${model.percent}% (${model.loadedMb}/${model.totalMb} MB)` : '…'} — chỉ lần đầu`
              : 'Whisper đang nghe lại bản ghi trên máy bạn…'}
          {model.status === 'loading' && model.totalMb ? <span className="ondevice-progress"><span style={{ transform: `scaleX(${model.percent / 100})` }} /></span> : null}
        </div>
      ) : null}

      <div ref={outcomeRef} className="ondevice-outcome">
      {phase.kind === 'failure' ? (
        <div className={`read-aloud-box mt-2.5 is-${phase.reason.startsWith('model') || phase.reason === 'failed' ? 'error' : 'not_recognized'}`} role="status">
          <b className="sm">{FAILURES[phase.reason].title}</b>
          <p className="sm mt-1">{FAILURES[phase.reason].body}</p>
          <p className="tiny muted mt-1.5">Chưa thể đánh giá — hãy nghe mẫu và thử lại.</p>
        </div>
      ) : null}

      {phase.kind === 'result' ? <ResultView phase={phase} isShort={isShort} device={model.status === 'ready' ? model.device : null} /> : null}
      </div>

      {!hasResult && !isRecording && !isBusy && !showGuide ? (
        <p className="tiny muted mt-2">Xử lý trên máy bằng {ASR_MODEL_LABEL} — bản ghi không rời thiết bị, không được lưu.</p>
      ) : null}
    </div>
  );
}

function ResultView({ phase, isShort, device }: { phase: Extract<Phase, { kind: 'result' }>; isShort: boolean; device: 'webgpu' | 'wasm' | null }) {
  const { comparison, stats, check, rate } = phase;
  const isLoose = !comparison.isMatch && phase.looseMatch;
  return (
    <div className={`read-aloud-box mt-2.5 is-${comparison.isMatch || isLoose ? 'matched' : 'different'}`} role="status">
      <b className="sm">{comparison.isMatch ? '✓ Nội dung khớp câu mẫu' : isLoose ? '✓ Nội dung khớp (nếu bỏ qua trường âm / っ)' : 'Nội dung nghe được khác câu mẫu'}</b>
      <p className="sm mt-1">Whisper nghe được: <span className="jp" lang="ja">{phase.transcript}</span></p>
      {isLoose ? <p className="tiny mt-1">Chỉ khác ở trường âm (ー, おう, えい) hoặc âm ngắt っ — Whisper hay tự thêm / bớt những chỗ này nên Neko <b>chưa đánh giá được</b>. Nghe lại mẫu và bản ghi để tự so độ dài âm.</p> : null}
      {!comparison.isMatch && !isLoose ? (
        <>
          <p className="jp read-aloud-diff mt-1" lang="ja">
            {comparison.segments.map((segment, index) => (
              <span key={index} className={`diff-${segment.kind}`} title={segment.kind === 'missing' ? 'Có trong câu mẫu, không nghe thấy' : segment.kind === 'extra' ? 'Nghe thấy thêm' : undefined}>{segment.text}</span>
            ))}
          </p>
          <p className="tiny muted"><span className="diff-missing">gạch chân đỏ</span> = có trong câu mẫu nhưng không nghe thấy · <span className="diff-extra">nền vàng</span> = nghe thấy thêm</p>
          {comparison.mayBeScriptDifference ? <p className="tiny mt-1">Phần khác có chữ Hán — có thể chỉ viết khác (Kanji ↔ kana), không hẳn là bạn đọc khác.</p> : null}
        </>
      ) : null}
      {isShort ? <p className="tiny mt-1.5">Âm / từ rất ngắn: Whisper nhận diện kém tin cậy với một hai âm đứng riêng — kết quả chỉ để tham khảo.</p> : null}

      <dl className="ondevice-stats mt-2">
        <div><dt>Thời gian nói</dt><dd>{stats.speechSec.toFixed(1)} giây</dd></div>
        {rate !== null ? <div><dt>Tốc độ</dt><dd>≈ {rate} mora/giây</dd></div> : null}
        <div><dt>Âm thanh</dt><dd>{check.warnings.length ? check.warnings.map((warning) => WARNING_LABEL[warning]).join(' · ') : 'Rõ, đủ to'}</dd></div>
      </dl>
      <p className="tiny muted mt-1.5">
        Chưa hỗ trợ: <b>điểm phát âm, trường âm, âm ngắt っ, ん, cao độ</b> — chưa có mô hình miễn phí chạy trên trình duyệt chấm được những điều này
        đủ tin cậy. Nội dung khớp không có nghĩa là phát âm đã chuẩn: nghe lại bản ghi và so với mẫu nhé.
      </p>
      <p className="tiny muted mt-1">Xử lý trên máy · {ASR_MODEL_LABEL}{device ? ` · ${device === 'webgpu' ? 'WebGPU' : 'WebAssembly'}` : ''} · {(phase.asrMs / 1000).toFixed(1)} giây</p>
    </div>
  );
}

const WARNING_LABEL: Record<AudioCheck['warnings'][number], string> = {
  clipped: 'Tiếng bị rè (quá to / sát micro)',
  noisy: 'Nền hơi ồn',
  quiet: 'Hơi nhỏ',
};
