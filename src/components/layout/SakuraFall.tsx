'use client';

import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useState } from 'react';

/** Ít cánh hơn = ít lớp phải vẽ khi cuộn; 10 vẫn đủ cảm giác hoa rơi. */
const PETAL_COUNT = 10;
/** Màn cần tập trung (đang làm bài) thì không rơi hoa — tránh phân tán. */
const FOCUS_PATH_PREFIXES = ['/hoc/', '/tri-nho/cuu/', '/gap-lai', '/kham-pha', '/thuc-hanh'];

/** Đa số là bông hoa 5 cánh; thỉnh thoảng một cánh rời bay theo — như cây anh đào thật. */
const LOOSE_PETAL_RATIO = 0.3;

interface Petal {
  id: number;
  kind: 'flower' | 'petal';
  style: CSSProperties;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

/** Mỗi cánh một vị trí, cỡ, tốc độ, độ lắc khác nhau — tạo ở trình duyệt (sau khi mount) để server và client không lệch nhau. */
function createPetals(): Petal[] {
  return Array.from({ length: PETAL_COUNT }, (_, id) => {
    const fallSeconds = random(11, 19);
    const kind = Math.random() < LOOSE_PETAL_RATIO ? 'petal' : 'flower';
    return {
      id,
      kind,
      style: {
        '--x': `${random(0, 100)}vw`,
        '--size': kind === 'flower' ? `${random(24, 36)}px` : `${random(13, 18)}px`,
        '--fall': `${fallSeconds}s`,
        // Trễ âm: vừa mở trang đã có cánh hoa đang rơi giữa chừng, không đợi rơi từ mép trên.
        '--delay': `${-random(0, fallSeconds)}s`,
        '--drift': `${random(-18, 18)}vw`,
        '--sway': `${random(2.6, 4.2)}s`,
        '--spin': `${random(2.4, 4.2)}s`,
        '--opacity': random(0.75, 1).toFixed(2),
      } as CSSProperties,
    };
  });
}

/** Hoa anh đào rơi nhẹ trên nền — chỉ trang trí: không nhận chuột, ẩn với trình đọc màn hình. */
export function SakuraFall() {
  const pathname = usePathname();
  const [petals, setPetals] = useState<Petal[]>([]);

  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setPetals(createPetals());
    // Tab bị ẩn → dừng hẳn hoạt ảnh (không tốn pin / GPU khi không ai nhìn).
    const onVisibility = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (FOCUS_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <div className={`sakura-fall${isHidden ? ' paused' : ''}`} aria-hidden="true">
      {petals.map((petal) => (
        <span key={petal.id} className="petal" style={petal.style}>
          <span className="petal-sway">
            <svg className="petal-spin" viewBox="-12 -12 24 24">
              {/* Symbol dùng hệ toạ độ quanh tâm (-12…12) → phải đặt đúng khung, không thì hoa lệch về một góc và bị cắt. */}
              <use href={petal.kind === 'flower' ? '#sakura-flower' : '#sakura-loose-petal'} x="-12" y="-12" width="24" height="24" />
            </svg>
          </span>
        </span>
      ))}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Hoa anh đào: cánh hồng nhạt ở mép, hồng đậm dần vào tâm (gradient tròn quanh tâm hoa nên xoay cánh nào cũng đúng). */}
          <radialGradient id="sakura-petal-fill" cx="0" cy="0" r="11" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF8FA8" />
            <stop offset=".45" stopColor="#FFC3D0" />
            <stop offset="1" stopColor="#FFEFF3" />
          </radialGradient>
          {/* Một cánh: thuôn từ tâm ra, đầu cánh có khía hình chữ V nhỏ — dấu hiệu nhận ra hoa anh đào. */}
          <path id="sakura-petal-shape" d="M0 0C-3.4-1.6-5.6-5.2-4.4-8.6-3.7-10.4-2-10.9-1-10.6L0-9.2 1-10.6C2-10.9 3.7-10.4 4.4-8.6 5.6-5.2 3.4-1.6 0 0Z" />
          <symbol id="sakura-flower" viewBox="-12 -12 24 24" overflow="visible">
            {[0, 72, 144, 216, 288].map((angle) => (
              <use key={angle} href="#sakura-petal-shape" transform={`rotate(${angle})`} fill="url(#sakura-petal-fill)"
                stroke="#FFFFFF" strokeOpacity=".7" strokeWidth=".4" />
            ))}
            {/* Nhuỵ: chấm hồng đậm toả ra + tâm vàng. */}
            {[18, 90, 162, 234, 306].map((angle) => (
              <g key={angle} transform={`rotate(${angle})`}>
                <line x1="0" y1="0" x2="0" y2="-3.6" stroke="#E86A8A" strokeWidth=".45" strokeLinecap="round" />
                <circle cx="0" cy="-3.8" r=".65" fill="#F2B544" />
              </g>
            ))}
            <circle r="1.5" fill="#FFD66B" />
          </symbol>
          {/* Cánh rời: thuôn dài, khía nông — không thành hình trái tim. */}
          <symbol id="sakura-loose-petal" viewBox="-12 -12 24 24" overflow="visible">
            <path d="M0 10C-4.2 6.5-5.2 0-3.6-5.6-2.8-8.6-1.4-10.2-.6-10.4L0-9.4 .6-10.4C1.4-10.2 2.8-8.6 3.6-5.6 5.2 0 4.2 6.5 0 10Z"
              fill="url(#sakura-loose-fill)" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth=".4" />
            <linearGradient id="sakura-loose-fill" x1="0" y1="10" x2="0" y2="-10" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FF9FB5" />
              <stop offset="1" stopColor="#FFEAF0" />
            </linearGradient>
          </symbol>
        </defs>
      </svg>
    </div>
  );
}
