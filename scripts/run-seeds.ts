/**
 * Seeds de datos de desarrollo:
 *   - Crea (o actualiza) 6 usuarios dev, uno por rol
 *   - Cada usuario está pre-confirmado (email_confirm: true)
 *   - El trigger fn_handle_new_user crea automáticamente el profile
 *   - Después se actualiza el profile con rol + nombre completo
 *
 * Uso:  pnpm db:seed
 */
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_PWD = process.env.DEV_USERS_PASSWORD || 'azur2026';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Rol =
  | 'gerencia_general'
  | 'jefe_proyectos'
  | 'jefe_presupuestos'
  | 'administrador'
  | 'comercial'
  | 'residente';

type DevUser = {
  email: string;
  password: string;
  full_name: string;
  rol: Rol;
  cargo: string;
};

export const DEV_USERS: DevUser[] = [
  {
    email: 'gerencia@azur.dev',
    password: DEV_PWD,
    full_name: 'Juan Valiente Pizarro',
    rol: 'gerencia_general',
    cargo: 'Gerente General',
  },
  {
    email: 'jefeproy@azur.dev',
    password: DEV_PWD,
    full_name: 'Carlos Mendoza Ríos',
    rol: 'jefe_proyectos',
    cargo: 'Jefe de Proyectos',
  },
  {
    email: 'jefepres@azur.dev',
    password: DEV_PWD,
    full_name: 'Lucía Quispe Torres',
    rol: 'jefe_presupuestos',
    cargo: 'Jefa de Presupuestos y Costos',
  },
  {
    email: 'admin@azur.dev',
    password: DEV_PWD,
    full_name: 'María Salazar Vega',
    rol: 'administrador',
    cargo: 'Administradora',
  },
  {
    email: 'comercial@azur.dev',
    password: DEV_PWD,
    full_name: 'Diego Paredes Núñez',
    rol: 'comercial',
    cargo: 'Ejecutivo Comercial',
  },
  {
    email: 'residente@azur.dev',
    password: DEV_PWD,
    full_name: 'Pedro Huamán Cusi',
    rol: 'residente',
    cargo: 'Residente de Obra',
  },
];

async function findUserByEmail(email: string) {
  // Supabase admin no expone búsqueda directa por email; usamos listUsers paginado
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 1000) return null;
    page++;
  }
}

async function upsertUser(user: DevUser) {
  process.stdout.write(`  · ${user.email.padEnd(24)} [${user.rol}]  `);
  const existing = await findUserByEmail(user.email);

  let userId: string;

  if (existing) {
    userId = existing.id;
    // Reset password + asegura confirmación
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, rol: user.rol },
    });
    if (error) throw error;
    process.stdout.write('actualizado · ');
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, rol: user.rol },
    });
    if (error) throw error;
    userId = data.user!.id;
    process.stdout.write('creado · ');
  }

  // El trigger fn_handle_new_user creó el profile con datos de raw_user_meta_data,
  // pero hacemos un upsert defensivo (en updates no se dispara el trigger).
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: user.email,
        full_name: user.full_name,
        rol: user.rol,
        cargo: user.cargo,
        activo: true,
      },
      { onConflict: 'id' },
    );
  if (profileError) throw profileError;

  console.log('perfil ok');
  return userId;
}

async function main() {
  console.log(`▶ Sembrando ${DEV_USERS.length} usuarios dev (password: ${DEV_PWD})`);
  for (const u of DEV_USERS) {
    await upsertUser(u);
  }
  console.log('\n✔ Usuarios dev sembrados correctamente');
  console.log('\nResumen:');
  console.table(DEV_USERS.map((u) => ({ email: u.email, rol: u.rol, nombre: u.full_name })));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
