'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postJson } from '@/lib/api/api-client';

/** Người học tự đánh dấu "đã xem" (không tự đánh dấu khi mở trang — mở video chưa phải là đã nghe hiểu). */
export function WatchedToggle({ videoId, initialWatched }: { videoId: string; initialWatched: boolean }) {
  const router = useRouter();
  const [watched, setWatched] = useState(initialWatched);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  async function toggle() {
    const next = !watched;
    setWatched(next);
    setState('saving');
    try {
      await postJson('/api/videos/watched', { videoId, watched: next });
      setState('idle');
      router.refresh();
    } catch {
      setWatched(!next);
      setState('error');
    }
  }
  return (
    <span className="row" style={{ gap: 8, alignItems: 'center' }}>
      <button type="button" className={`btn ${watched ? 'success' : 'ghost'}`} aria-pressed={watched} disabled={state === 'saving'} onClick={toggle}>
        {watched ? '✓ Đã xem' : '☐ Đánh dấu đã xem'}
      </button>
      {state === 'error' ? <span className="tiny muted" role="status">Chưa lưu được — thử lại nhé.</span> : null}
    </span>
  );
}
