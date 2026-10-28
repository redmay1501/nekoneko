/// <reference lib="webworker" />
/**
 * Web Worker nhận diện tiếng Nhật trên thiết bị: Transformers.js + Whisper base. Chạy ngoài luồng chính → trang không đơ.
 * WebGPU nếu thiết bị có (Chrome / Edge, Safari 26+), không thì WebAssembly (chậm hơn, mọi trình duyệt hiện đại).
 * Mô hình tải theo nhu cầu (chỉ khi người học bấm ghi âm) và được Transformers.js lưu vào Cache Storage của trình duyệt.
 */
import { type AutomaticSpeechRecognitionPipeline, env, pipeline } from '@huggingface/transformers';
import { ASR_MODEL_ID, type AsrDevice, type AsrRequest, type AsrResponse, classifyAsrError } from './asr-protocol';

env.allowLocalModels = false;
env.useBrowserCache = true;

const post = (message: AsrResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(message);
let loading: Promise<{ pipe: AutomaticSpeechRecognitionPipeline; device: AsrDevice }> | null = null;

async function hasWebGpu(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    return Boolean(gpu && (await gpu.requestAdapter()));
  } catch {
    return false;
  }
}

async function create(device: AsrDevice) {
  const started = performance.now();
  const pipe = await pipeline('automatic-speech-recognition', ASR_MODEL_ID, {
    device,
    // WebGPU: encoder fp32 + decoder q4 (khuyến nghị của Transformers.js cho Whisper); WASM: q8 cho cả hai (nhẹ, nhanh nhất trên CPU).
    dtype: device === 'webgpu' ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8',
    progress_callback: (info) => {
      if (info.status === 'progress_total') {
        post({ type: 'progress', loadedMb: Math.round(info.loaded / 1e6), totalMb: Math.round(info.total / 1e6), percent: Math.round(info.progress) });
      }
    },
  }) as AutomaticSpeechRecognitionPipeline;
  post({ type: 'ready', device, loadMs: Math.round(performance.now() - started) });
  return { pipe, device };
}

function load() {
  loading ??= (async () => {
    if (await hasWebGpu()) {
      try {
        return await create('webgpu');
      } catch {
        // WebGPU có nhưng chạy lỗi (driver, bộ nhớ GPU) → thử lại bằng WebAssembly.
      }
    }
    return create('wasm');
  })();
  loading.catch(() => { loading = null; }); // lỗi → lần sau thử tải lại
  return loading;
}

self.onmessage = async (event: MessageEvent<AsrRequest>) => {
  const request = event.data;
  if (request.type === 'load') {
    try { await load(); } catch (error) {
      post({ type: 'error', stage: 'load', reason: classifyAsrError(error), message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  let pipe: AutomaticSpeechRecognitionPipeline;
  try { ({ pipe } = await load()); } catch (error) {
    post({ type: 'error', id: request.id, stage: 'load', reason: classifyAsrError(error), message: error instanceof Error ? error.message : String(error) });
    return;
  }
  try {
    const started = performance.now();
    const output = await pipe(request.audio, { language: 'japanese', task: 'transcribe' });
    const text = (Array.isArray(output) ? output.map((entry) => entry.text).join('') : output.text).trim();
    post({ type: 'result', id: request.id, text, ms: Math.round(performance.now() - started) });
  } catch (error) {
    post({ type: 'error', id: request.id, stage: 'transcribe', reason: classifyAsrError(error), message: error instanceof Error ? error.message : String(error) });
  }
};
