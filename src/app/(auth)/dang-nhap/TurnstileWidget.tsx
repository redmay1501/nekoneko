'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<TurnstileApi | null> | null = null;
function loadTurnstile(): Promise<TurnstileApi | null> {
  scriptPromise ??= new Promise((resolve) => {
    if (window.turnstile) { resolve(window.turnstile); return; }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.turnstile ?? null);
    script.onerror = () => { scriptPromise = null; resolve(null); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Ô xác minh "không phải máy" của Cloudflare Turnstile — chỉ hiện khi có NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 * Token gửi kèm yêu cầu tới Supabase Auth (options.captchaToken); Supabase kiểm token bằng secret key đặt trong
 * dashboard (Authentication → Attack Protection). Token chỉ dùng một lần: đổi `resetKey` là widget cấp token mới.
 */
export function TurnstileWidget({ siteKey, onToken, resetKey }: { siteKey: string; onToken: (token: string | null) => void; resetKey: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  useEffect(() => {
    let isCancelled = false;
    void loadTurnstile().then((api) => {
      if (isCancelled || !api || !containerRef.current) return;
      widgetRef.current = api.render(containerRef.current, {
        sitekey: siteKey,
        language: 'vi',
        appearance: 'interaction-only',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      });
    });
    return () => {
      isCancelled = true;
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (!resetKey || !widgetRef.current) return;
    onTokenRef.current(null);
    window.turnstile?.reset(widgetRef.current);
  }, [resetKey]);

  return <div ref={containerRef} className="login-captcha" />;
}
