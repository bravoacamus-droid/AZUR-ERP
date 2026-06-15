// Aplica un archivo SQL a Supabase vía la Management API.
// uso: node scripts/apply-sql.mjs <ruta.sql>
import { readFileSync } from 'node:fs';

const REF = process.env.SUPABASE_PROJECT_REF || 'vcgrvpcotojeeejghaux';
// Access token de la Management API. Define SUPABASE_ACCESS_TOKEN en tu entorno.
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
