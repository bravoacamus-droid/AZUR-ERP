-- =====================================================================
-- AZUR ERP · Migration 0007 — Cotizaciones (header + partidas + APU snapshot)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Clientes (catálogo simple, ampliable después)
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id            uuid primary key default gen_random_uuid(),
  razon_social  text not null,
  nombre_comercial text,
  ruc           text unique,
  contacto      text,
  email         citext,
  telefono      text,
  direccion     text,
  notas         text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_clientes_search on public.clientes using gin (razon_social gin_trgm_ops);

drop trigger if exists set_updated_at_clientes on public.clientes;
create trigger set_updated_at_clientes before update on public.clientes
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_clientes on public.clientes;
create trigger audit_clientes after insert or update or delete on public.clientes
  for each row execute function azur.fn_audit_trigger();

alter table public.clientes enable row level security;
drop policy if exists "clientes_select" on public.clientes;
create policy "clientes_select" on public.clientes for select to authenticated using (true);
drop policy if exists "clientes_modify" on public.clientes;
create policy "clientes_modify" on public.clientes for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial','administrador']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial','administrador']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cotizacion_estado') then
    create type public.cotizacion_estado as enum ('borrador','enviada','en_negociacion','aprobada','rechazada');
  end if;
end$$;

create table if not exists public.cotizaciones (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text unique,                                -- generado por trigger antes de insert
  cliente_id         uuid references public.clientes(id) on delete restrict,
  titulo             text not null,
  descripcion        text,
  ubicacion          text,
  estado             public.cotizacion_estado not null default 'borrador',
  fecha_emision      date not null default current_date,
  validez_dias       int  not null default 15 check (validez_dias > 0),
  moneda             text not null default 'PEN' check (moneda in ('PEN','USD')),
  margen_porcentaje  numeric(6,2) not null default 10 check (margen_porcentaje >= 0 and margen_porcentaje <= 200),  -- utilidad %
  gastos_generales_porcentaje numeric(6,2) not null default 8 check (gastos_generales_porcentaje >= 0),              -- GG %
  igv_porcentaje     numeric(6,2) not null default 18 check (igv_porcentaje >= 0),
  notas              text,
  terminos           text,
  created_by         uuid references auth.users(id) on delete set null,
  enviado_at         timestamptz,
  aprobado_at        timestamptz,
  rechazado_at       timestamptz,
  proyecto_id        uuid,                                                    -- se enlaza cuando aprobada
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_cotizaciones_estado on public.cotizaciones (estado);
create index if not exists idx_cotizaciones_cliente on public.cotizaciones (cliente_id);
create index if not exists idx_cotizaciones_search on public.cotizaciones using gin (titulo gin_trgm_ops);

drop trigger if exists set_updated_at_cotizaciones on public.cotizaciones;
create trigger set_updated_at_cotizaciones before update on public.cotizaciones
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_cotizaciones on public.cotizaciones;
create trigger audit_cotizaciones after insert or update or delete on public.cotizaciones
  for each row execute function azur.fn_audit_trigger();

-- Generador de correlativos COT-YYYY-NNNN basado en max() del año actual (Lima)
create or replace function public.fn_generar_codigo_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_year text;
  v_max  int;
begin
  if new.codigo is not null and new.codigo <> '' then
    return new;
  end if;
  v_year := to_char(now() at time zone 'America/Lima', 'YYYY');
  select coalesce(max(substring(codigo from 10)::int), 0)
    into v_max
    from public.cotizaciones
   where codigo like 'COT-' || v_year || '-%';
  new.codigo := 'COT-' || v_year || '-' || lpad((v_max + 1)::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists generar_codigo_cotizacion on public.cotizaciones;
create trigger generar_codigo_cotizacion
  before insert on public.cotizaciones
  for each row execute function public.fn_generar_codigo_cotizacion();

-- ---------------------------------------------------------------------
-- Partidas de la cotización (snapshot — independientes del catálogo maestro)
-- ---------------------------------------------------------------------
create table if not exists public.cotizacion_partidas (
  id                 uuid primary key default gen_random_uuid(),
  cotizacion_id      uuid not null references public.cotizaciones(id) on delete cascade,
  codigo             text not null,                           -- p.ej. 01.01.01
  descripcion        text not null,
  unidad             text not null references public.unidades_medida(codigo),
  cantidad           numeric(14,4) not null check (cantidad >= 0),
  precio_unitario    numeric(14,4) not null default 0 check (precio_unitario >= 0),  -- costo directo (suma APU)
  parcial            numeric(14,4) generated always as (cantidad * precio_unitario) stored,
  partida_maestra_id uuid references public.partidas_maestras(id) on delete set null,
  orden              int not null default 0,
  notas              text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_cot_partidas_cotizacion on public.cotizacion_partidas (cotizacion_id, orden);

alter table public.cotizacion_partidas enable row level security;

-- ---------------------------------------------------------------------
-- APU snapshot por cotización (independiente del catálogo)
-- ---------------------------------------------------------------------
create table if not exists public.cotizacion_apu (
  id                  uuid primary key default gen_random_uuid(),
  cotizacion_partida_id uuid not null references public.cotizacion_partidas(id) on delete cascade,
  insumo_id           uuid references public.insumos_maestros(id) on delete set null,
  descripcion         text not null,                           -- snapshot (sobrevive si cambia el maestro)
  categoria           public.insumo_categoria not null,
  unidad              text not null references public.unidades_medida(codigo),
  cantidad            numeric(14,6) not null check (cantidad >= 0),
  precio_unit         numeric(14,4) not null check (precio_unit >= 0),
  parcial             numeric(14,4) generated always as (cantidad * precio_unit) stored,
  orden               int not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists idx_cot_apu_partida on public.cotizacion_apu (cotizacion_partida_id, orden);

alter table public.cotizacion_apu enable row level security;

-- ---------------------------------------------------------------------
-- RLS — cotizaciones
-- ---------------------------------------------------------------------
alter table public.cotizaciones enable row level security;

drop policy if exists "cotizaciones_select" on public.cotizaciones;
create policy "cotizaciones_select" on public.cotizaciones for select to authenticated
  using (
    public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[])
    or created_by = auth.uid()
  );

drop policy if exists "cotizaciones_insert" on public.cotizaciones;
create policy "cotizaciones_insert" on public.cotizaciones for insert to authenticated
  with check (
    public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[])
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "cotizaciones_update" on public.cotizaciones;
create policy "cotizaciones_update" on public.cotizaciones for update to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

drop policy if exists "cotizaciones_delete" on public.cotizaciones;
create policy "cotizaciones_delete" on public.cotizaciones for delete to authenticated
  using (
    public.es_rol_in(array['gerencia_general','jefe_presupuestos']::public.rol_sistema[])
    and estado = 'borrador'
  );

-- cotizacion_partidas hereda permisos del header
drop policy if exists "cot_partidas_select" on public.cotizacion_partidas;
create policy "cot_partidas_select" on public.cotizacion_partidas for select to authenticated
  using (exists (select 1 from public.cotizaciones c where c.id = cotizacion_id));

drop policy if exists "cot_partidas_modify" on public.cotizacion_partidas;
create policy "cot_partidas_modify" on public.cotizacion_partidas for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

drop policy if exists "cot_apu_select" on public.cotizacion_apu;
create policy "cot_apu_select" on public.cotizacion_apu for select to authenticated
  using (exists (select 1 from public.cotizacion_partidas where id = cotizacion_partida_id));

drop policy if exists "cot_apu_modify" on public.cotizacion_apu;
create policy "cot_apu_modify" on public.cotizacion_apu for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_presupuestos','comercial']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Vista de totales por cotización (suma costos + GG + utilidad + IGV)
-- ---------------------------------------------------------------------
create or replace view public.v_cotizacion_totales as
  select
    c.id,
    c.codigo,
    c.titulo,
    c.estado,
    c.moneda,
    c.margen_porcentaje,
    c.gastos_generales_porcentaje,
    c.igv_porcentaje,
    coalesce(sum(cp.parcial), 0) as costo_directo,
    round(coalesce(sum(cp.parcial), 0) * (c.gastos_generales_porcentaje / 100.0), 2) as gastos_generales,
    round(coalesce(sum(cp.parcial), 0) * (c.margen_porcentaje / 100.0), 2) as utilidad,
    round(
      coalesce(sum(cp.parcial), 0) *
      (1 + c.gastos_generales_porcentaje / 100.0 + c.margen_porcentaje / 100.0),
      2
    ) as subtotal,
    round(
      coalesce(sum(cp.parcial), 0) *
      (1 + c.gastos_generales_porcentaje / 100.0 + c.margen_porcentaje / 100.0) *
      (c.igv_porcentaje / 100.0),
      2
    ) as igv,
    round(
      coalesce(sum(cp.parcial), 0) *
      (1 + c.gastos_generales_porcentaje / 100.0 + c.margen_porcentaje / 100.0) *
      (1 + c.igv_porcentaje / 100.0),
      2
    ) as total
  from public.cotizaciones c
  left join public.cotizacion_partidas cp on cp.cotizacion_id = c.id
  group by c.id;
