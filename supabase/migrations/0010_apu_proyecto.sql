-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  APU detallado también en el itemizado de Proyectos.                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create table if not exists apu_proyecto (
  id uuid primary key default gen_random_uuid(),
  proyecto_item_id uuid not null references proyecto_items(id) on delete cascade,
  tipo apu_tipo not null default 'materiales',
  descripcion text not null,
  unidad text,
  cuadrilla numeric(10,4),
  rendimiento numeric(12,4),
  cantidad numeric(14,4) not null default 0,
  precio numeric(14,4) not null default 0,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_apuproy_item on apu_proyecto(proyecto_item_id);

alter table apu_proyecto enable row level security;
drop policy if exists apuproy_sel on apu_proyecto;
create policy apuproy_sel on apu_proyecto for select to authenticated using (true);
drop policy if exists apuproy_wr on apu_proyecto;
create policy apuproy_wr on apu_proyecto for all to authenticated using (true) with check (true);

alter table proyecto_items add column if not exists tiene_apu boolean not null default false;
