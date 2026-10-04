'use client';

interface ToggleRowProps {
  title: string;
  description: string;
  isOn: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
}

/** Một dòng cài đặt bật/tắt — dùng role="switch" để trình đọc màn hình hiểu được. */
export function ToggleRow({ title, description, isOn, isDisabled, onToggle }: ToggleRowProps) {
  return (
    <div className="card tight">
      <div className="between">
        <div><b className="sm">{title}</b><div className="tiny muted">{description}</div></div>
        <button type="button" role="switch" aria-checked={isOn} aria-label={title} disabled={isDisabled} onClick={onToggle}
          className="toggle" style={{ background: isOn ? 'linear-gradient(180deg,#FFA9B5,#F2798C)' : '#EDE4DF', minHeight: 44, minWidth: 46, backgroundClip: 'content-box', padding: '8.5px 0' }}>
          <span style={{ left: isOn ? 22 : 3, top: 11.5 }} />
        </button>
      </div>
    </div>
  );
}
