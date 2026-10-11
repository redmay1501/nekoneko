import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Test component (.test.tsx) render ra HTML tĩnh — JSX kiểu React 17+ (không cần import React).
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@content': path.resolve(__dirname, 'content'),
      'server-only': path.resolve(__dirname, 'src/test/server-only-stub.ts'),
    },
  },
});
