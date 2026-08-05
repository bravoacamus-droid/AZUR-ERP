-- Categorías de gasto configurables (admin/gerencia). Cada una se agrupa en uno
-- de los 5 "tipo" base (para no romper Finanzas/Reportes/Presupuesto).
create table if not exists categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_base tipo_solicitud not null default 'servicios',
  activo boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_categorias_activo on categorias_gasto(activo);

-- Etiqueta de categoría específica elegida en la solicitud (además del tipo base).
alter table solicitudes_pago add column if not exists categoria text;

-- Maestro de proveedores: validación del administrador (alta por el residente).
alter table contrapartes add column if not exists validado boolean not null default true;
alter table contrapartes add column if not exists created_by uuid references profiles(id);
