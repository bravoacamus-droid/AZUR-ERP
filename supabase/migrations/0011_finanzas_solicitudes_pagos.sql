-- =====================================================================
-- AZUR ERP · Migration 0011 — Finanzas (solicitudes, aprobaciones, pagos, vouchers, cajas)
-- =====================================================================

-- Proveedores básico (catálogo para autocompletar beneficiarios)
create table if not exists public.proveedores (
  id            uuid primary key default gen_random_uuid(),
  razon_social  text not null,
  ruc           text unique,
  contacto      text,
  telefono      text,
  email         citext,
  banco         text,
  cuenta        text,
  cci           text,
  detraccion_porcentaje numeric(4,2) default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_proveedores_search on public.proveedores using gin (razon_social gin_trgm_ops);

drop trigger if exists set_updated_at_proveedores on public.proveedores;
create trigger set_updated_at_proveedores before update on public.proveedores
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_proveedores on public.proveedores;
create trigger audit_proveedores after insert or update or delete on public.proveedores
  for each row execute function azur.fn_audit_trigger();

alter table public.proveedores enable row level security;
drop policy if exists "prov_select" on public.proveedores;
create policy "prov_select" on public.proveedores for select to authenticated using (true);
drop policy if exists "prov_modify" on public.proveedores;
create policy "prov_modify" on public.proveedores for all to authenticated
  using (public.es_rol_in(array['gerencia_general','jefe_proyectos','administrador','comercial']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general','jefe_proyectos','administrador','comercial']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Solicitudes de pago
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'solicitud_categoria') then
    create type public.solicitud_categoria as enum (
      'proveedor','contratista','jornales','caja_chica','agua','alquiler_equipo','flete','servicios','otros'
    );
  end if;
end$$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'solicitud_estado') then
    create type public.solicitud_estado as enum (
      'pendiente','aprobada_jefe','rechazada','programada','pagada','cancelada'
    );
  end if;
end$$;

create table if not exists public.solicitudes_pago (
  id              uuid primary key default gen_random_uuid(),
  codigo          text unique,                                          -- SOL-YYYY-NNNN (trigger)
  proyecto_id     uuid not null references public.proyectos(id) on delete restrict,
  partida_id      uuid references public.proyecto_partidas(id) on delete set null,
  categoria       public.solicitud_categoria not null,
  concepto        text not null,
  beneficiario    text not null,                                        -- razón social o nombre
  proveedor_id    uuid references public.proveedores(id) on delete set null,
  monto           numeric(14,2) not null check (monto > 0),
  moneda          text not null default 'PEN' check (moneda in ('PEN','USD')),
  urgencia        text not null default 'normal' check (urgencia in ('baja','normal','alta','critica')),
  notas           text,
  adjunto_url     text,                                                 -- cotización/factura previa
  estado          public.solicitud_estado not null default 'pendiente',
  solicitado_por  uuid references auth.users(id) on delete set null,
  aprobada_jefe_por uuid references auth.users(id) on delete set null,
  aprobada_jefe_at  timestamptz,
  aprobada_gerencia_por uuid references auth.users(id) on delete set null,  -- doble nivel: gerencia para >umbral
  aprobada_gerencia_at  timestamptz,
  rechazada_por   uuid references auth.users(id) on delete set null,
  rechazada_at    timestamptz,
  motivo_rechazo  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_sol_estado on public.solicitudes_pago (estado);
create index if not exists idx_sol_proyecto on public.solicitudes_pago (proyecto_id);
create index if not exists idx_sol_solicitante on public.solicitudes_pago (solicitado_por);
create index if not exists idx_sol_codigo on public.solicitudes_pago (codigo);

drop trigger if exists set_updated_at_solicitudes on public.solicitudes_pago;
create trigger set_updated_at_solicitudes before update on public.solicitudes_pago
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_solicitudes on public.solicitudes_pago;
create trigger audit_solicitudes after insert or update or delete on public.solicitudes_pago
  for each row execute function azur.fn_audit_trigger();

-- Generador correlativo SOL-YYYY-NNNN
create or replace function public.fn_generar_codigo_solicitud()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_year text;
  v_max  int;
begin
  if new.codigo is not null and new.codigo <> '' then return new; end if;
  v_year := to_char(now() at time zone 'America/Lima', 'YYYY');
  select coalesce(max(substring(codigo from 10)::int), 0) into v_max
    from public.solicitudes_pago
   where codigo like 'SOL-' || v_year || '-%';
  new.codigo := 'SOL-' || v_year || '-' || lpad((v_max + 1)::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists generar_codigo_solicitud on public.solicitudes_pago;
create trigger generar_codigo_solicitud
  before insert on public.solicitudes_pago
  for each row execute function public.fn_generar_codigo_solicitud();

alter table public.solicitudes_pago enable row level security;

drop policy if exists "sol_select" on public.solicitudes_pago;
create policy "sol_select" on public.solicitudes_pago for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or solicitado_por = auth.uid()
  or public.tiene_proyecto(proyecto_id)
);

drop policy if exists "sol_insert" on public.solicitudes_pago;
create policy "sol_insert" on public.solicitudes_pago for insert to authenticated
  with check (
    public.es_mando()
    or public.es_rol_in(array['administrador','residente']::public.rol_sistema[])
  );

drop policy if exists "sol_update" on public.solicitudes_pago;
create policy "sol_update" on public.solicitudes_pago for update to authenticated using (
  public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[])
) with check (
  public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[])
);

drop policy if exists "sol_delete" on public.solicitudes_pago;
create policy "sol_delete" on public.solicitudes_pago for delete to authenticated using (
  public.es_rol_in(array['gerencia_general']::public.rol_sistema[]) and estado = 'pendiente'
);

-- ---------------------------------------------------------------------
-- Pagos (programación bancaria del administrador)
-- ---------------------------------------------------------------------
create table if not exists public.pagos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text unique,                                      -- PAG-YYYY-NNNN
  solicitud_id      uuid not null references public.solicitudes_pago(id) on delete restrict,
  monto             numeric(14,2) not null check (monto > 0),
  moneda            text not null default 'PEN' check (moneda in ('PEN','USD')),
  banco_origen      text,
  cuenta_origen     text,
  banco_destino     text,
  cuenta_destino    text,
  fecha_programada  date not null default current_date,
  fecha_ejecutado   date,
  numero_operacion  text,                                              -- nro voucher bancario
  observaciones     text,
  programado_por    uuid references auth.users(id) on delete set null,
  ejecutado_por     uuid references auth.users(id) on delete set null,
  voucher_token     text unique default replace(gen_random_uuid()::text, '-', ''),  -- URL pública
  voucher_path      text,                                              -- storage path
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_pagos_solicitud on public.pagos (solicitud_id);
create index if not exists idx_pagos_fecha on public.pagos (fecha_programada);
create index if not exists idx_pagos_token on public.pagos (voucher_token);

drop trigger if exists set_updated_at_pagos on public.pagos;
create trigger set_updated_at_pagos before update on public.pagos
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_pagos on public.pagos;
create trigger audit_pagos after insert or update or delete on public.pagos
  for each row execute function azur.fn_audit_trigger();

create or replace function public.fn_generar_codigo_pago()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_year text;
  v_max  int;
begin
  if new.codigo is not null and new.codigo <> '' then return new; end if;
  v_year := to_char(now() at time zone 'America/Lima', 'YYYY');
  select coalesce(max(substring(codigo from 10)::int), 0) into v_max
    from public.pagos where codigo like 'PAG-' || v_year || '-%';
  new.codigo := 'PAG-' || v_year || '-' || lpad((v_max + 1)::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists generar_codigo_pago on public.pagos;
create trigger generar_codigo_pago before insert on public.pagos
  for each row execute function public.fn_generar_codigo_pago();

alter table public.pagos enable row level security;

drop policy if exists "pagos_select" on public.pagos;
create policy "pagos_select" on public.pagos for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or exists (select 1 from public.solicitudes_pago s where s.id = solicitud_id and s.solicitado_por = auth.uid())
);

drop policy if exists "pagos_modify" on public.pagos;
create policy "pagos_modify" on public.pagos for all to authenticated
  using (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]))
  with check (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Cajas (chica por proyecto + central)
-- ---------------------------------------------------------------------
create table if not exists public.cajas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  tipo          text not null check (tipo in ('central','proyecto')),
  proyecto_id   uuid references public.proyectos(id) on delete cascade,  -- null para central
  moneda        text not null default 'PEN' check (moneda in ('PEN','USD')),
  saldo_inicial numeric(14,2) not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (proyecto_id, moneda)
);

create table if not exists public.caja_movimientos (
  id              uuid primary key default gen_random_uuid(),
  caja_id         uuid not null references public.cajas(id) on delete cascade,
  tipo            text not null check (tipo in ('entrada','salida','traslado_in','traslado_out')),
  fecha           date not null default current_date,
  concepto        text not null,
  monto           numeric(14,2) not null check (monto > 0),
  referencia      text,                                                 -- nro voucher, pago_id, etc
  pago_id         uuid references public.pagos(id) on delete set null,
  registrado_por  uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_caja_mov_caja on public.caja_movimientos (caja_id, fecha desc);
create index if not exists idx_caja_mov_pago on public.caja_movimientos (pago_id);

drop trigger if exists audit_caja_mov on public.caja_movimientos;
create trigger audit_caja_mov after insert or update or delete on public.caja_movimientos
  for each row execute function azur.fn_audit_trigger();

alter table public.cajas enable row level security;
alter table public.caja_movimientos enable row level security;

drop policy if exists "cajas_select" on public.cajas;
create policy "cajas_select" on public.cajas for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or (proyecto_id is not null and public.tiene_proyecto(proyecto_id))
);
drop policy if exists "cajas_modify" on public.cajas;
create policy "cajas_modify" on public.cajas for all to authenticated
  using (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]))
  with check (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]));

drop policy if exists "caja_mov_select" on public.caja_movimientos;
create policy "caja_mov_select" on public.caja_movimientos for select to authenticated using (
  exists (
    select 1 from public.cajas c
    where c.id = caja_id and (
      public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[])
      or (c.proyecto_id is not null and public.tiene_proyecto(c.proyecto_id))
    )
  )
);
drop policy if exists "caja_mov_modify" on public.caja_movimientos;
create policy "caja_mov_modify" on public.caja_movimientos for all to authenticated
  using (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]))
  with check (public.es_mando() or public.es_rol_in(array['administrador']::public.rol_sistema[]));

-- ---------------------------------------------------------------------
-- Vista de saldos de cajas
-- ---------------------------------------------------------------------
create or replace view public.v_cajas_saldos as
  select
    c.id, c.nombre, c.tipo, c.proyecto_id, c.moneda, c.saldo_inicial,
    coalesce(sum(case when cm.tipo in ('entrada','traslado_in')  then cm.monto end), 0) as entradas,
    coalesce(sum(case when cm.tipo in ('salida','traslado_out') then cm.monto end), 0) as salidas,
    c.saldo_inicial
      + coalesce(sum(case when cm.tipo in ('entrada','traslado_in')  then cm.monto end), 0)
      - coalesce(sum(case when cm.tipo in ('salida','traslado_out') then cm.monto end), 0) as saldo_actual
  from public.cajas c
  left join public.caja_movimientos cm on cm.caja_id = c.id
  group by c.id;
