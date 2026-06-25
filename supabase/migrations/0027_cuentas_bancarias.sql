-- Múltiples cuentas bancarias por proveedor/contratista o cliente.
create table if not exists cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  contraparte_id uuid references contrapartes(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  banco text not null,
  cuenta text,
  cci text,
  moneda text not null default 'PEN',
  es_detraccion boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_ctas_contraparte on cuentas_bancarias(contraparte_id);
create index if not exists idx_ctas_cliente on cuentas_bancarias(cliente_id);
alter table cuentas_bancarias enable row level security;
do $$ begin
  begin create policy ctas_sel on cuentas_bancarias for select to authenticated using (true); exception when duplicate_object then null; end;
  begin create policy ctas_wr on cuentas_bancarias for all to authenticated using (true) with check (true); exception when duplicate_object then null; end;
end $$;
grant all on cuentas_bancarias to authenticated, service_role;
