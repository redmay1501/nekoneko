import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SESSION_MODES } from './session-modes';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
/** Ràng buộc mode của learning_sessions — lấy định nghĩa MỚI NHẤT trong các migration (theo thứ tự tên file). */
function modesAllowedByDatabase(): string[] {
  const definitions = readdirSync(MIGRATIONS_DIR).sort()
    .flatMap((file) => [...readFileSync(join(MIGRATIONS_DIR, file), 'utf8').matchAll(/mode\s+in\s*\(([^)]*)\)/g)])
    .map((match) => match[1]);
  const latest = definitions.at(-1) ?? '';
  return [...latest.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

describe('SESSION_MODES ↔ database', () => {
  it('mọi chế độ trong code đều lưu được vào learning_sessions', () => {
    const allowed = modesAllowedByDatabase();
    for (const mode of Object.values(SESSION_MODES)) expect(allowed, `thiếu '${mode}' trong ràng buộc mode`).toContain(mode);
  });
});
