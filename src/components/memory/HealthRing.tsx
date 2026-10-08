const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Vòng "sức khoẻ trí nhớ" — có chữ số kèm theo, không chỉ dựa vào màu. */
export function HealthRing({ value }: { value: number }) {
  return (
    <div className="ring" role="img" aria-label={`Bạn đang nhớ được ${value} phần trăm`}>
      <svg viewBox="0 0 120 120" width="118" height="118" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#F4EAE6" strokeWidth="12" />
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#FF5B73" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)} />
      </svg>
      <span className="num"><b>{value}%</b><span>sức khoẻ</span></span>
    </div>
  );
}
