'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { AsrDevice, AsrResponse } from '@/features/speech/asr-protocol';

/**
 * Nhận diện giọng nói trên thiết bị — MỘT Web Worker dùng chung cho cả trang (tạo khi cần lần đầu, không tạo khi mới mở trang).
 * Trạng thái tải mô hình dùng chung giữa các câu (useSyncExternalStore) → đổi câu không tải lại.
 */
export type AsrModelState =
  | { status: 'idle' }
  | { status: 'loading'; percent: number; loadedMb: number; totalMb: number }
  | { status: 'ready'; device: AsrDevice; loadMs: number }
  | { status: 'error'; reason: 'memory' | 'network' | 'unsupported' | 'unknown'; message: string };

type Pending = { resolve: (value: { text: string; ms: number }) => void; reject: (error: AsrError) => void };

export class AsrError extends Error {
  constructor(readonly reason: 'memory' | 'network' | 'unsupported' | 'unknown', message: string, readonly stage: 'load' | 'transcribe') {
    super(message);
  }
}

let worker: Worker | null = null;
let state: AsrModelState = { status: 'idle' };
let nextId = 1;
const pending = new Map<number, Pending>();
const listeners = new Set<() => void>();
const setState = (next: AsrModelState) => { state = next; listeners.forEach((listener) => listener()); };

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../features/speech/asr.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<AsrResponse>) => {
    const message = event.data;
    if (message.type === 'progress') setState({ status: 'loading', percent: message.percent, loadedMb: message.loadedMb, totalMb: message.totalMb });
    else if (message.type === 'ready') setState({ status: 'ready', device: message.device, loadMs: message.loadMs });
    else if (message.type === 'result') { pending.get(message.id)?.resolve({ text: message.text, ms: message.ms }); pending.delete(message.id); }
    else if (message.type === 'error') {
      if (message.stage === 'load') setState({ status: 'error', reason: message.reason, message: message.message });
      const error = new AsrError(message.reason, message.message, message.stage);
      if (message.id !== undefined) { pending.get(message.id)?.reject(error); pending.delete(message.id); }
    }
  };
  worker.onerror = (event) => {
    setState({ status: 'error', reason: 'unknown', message: event.message || 'Worker lỗi' });
    pending.forEach((entry) => entry.reject(new AsrError('unknown', event.message || 'Worker lỗi', 'load')));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export function useOnDeviceAsr() {
  const model = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => state,
  );

  /** Bắt đầu tải mô hình (gọi khi người học bấm ghi âm — tải song song lúc đang nói). */
  const preload = useCallback(() => {
    if (state.status === 'ready' || state.status === 'loading') return;
    setState({ status: 'loading', percent: 0, loadedMb: 0, totalMb: 0 });
    ensureWorker().postMessage({ type: 'load' });
  }, []);

  const transcribe = useCallback((audio: Float32Array) => new Promise<{ text: string; ms: number }>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    if (state.status !== 'ready' && state.status !== 'loading') setState({ status: 'loading', percent: 0, loadedMb: 0, totalMb: 0 });
    ensureWorker().postMessage({ type: 'transcribe', id, audio }, [audio.buffer]);
  }), []);

  // Rời trang Luyện nói → giải phóng Worker (mô hình vẫn còn trong cache trình duyệt cho lần sau).
  useEffect(() => () => {
    if (!listeners.size && worker) { worker.terminate(); worker = null; state = { status: 'idle' }; }
  }, []);

  return { model, preload, transcribe };
}
