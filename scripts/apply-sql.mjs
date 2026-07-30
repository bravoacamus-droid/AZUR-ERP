// Aplica un archivo SQL a Supabase vía la Management API.
// uso: node scripts/apply-sql.mjs <ruta.sql>
import { readFileSync, existsSync } from 'node:fs';

// Carga .env.local (fuente de verdad de los secretos; tiene prioridad sobre el
// entorno del sistema, para respetar tokens rotados). No se sube a git.
if (existsSync('.env.local')) {
  for (const raw of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key === 'SUPABASE_ACCESS_TOKEN' || key === 'SUPABASE_PROJECT_REF') process.env[key] = val;
  }
}

const REF = process.env.SUPABASE_PROJECT_REF || 'vcgrvpcotojeeejghaux';
// Access token de la Management API. Define SUPABASE_ACCESS_TOKEN en .env.local.
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Falta SUPABASE_ACCESS_TOKEN en el entorno.');
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('Falta la ruta del .sql');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}\n${text}`);
  process.exit(1);
}
console.log(`OK ${file} → HTTP ${res.status}`);
console.log(text.slice(0, 500));
