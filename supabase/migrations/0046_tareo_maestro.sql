-- Maestro de trabajadores (jornaleros) + tareo con horas extra, tarifa y flujo
-- de aprobación (residente → jefe de proyectos → finanzas).

create table if not exists trabajadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text,                 -- DNI/CE opcional
  especialidad text,              -- operario, oficial, peón, etc. (opcional)
  tarifa_dia numeric(10,2) not null default 0, -- jornal diario (editable por admin/gerencia)
  recurrente boolean not null default false,   -- aparece en la lista rápida
  activo boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_trabajadores_activo on trabajadores(activo);

-- Tareo: se enlaza al maestro (o queda como texto libre), horas normales + extra,
-- tarifa del día (snapshot) y estado del flujo de aprobación.
alter table tareo add column if not exists trabajador_id uuid references trabajadores(id);
alter table tareo add column if not exists horas_extra numeric(5,2);
alter table tareo add column if not exists tarifa_dia numeric(10,2);
alter table tareo add column if not exists estado text not null default 'registrado'; -- registrado|enviado|aprobado|pagado
alter table tareo add column if not exists revisado_by uuid references profiles(id);
alter table tareo add column if not exists revisado_at timestamptz;
create index if not exists idx_tareo_estado on tareo(proyecto_id, estado, fecha);
create index if not exists idx_tareo_trabajador on tareo(trabajador_id);
