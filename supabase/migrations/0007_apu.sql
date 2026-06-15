-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  APU detallado — desglose del costo unitario por componentes          ║
-- ║  (mano de obra, materiales, equipos, subcontratos, gastos generales)  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

do $$ begin
  create type apu_tipo as enum ('mano_obra','materiales','equipos','subcontratos','gastos_generales');
exception when duplicate_object then null; end $$;

create table if not exists apu_componentes (
  id uuid primary key default gen_random_uuid(),
  cotizacion_item_id uuid not null references cotizacion_items(id) on delete cascade,
  tipo apu_tipo not null default 'materiales',
  descripcion text not null,
  unidad text,
  cuadrilla numeric(10,4),       -- nº de personas/equipos (opcional, MO)
  rendimiento numeric(12,4),     -- rendimiento por jornada (opcional, MO)
  cantidad numeric(14,4) not null default 0,  -- cantidad por unidad de partida
  precio numeric(14,4) not null default 0,     -- precio unitario del insumo
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_apu_item on apu_componentes(cotizacion_item_id);

alter table apu_componentes enable row level security;
drop policy if exists apu_sel on apu_componentes;
create policy apu_sel on apu_componentes for select to authenticated using (es_mando());
drop policy if exists apu_wr on apu_componentes;
create policy apu_wr on apu_componentes for all to authenticated using (es_mando()) with check (es_mando());

-- marca en el ítem si su C.U. proviene de un APU detallado (C.U. de solo lectura)
alter table cotizacion_items add column if not exists tiene_apu boolean not null default false;
