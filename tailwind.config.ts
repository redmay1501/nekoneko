import type { Config } from 'tailwindcss';

/** Màu thương hiệu — cùng giá trị với biến CSS trong src/app/globals.css (nguồn: prototype). */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sakura: { DEFAULT: '#FF5B73', deep: '#E24159', pink: '#FFC1CD' },
        mint: '#DFF3E4',
        sage: '#7DBA82',
        lav: '#EAE4F7',
        sky: '#E2F0F8',
        cream: '#FFF3DE',
        ink: { DEFAULT: '#252525', 2: '#5E5A57', 3: '#8E8781' },
        line: { DEFAULT: '#F2E8E4', 2: '#EDE4DF' },
      },
      fontFamily: {
        vi: ['var(--font-vi)'],
        jp: ['var(--font-jp)'],
      },
    },
  },
  plugins: [],
};

export default config;
