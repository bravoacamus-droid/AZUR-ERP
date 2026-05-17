/**
 * Runner de migraciones SQL contra Supabase vía Management API.
 *
 * - Lee todas las *.sql en `supabase/migrations/` en orden alfabético
 * - Crea (si no existe) la tabla `azur_migrations`
 * - Ejecuta solo las migraciones nuevas (idempotente)
 * - Registra cada migración aplicada (nombre, hash, timestamp)
 *
 * Uso:  pnpm db:migrate
 */
import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '.env.local') });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!ACCESS_TOKEN || !PROJECT_REF) {
  console.error('✗ Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local');
  process.exit(1);
}

const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

async function runSql(sql: string): Promise<unknown> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function ensureMigrationsTable() {
  await runSql(`
    create table if not exists public.azur_migrations (
      name        text primary key,
      hash        text not null,
      applied_at  timestamptz not null default now()
    );
  `);
}

async function getApplied(): Promise<Map<string, string>> {
  const rows = (await runSql('select name, hash from public.azur_migrations;')) as Array<{
    name: string;
    hash: string;
  }>;
  return new Map(rows.map((r) => [r.name, r.hash]));
}

async function main() {
  console.log(`▶ Migrando proyecto ${PROJECT_REF}`);
  await ensureMigrationsTable();
  const applied = await getApplied();

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let appliedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const sql = await readFile(fullPath, 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex').slice(0, 16);

    if (applied.has(file)) {
      if (applied.get(file) === hash) {
        console.log(`  ⊙ ${file}  (ya aplicada)`);
        skippedCount++;
        continue;
      } else {
        console.warn(
          `  ⚠ ${file}  HASH DIFIERE (en BD ${applied.get(file)}, archivo ${hash}). Re-ejecutando.`,
        );
      }
    }

    process.stdout.write(`  → ${file}  `);
    try {
      await runSql(sql);
      await runSql(
        `insert into public.azur_migrations (name, hash) values ('${file.replace(/'/g, "''")}', '${hash}')
         on conflict (name) do update set hash = excluded.hash, applied_at = now();`,
      );
      console.log('✓');
      appliedCount++;
    } catch (err) {
      console.log('✗');
      console.error(err);
      process.exit(1);
    }
  }

  console.log(
    `\n✔ Migraciones completas — ${appliedCount} aplicada(s), ${skippedCount} omitida(s)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
