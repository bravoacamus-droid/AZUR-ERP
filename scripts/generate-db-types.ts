/**
 * Genera types/database.types.ts desde el schema actual de Supabase.
 * Usa el endpoint Management API GET /v1/projects/{ref}/types/typescript.
 *
 * Uso:  pnpm db:types
 */
import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '.env.local') });

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;
const REF = process.env.SUPABASE_PROJECT_REF!;
if (!TOKEN || !REF) {
  console.error('✗ Faltan SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF');
  process.exit(1);
}

const OUT = path.resolve(__dirname, '..', 'types', 'database.types.ts');

async function main() {
  const url = `https://api.supabase.com/v1/projects/${REF}/types/typescript?included_schemas=public`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  const ts = typeof data === 'string' ? data : (data as { types: string }).types;

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `// Generated from Supabase schema — DO NOT EDIT MANUALLY.\n// Regenerate with: pnpm db:types\n\n${ts}\n`,
  );

  console.log(`✓ Types escritos en ${OUT} (${ts.length.toLocaleString()} chars)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
