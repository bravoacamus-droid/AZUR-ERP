-- Flujo de aprobaciones: cambios de cantidad/monto (Presupuestos) y
-- reapertura de valorizaciones ya cobradas (Gerencia).
create table if not exists solicitudes_cambio (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tipo text not null,                 -- 'item_monto' | 'valorizacion_reapertura'
  rol_aprobador text not null,        -- 'presupuestos' | 'gerencia'
  referencia_id uuid,                 -- proyecto_item.id o valorizacion.id
  descripcion text not null,
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente',  -- pendiente | aprobada | rechazada
  solicitado_por uuid references profiles(id),
  solicitado_nombre text,
  resuelto_por uuid references profiles(id),
  resuelto_nombre text,
  motivo text,
  created_at timestamptz not null default now(),
  resuelto_at timestamptz
);
alter table solicitudes_cambio enable row level security;
do $$ begin
  begin create policy sc_sel on solicitudes_cambio for select to authenticated using (true); exception when duplicate_object then null; end;
  begin create policy sc_wr on solicitudes_cambio for all to authenticated using (true) with check (true); exception when duplicate_object then null; end;
end $$;
grant all on solicitudes_cambio to authenticated, service_role;

alter table valorizaciones add column if not exists reabierta boolean not null default false;

alter table solicitudes_cambio replica identity full;
do $$ begin
  begin alter publication supabase_realtime add table solicitudes_cambio; exception when duplicate_object then null; end;
end $$;
