'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { ModalPortal } from '@/components/common/ModalPortal';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import type { DailyGreeting } from '@/features/home/daily-greeting';
import { startNavigation } from '@/stores/navigation-progress-store';

const MORNING_ENDS_AT_HOUR = 11;
const AFTERNOON_ENDS_AT_HOUR = 18;
const subscribeNothing = () => () => undefined;

const storageKey = (userId: string) => `neko:daily-greeting:${userId}`;

/** Đã chào hôm nay chưa — lưu ở trình duyệt; đọc/ghi hỏng (chế độ riêng tư…) thì coi như chưa chào. */
function greetedOn(userId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function rememberGreeted(userId: string, dateKey: string) {
  try {
    window.localStorage.setItem(storageKey(userId), dateKey);
  } catch {
    // Không lưu được thì lần sau chào lại — không sao.
  }
}

function partOfDay(): string {
  const hour = new Date().getHours();
  if (hour < MORNING_ENDS_AT_HOUR) return 'Chào buổi sáng';
  if (hour < AFTERNOON_ENDS_AT_HOUR) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Lời chào đầu tiên trong ngày — nội dung đổi theo ngày (features/home/daily-greeting.ts). */
export function DailyGreetingDialog({ greeting, displayName, userId }: { greeting: DailyGreeting; displayName: string; userId: string }) {
  const router = useRouter();
  const alreadyGreeted = useSyncExternalStore(subscribeNothing, () => greetedOn(userId) === greeting.dateKey, () => true);
  const salutation = useSyncExternalStore(subscribeNothing, partOfDay, () => 'Chào');
  const [isClosed, setIsClosed] = useState(false);
  if (alreadyGreeted || isClosed) return null;

  function close() {
    rememberGreeted(userId, greeting.dateKey);
    setIsClosed(true);
  }

  function startLearning() {
    close();
    startNavigation();
    router.push('/hoc/daily');
  }

  return (
    <ModalPortal className="welcome daily-greeting" labelledBy="daily-greeting-title" onEscape={close}>
      <div className="center">
        <SpriteIcon name="noko" size={84} className="mx-auto" />
        <h2 id="daily-greeting-title" className="mt-2">{salutation}, {displayName}! 🌸</h2>
        <p className="soft mt-2">{greeting.message}</p>
        {greeting.todayLine ? <p className="chip mint mt-3" style={{ display: 'inline-flex' }}>{greeting.todayLine}</p> : null}
      </div>
      <div className="card tight mt-4" style={{ background: 'var(--cream)', borderColor: 'transparent' }}>
        <p className="tiny muted">🗓️ Câu của hôm nay</p>
        <div className="between mt-1">
          <div>
            <p className="jp" style={{ fontSize: 20 }}>{greeting.phrase.jp}</p>
            <p className="tiny muted">{greeting.phrase.reading} · {greeting.phrase.vi}</p>
          </div>
          <AudioButton text={greeting.phrase.jp} label="🔊" className="btn ghost sm" />
        </div>
      </div>
      <button type="button" className="btn block mt-4" onClick={startLearning}>{greeting.ctaLabel}</button>
      <button type="button" className="btn quiet block mt-2" onClick={close}>Để sau</button>
    </ModalPortal>
  );
}
