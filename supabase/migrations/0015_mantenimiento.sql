-- Cronograma de servicios de mantenimiento (línea Mantenimiento, Sec. 3.6 / 7.2)
do $$ begin
  create type recurrencia_enum as enum ('unica','semanal','quincenal','mensual','trimestral','semestral');
exception when duplicate_object then null; end $$;

create table if not exists servicios_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  categoria text not null,
  descripcion text,
  fecha_planificada date not null,
  monto numeric(14,2) default 0,
  recurrencia recurrencia_enum not null default 'unica',
  dias_aviso int not null default 7,
  estado text not null default 'programado', -- programado/ejecutado/facturado/cancelado
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_servmant_proy on servicios_mantenimiento(proyecto_id, fecha_planificada);

alter table servicios_mantenimiento enable row level security;
drop policy if exists servmant_sel on servicios_mantenimiento;
create policy servmant_sel on servicios_mantenimiento for select to authenticated using (true);
drop policy if exists servmant_wr on servicios_mantenimiento;
create policy servmant_wr on servicios_mantenimiento for all to authenticated using (true) with check (true);
