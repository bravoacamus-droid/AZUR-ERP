// Cambia la contraseña de un usuario vía la Auth Admin API.
// uso: node scripts/set-password.mjs <email> <nueva-contraseña>
import { readFileSync, existsSync } from 'node:fs';

// Carga .env.local (igual que apply-sql.mjs / seed-users.mjs).
if (existsSync('.env.local')) {
  for (const raw of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key === 'NEXT_PUBLIC_SUPABASE_URL' || key === 'SUPABASE_SERVICE_ROLE_KEY') process.env[key] = process.env[key] || val;
  }
}

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !SERVICE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('uso: node scripts/set-password.mjs <email> <nueva-contraseña>');
  process.exit(1);
}

const h = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

const listed = await fetch(`${URL_SB}/auth/v1/admin/users?per_page=200`, { headers: h }).then((r) => r.json());
const user = (listed.users || []).find((u) => u.email === email);
if (!user) {
  console.error('No existe el usuario:', email);
  process.exit(1);
}

const res = await fetch(`${URL_SB}/auth/v1/admin/users/${user.id}`, {
  method: 'PUT',
  headers: h,
  body: JSON.stringify({ password }),
});
if (!res.ok) {
  console.error('ERROR', res.status, JSON.stringify(await res.json()).slice(0, 200));
  process.exit(1);
}
console.log('contraseña actualizada para', email);
