-- Reparto manual del costo presupuestado por tipo de gasto (proyectado),
-- para el comparativo Proyectado vs Real por tipo de gasto (control financiero).
create table if not exists presupuesto_tipo_gasto (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tipo tipo_solicitud not null,
  monto_proyectado numeric(16,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (proyecto_id, tipo)
);
alter table presupuesto_tipo_gasto enable row level security;
do $$ begin
  begin create policy ptg_sel on presupuesto_tipo_gasto for select to authenticated using (true); exception when duplicate_object then null; end;
  begin create policy ptg_wr on presupuesto_tipo_gasto for all to authenticated using (true) with check (true); exception when duplicate_object then null; end;
end $$;
grant all on presupuesto_tipo_gasto to authenticated, service_role;
