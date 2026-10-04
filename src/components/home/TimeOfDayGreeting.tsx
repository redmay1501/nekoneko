'use client';

import { useSyncExternalStore } from 'react';

const MORNING_ENDS_AT_HOUR = 11;
const AFTERNOON_ENDS_AT_HOUR = 18;

function subscribeNothing(): () => void {
  return () => undefined;
}

function partOfDay(): 'sáng' | 'chiều' | 'tối' {
  const hour = new Date().getHours();
  if (hour < MORNING_ENDS_AT_HOUR) return 'sáng';
  if (hour < AFTERNOON_ENDS_AT_HOUR) return 'chiều';
  return 'tối';
}

/**
 * "Chào buổi sáng/chiều/tối" theo giờ trên máy người học.
 * Tính ở trình duyệt vì server không biết múi giờ của người học.
 */
export function TimeOfDayGreeting({ displayName }: { displayName: string }) {
  const part = useSyncExternalStore(subscribeNothing, partOfDay, () => null);
  return (
    <h1>
      <span>{part ? `Chào buổi ${part},` : 'Chào'}</span>{' '}
      <span className="dash-greeting-name">{displayName}!</span>
    </h1>
  );
}
