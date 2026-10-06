'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { requestJson } from '@/lib/api/api-client';

/** Tên hiển thị — sửa ngay trong Cài đặt. Nút lưu có trạng thái "Đang lưu…", lưu xong báo "Đã lưu". */
export function ProfileNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const mutation = useMutation({
    mutationFn: (displayName: string) => requestJson<{ displayName: string }>('/api/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName }),
    }),
    onSuccess: (result) => {
      setSavedName(result.displayName);
      router.refresh(); // lời chào, thanh trên cùng hiện tên mới
    },
  });
  const isChanged = name.trim() !== savedName && name.trim().length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (isChanged) mutation.mutate(name.trim());
  }

  return (
    <form onSubmit={submit} className="card tight">
      <label className="sm" htmlFor="display-name"><b>Tên hiển thị</b></label>
      <div className="row mt-2" style={{ gap: 8 }}>
        <input id="display-name" className="input" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        <button type="submit" className="btn sm" disabled={!isChanged || mutation.isPending} aria-busy={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
      {mutation.isError ? <p className="tiny mt-1.5" role="alert">Chưa lưu được — {mutation.error.message}</p> : null}
      {mutation.isSuccess && !isChanged ? <p className="tiny muted mt-1.5" role="status">✓ Đã lưu</p> : null}
    </form>
  );
}
