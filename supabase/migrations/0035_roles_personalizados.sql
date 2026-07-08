-- Roles personalizados: nombre libre + mapa de permisos por módulo
-- (cada módulo => 'none' | 'ver' | 'editar'). Los 8 roles base siguen vigentes;
-- si un usuario tiene rol_personalizado_id, ese rol define sus permisos.
create table if not exists roles_personalizados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  permisos jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists rol_personalizado_id uuid references roles_personalizados(id) on delete set null;

alter table roles_personalizados enable row level security;

-- Lectura: cualquier usuario autenticado (necesario para resolver permisos en sesión).
do $$ begin
  create policy roles_pers_select on roles_personalizados for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
