-- =====================================================================
-- AZUR ERP · Migration 0006 — Catálogo maestro Comercial (insumos, partidas, cuadrillas)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Unidades de medida (catálogo controlado, sembrado con las del sector)
-- ---------------------------------------------------------------------
create table if not exists public.unidades_medida (
  codigo      text primary key,         -- m, m2, m3, kg, glb, und, hh, hm, día, etc.
  nombre      text not null,
  tipo        text not null check (tipo in ('longitud','area','volumen','peso','tiempo','unidad','otros'))
);

insert into public.unidades_medida (codigo, nombre, tipo) values
  ('m',    'Metro',             'longitud'),
  ('m2',   'Metro cuadrado',    'area'),
  ('m3',   'Metro cúbico',      'volumen'),
  ('kg',   'Kilogramo',         'peso'),
  ('ton',  'Tonelada',          'peso'),
  ('lt',   'Litro',             'volumen'),
  ('gal',  'Galón',             'volumen'),
  ('und',  'Unidad',            'unidad'),
  ('glb',  'Global',            'unidad'),
  ('pie2', 'Pie cuadrado',      'area'),
  ('p2',   'Pie cuadrado (madera)', 'area'),
  ('hh',   'Hora-Hombre',       'tiempo'),
  ('hm',   'Hora-Máquina',      'tiempo'),
  ('día',  'Día',               'tiempo'),
  ('mes',  'Mes',               'tiempo'),
  ('bls',  'Bolsa',             'unidad'),
  ('rll',  'Rollo',             'unidad'),
  ('par',  'Par',               'unidad')
on conflict (codigo) do update
  set nombre = excluded.nombre, tipo = excluded.tipo;

alter table public.unidades_medida enable row level security;
drop policy if exists "unidades_select_auth" on public.unidades_medida;
create policy "unidades_select_auth" on public.unidades_medida
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- Categorías de insumos (mano de obra, materiales, equipos, gastos generales)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'insumo_categoria') then
    create type public.insumo_categoria as enum ('mano_obra','material','equipo','subcontrato','transporte','gasto_general');
  end if;
end$$;

-- ---------------------------------------------------------------------
-- Insumos maestros
-- ---------------------------------------------------------------------
create table if not exists public.insumos_maestros (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,                            -- INS-MAT-0001
  descripcion   text not null,
  categoria     public.insumo_categoria not null,
  unidad        text not null references public.unidades_medida(codigo),
  precio_unit   numeric(14,4) not null default 0,
  moneda        text not null default 'PEN' check (moneda in ('PEN','USD')),
  notas         text,
  activo        boolean not null default true,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_insumos_categoria on public.insumos_maestros (categoria) where activo;
create index if not exists idx_insumos_search on public.insumos_maestros using gin (descripcion gin_trgm_ops);

drop trigger if exists set_updated_at_insumos on public.insumos_maestros;
create trigger set_updated_at_insumos before update on public.insumos_maestros
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_insumos on public.insumos_maestros;
create trigger audit_insumos after insert or update or delete on public.insumos_maestros
  for each row execute function azur.fn_audit_trigger();

alter table public.insumos_maestros enable row level security;

drop policy if exists "insumos_select_auth" on public.insumos_maestros;
create policy "insumos_select_auth" on public.insumos_maestros
  for select to authenticated using (true);

drop policy if exists "insumos_modify_comercial" on public.insumos_maestros;
create policy "insumos_modify_comercial" on public.insumos_maestros
  for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Cuadrillas y rendimientos (cuántas hh/día rinde una cuadrilla en una partida)
-- ---------------------------------------------------------------------
create table if not exists public.cuadrillas (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,
  nombre        text not null,
  descripcion   text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.cuadrilla_componentes (
  cuadrilla_id  uuid not null references public.cuadrillas(id) on delete cascade,
  insumo_id     uuid not null references public.insumos_maestros(id) on delete cascade,  -- insumo categoria=mano_obra
  cantidad      numeric(8,4) not null default 1 check (cantidad > 0),                    -- nro de operarios/peones
  primary key (cuadrilla_id, insumo_id)
);

alter table public.cuadrillas enable row level security;
alter table public.cuadrilla_componentes enable row level security;

drop policy if exists "cuadrillas_select" on public.cuadrillas;
create policy "cuadrillas_select" on public.cuadrillas for select to authenticated using (true);
drop policy if exists "cuadrillas_modify" on public.cuadrillas;
create policy "cuadrillas_modify" on public.cuadrillas for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

drop policy if exists "cuadrilla_comp_select" on public.cuadrilla_componentes;
create policy "cuadrilla_comp_select" on public.cuadrilla_componentes for select to authenticated using (true);
drop policy if exists "cuadrilla_comp_modify" on public.cuadrilla_componentes;
create policy "cuadrilla_comp_modify" on public.cuadrilla_componentes for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Partidas maestras (catálogo reusable de partidas — opcional al cotizar)
-- ---------------------------------------------------------------------
create table if not exists public.partidas_maestras (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,            -- 01.01.01 (ej. obras provisionales)
  descripcion   text not null,
  unidad        text not null references public.unidades_medida(codigo),
  cuadrilla_id  uuid references public.cuadrillas(id) on delete set null,
  rendimiento   numeric(10,4),                   -- unidades por día (m2/día, m3/día, etc.)
  notas         text,
  activo        boolean not null default true,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_partidas_codigo on public.partidas_maestras (codigo);
create index if not exists idx_partidas_search on public.partidas_maestras using gin (descripcion gin_trgm_ops);

drop trigger if exists set_updated_at_partidas on public.partidas_maestras;
create trigger set_updated_at_partidas before update on public.partidas_maestras
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_partidas on public.partidas_maestras;
create trigger audit_partidas after insert or update or delete on public.partidas_maestras
  for each row execute function azur.fn_audit_trigger();

alter table public.partidas_maestras enable row level security;

drop policy if exists "partidas_select_auth" on public.partidas_maestras;
create policy "partidas_select_auth" on public.partidas_maestras for select to authenticated using (true);

drop policy if exists "partidas_modify" on public.partidas_maestras;
create policy "partidas_modify" on public.partidas_maestras for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- APU maestro: componentes de la partida maestra
-- ---------------------------------------------------------------------
create table if not exists public.partida_apu_componentes (
  id            uuid primary key default gen_random_uuid(),
  partida_id    uuid not null references public.partidas_maestras(id) on delete cascade,
  insumo_id     uuid not null references public.insumos_maestros(id) on delete restrict,
  cantidad      numeric(14,6) not null check (cantidad >= 0),
  precio_unit   numeric(14,4) not null check (precio_unit >= 0),  -- snapshot al momento de armar (puede diferir del maestro)
  parcial       numeric(14,4) generated always as (cantidad * precio_unit) stored,
  orden         int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_apu_componentes_partida on public.partida_apu_componentes (partida_id, orden);

alter table public.partida_apu_componentes enable row level security;
drop policy if exists "apu_select" on public.partida_apu_componentes;
create policy "apu_select" on public.partida_apu_componentes for select to authenticated using (true);
drop policy if exists "apu_modify" on public.partida_apu_componentes;
create policy "apu_modify" on public.partida_apu_componentes for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));
