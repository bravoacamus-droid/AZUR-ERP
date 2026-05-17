-- =====================================================================
-- AZUR ERP · Migration 0009 — Estructura del proyecto (etapas + partidas + cronograma)
-- =====================================================================

-- Extender proyectos con campos comerciales
alter table public.proyectos
  add column if not exists cotizacion_id   uuid references public.cotizaciones(id) on delete set null,
  add column if not exists margen_porcentaje numeric(6,2) default 0,                        -- snapshot del margen
  add column if not exists presupuesto_costo numeric(14,2) default 0,                       -- costo directo + GG (sin utilidad)
  add column if not exists presupuesto_venta numeric(14,2) default 0,                       -- subtotal cotizado al cliente
  add column if not exists adelanto_porcentaje numeric(6,2) default 0,
  add column if not exists adelanto_amortizado numeric(14,2) default 0;

create index if not exists idx_proyectos_cotizacion on public.proyectos (cotizacion_id);

-- Asociar back-ref desde cotizaciones (la columna proyecto_id existe en 0007)
alter table public.cotizaciones
  drop constraint if exists cotizaciones_proyecto_id_fkey;

alter table public.cotizaciones
  add constraint cotizaciones_proyecto_id_fkey
  foreign key (proyecto_id) references public.proyectos(id) on delete set null;

-- ---------------------------------------------------------------------
-- Etapas del proyecto
-- ---------------------------------------------------------------------
create table if not exists public.proyecto_etapas (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  codigo          text not null,                                       -- 01, 02, 03
  nombre          text not null,                                       -- "Estructuras", "Acabados", "Instalaciones"
  orden           int not null default 0,
  porcentaje_avance numeric(5,2) not null default 0 check (porcentaje_avance >= 0 and porcentaje_avance <= 100),
  fecha_inicio_plan date,
  fecha_fin_plan    date,
  fecha_inicio_real date,
  fecha_fin_real    date,
  created_at      timestamptz not null default now(),
  unique (proyecto_id, codigo)
);

create index if not exists idx_etapas_proyecto on public.proyecto_etapas (proyecto_id, orden);

drop trigger if exists audit_proyecto_etapas on public.proyecto_etapas;
create trigger audit_proyecto_etapas after insert or update or delete on public.proyecto_etapas
  for each row execute function azur.fn_audit_trigger();

-- ---------------------------------------------------------------------
-- Partidas del proyecto (puede venir desde cotización o ser agregada después)
-- ---------------------------------------------------------------------
create table if not exists public.proyecto_partidas (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  etapa_id        uuid references public.proyecto_etapas(id) on delete set null,
  parent_id       uuid references public.proyecto_partidas(id) on delete cascade,  -- subpartida si tiene parent
  codigo          text not null,
  descripcion     text not null,
  unidad          text not null references public.unidades_medida(codigo),
  metrado_contractual numeric(14,4) not null default 0 check (metrado_contractual >= 0),
  metrado_ejecutado   numeric(14,4) not null default 0 check (metrado_ejecutado >= 0),
  precio_unitario_costo numeric(14,4) not null default 0,             -- costo (sin utilidad)
  precio_unitario_venta numeric(14,4) not null default 0,             -- venta (con GG + utilidad)
  monto_contractual_costo numeric(14,2) generated always as (metrado_contractual * precio_unitario_costo) stored,
  monto_contractual_venta numeric(14,2) generated always as (metrado_contractual * precio_unitario_venta) stored,
  monto_ejecutado_costo   numeric(14,2) generated always as (metrado_ejecutado   * precio_unitario_costo) stored,
  monto_ejecutado_venta   numeric(14,2) generated always as (metrado_ejecutado   * precio_unitario_venta) stored,
  porcentaje_avance       numeric(5,2)  generated always as (
    case when metrado_contractual > 0
      then least(round((metrado_ejecutado / metrado_contractual * 100)::numeric, 2), 100)
      else 0
    end
  ) stored,
  orden           int not null default 0,
  cotizacion_partida_id uuid references public.cotizacion_partidas(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_pp_proyecto on public.proyecto_partidas (proyecto_id, orden);
create index if not exists idx_pp_etapa on public.proyecto_partidas (etapa_id);
create index if not exists idx_pp_parent on public.proyecto_partidas (parent_id);

drop trigger if exists set_updated_at_pp on public.proyecto_partidas;
create trigger set_updated_at_pp before update on public.proyecto_partidas
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_proyecto_partidas on public.proyecto_partidas;
create trigger audit_proyecto_partidas after insert or update or delete on public.proyecto_partidas
  for each row execute function azur.fn_audit_trigger();

-- ---------------------------------------------------------------------
-- Cronograma: hitos del proyecto
-- ---------------------------------------------------------------------
create table if not exists public.proyecto_hitos (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  nombre       text not null,
  fecha_plan   date not null,
  fecha_real   date,
  estado       text not null default 'pendiente' check (estado in ('pendiente','en_curso','cumplido','retrasado')),
  notas        text,
  orden        int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_hitos_proyecto on public.proyecto_hitos (proyecto_id, orden);

drop trigger if exists audit_hitos on public.proyecto_hitos;
create trigger audit_hitos after insert or update or delete on public.proyecto_hitos
  for each row execute function azur.fn_audit_trigger();

-- =====================================================================
-- RLS — proyecto_*
-- =====================================================================
alter table public.proyecto_etapas    enable row level security;
alter table public.proyecto_partidas  enable row level security;
alter table public.proyecto_hitos     enable row level security;

-- Las políticas heredan la lógica de proyectos: si puedes ver el proyecto, puedes ver sus etapas/partidas/hitos
drop policy if exists "etapas_select" on public.proyecto_etapas;
create policy "etapas_select" on public.proyecto_etapas for select to authenticated using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id)
);
drop policy if exists "etapas_modify" on public.proyecto_etapas;
create policy "etapas_modify" on public.proyecto_etapas for all to authenticated
  using (public.es_mando() or public.es_rol_in(array['comercial']::public.rol_sistema[]))
  with check (public.es_mando() or public.es_rol_in(array['comercial']::public.rol_sistema[]));

drop policy if exists "pp_select" on public.proyecto_partidas;
create policy "pp_select" on public.proyecto_partidas for select to authenticated using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id)
);
drop policy if exists "pp_modify" on public.proyecto_partidas;
create policy "pp_modify" on public.proyecto_partidas for all to authenticated
  using (public.es_mando() or public.es_rol_in(array['comercial']::public.rol_sistema[]))
  with check (public.es_mando() or public.es_rol_in(array['comercial']::public.rol_sistema[]));

drop policy if exists "hitos_select" on public.proyecto_hitos;
create policy "hitos_select" on public.proyecto_hitos for select to authenticated using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id)
);
drop policy if exists "hitos_modify" on public.proyecto_hitos;
create policy "hitos_modify" on public.proyecto_hitos for all to authenticated
  using (public.es_mando())
  with check (public.es_mando());
