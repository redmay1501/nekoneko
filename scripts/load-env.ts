import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Nạp biến môi trường từ .env.local cho script chạy ngoài Next.js.
 * Không ghi đè biến đã có sẵn trong môi trường (ví dụ biến của CI).
 */
export function loadLocalEnv(): void {
  for (const fileName of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), fileName);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || line.trim().startsWith('#')) continue;
      const [, key, rawValue] = match;
      if (process.env[key] === undefined) process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`✗ Thiếu biến môi trường ${name}. Điền vào .env.local (xem .env.example).`);
    process.exit(1);
  }
  return value;
}
