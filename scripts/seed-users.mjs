// Crea los usuarios de prueba (uno por rol) vía la Auth Admin API.
// Idempotente: si el email ya existe, lo omite. uso: node scripts/seed-users.mjs
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const PASSWORD = 'Azur2026!';
const users = [
  { email: 'gerencia@azur.pe',     nombre: 'Juan Pérez',     rol: 'gerencia',       telefono: '51999000001' },
  { email: 'proyectos@azur.pe',    nombre: 'Carlos Ruiz',    rol: 'jefe_proyectos', telefono: '51999000002' },
  { email: 'presupuestos@azur.pe', nombre: 'Andrea Salas',   rol: 'presupuestos',   telefono: '51999000003' },
  { email: 'admin@azur.pe',        nombre: 'Pamela Díaz',    rol: 'administrador',  telefono: '51999000004' },
  { email: 'comercial@azur.pe',    nombre: 'Lucía Torres',   rol: 'comercial',      telefono: '51999000005' },
  { email: 'residente@azur.pe',    nombre: 'Miguel Quispe',  rol: 'residente',      telefono: '51999000006' },
  { email: 'soma@azur.pe',         nombre: 'Rosa Mendoza',   rol: 'prevencionista', telefono: '51999000007' },
  { email: 'logistica@azur.pe',    nombre: 'Diego Flores',   rol: 'logistico',      telefono: '51999000008' },
];

const h = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

// Lista existentes
const listed = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: h }).then((r) => r.json());
const existing = new Set((listed.users || []).map((u) => u.email));

for (const u of users) {
  if (existing.has(u.email)) {
    console.log('skip  ', u.email);
    continue;
  }
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nombre: u.nombre, rol: u.rol, telefono: u.telefono },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error('ERROR ', u.email, res.status, JSON.stringify(body).slice(0, 200));
  } else {
    console.log('created', u.email, '→', body.id);
  }
}
console.log('\nPassword para todos:', PASSWORD);
