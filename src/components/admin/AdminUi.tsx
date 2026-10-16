'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Toast + hộp xác nhận dùng chung trong /admin.
 *   const { toast, confirm } = useAdminUi();
 *   if (await confirm({ title: 'Xoá?', body: '…', confirmLabel: 'Xoá', tone: 'danger' })) …
 */
type ToastTone = 'success' | 'error' | 'info';
interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  /** Bắt gõ lại chuỗi này (ví dụ email) mới bấm xác nhận được. */
  typeToConfirm?: string;
  /** Chỉ thông báo (một nút Đóng) — ví dụ: không thể xoá vì người học đang dùng. */
  alertOnly?: boolean;
}
interface AdminUi {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AdminUiContext = createContext<AdminUi | null>(null);

export function useAdminUi(): AdminUi {
  const context = useContext(AdminUiContext);
  if (!context) throw new Error('useAdminUi phải nằm trong AdminUiProvider');
  return context;
}

export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: ToastTone }>>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), tone === 'error' ? 7000 : 3500);
  }, []);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })), []);

  return (
    <AdminUiContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((item) => <div key={item.id} className={`adm-toast ${item.tone}`}>{item.message}</div>)}
      </div>
      {dialog ? (
        <ConfirmDialog key={dialog.title} options={dialog} onClose={(value) => { dialog.resolve(value); setDialog(null); }} />
      ) : null}
    </AdminUiContext.Provider>
  );
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (value: boolean) => void }) {
  const [typed, setTyped] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const isBlocked = options.typeToConfirm !== undefined && typed.trim().toLowerCase() !== options.typeToConfirm.toLowerCase();
  return (
    <div className="adm-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(false); }}>
      <div className="adm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="adm-confirm-title">
        <h2 id="adm-confirm-title">{options.title}</h2>
        {options.body ? <div className="adm-sm" style={{ color: 'var(--ink-2)' }}>{options.body}</div> : null}
        {options.typeToConfirm !== undefined ? (
          <label className="adm-field" style={{ marginTop: 12 }}>
            <span>Gõ lại <code>{options.typeToConfirm}</code> để xác nhận</span>
            <input className="adm-input" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" />
          </label>
        ) : null}
        <div className="adm-dialog-actions">
          <button ref={cancelRef} type="button" className="adm-btn ghost" onClick={() => onClose(false)}>{options.alertOnly ? 'Đóng' : 'Huỷ'}</button>
          {options.alertOnly ? null : (
            <button type="button" className={`adm-btn ${options.tone === 'danger' ? 'danger' : ''}`} disabled={isBlocked} onClick={() => onClose(true)}>
              {options.confirmLabel ?? 'Đồng ý'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Gọi API admin → { ok, data } hoặc { ok: false, error } (câu tiếng Việt từ server). */
export async function adminFetch<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const isForm = init?.body instanceof FormData;
    const response = await fetch(url, { ...init, headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, status: response.status, error: (body as { error?: string } | null)?.error ?? `Lỗi ${response.status}` };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: 'Mất kết nối mạng. Bạn thử lại nhé.' };
  }
}
