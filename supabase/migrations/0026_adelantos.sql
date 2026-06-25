-- Adelantos adicionales/extraordinarios (además del adelanto contractual por %).
-- Se diluyen proporcionalmente en cada valorización junto con el adelanto del contrato.
create table if not exists adelantos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  concepto text not null,
  tipo text not null default 'extraordinario',  -- 'adicional' | 'extraordinario'
  monto numeric(16,2) not null default 0,
  fecha date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
alter table adelantos enable row level security;
do $$ begin
  begin create policy adel_sel on adelantos for select to authenticated using (true); exception when duplicate_object then null; end;
  begin create policy adel_wr on adelantos for all to authenticated using (true) with check (true); exception when duplicate_object then null; end;
end $$;
grant all on adelantos to authenticated, service_role;
