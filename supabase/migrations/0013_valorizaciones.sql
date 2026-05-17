-- =====================================================================
-- AZUR ERP · Migration 0013 — Valorizaciones quincenales + adicionales/deductivos
-- =====================================================================

-- ---------------------------------------------------------------------
-- Valorizaciones (header)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'valorizacion_estado') then
    create type public.valorizacion_estado as enum ('borrador','enviada','aprobada','pagada','rechazada');
  end if;
end$$;

create table if not exists public.valorizaciones (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text unique,                                    -- VAL-YYYY-NNNN (trigger)
  proyecto_id         uuid not null references public.proyectos(id) on delete cascade,
  numero              int not null,                                   -- correlativo dentro del proyecto
  periodo_inicio      date not null,
  periodo_fin         date not null check (periodo_fin >= periodo_inicio),
  estado              public.valorizacion_estado not null default 'borrador',
  notas               text,
  amortizacion_adelanto numeric(14,2) not null default 0 check (amortizacion_adelanto >= 0),
  retencion_porcentaje  numeric(5,2)  not null default 10 check (retencion_porcentaje >= 0 and retencion_porcentaje <= 100),
  igv_porcentaje      numeric(5,2)  not null default 18,
  created_by          uuid references auth.users(id) on delete set null,
  enviada_at          timestamptz,
  aprobada_at         timestamptz,
  pagada_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (proyecto_id, numero)
);

create index if not exists idx_val_proyecto on public.valorizaciones (proyecto_id, numero desc);
create index if not exists idx_val_estado on public.valorizaciones (estado);

drop trigger if exists set_updated_at_val on public.valorizaciones;
create trigger set_updated_at_val before update on public.valorizaciones
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_val on public.valorizaciones;
create trigger audit_val after insert or update or delete on public.valorizaciones
  for each row execute function azur.fn_audit_trigger();

create or replace function public.fn_generar_codigo_valorizacion()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_year text;
  v_max  int;
begin
  if new.codigo is not null and new.codigo <> '' then return new; end if;
  v_year := to_char(now() at time zone 'America/Lima', 'YYYY');
  select coalesce(max(substring(codigo from 10)::int), 0) into v_max
    from public.valorizaciones where codigo like 'VAL-' || v_year || '-%';
  new.codigo := 'VAL-' || v_year || '-' || lpad((v_max + 1)::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists generar_codigo_val on public.valorizaciones;
create trigger generar_codigo_val before insert on public.valorizaciones
  for each row execute function public.fn_generar_codigo_valorizacion();

-- ---------------------------------------------------------------------
-- Detalle de la valorización por partida
-- ---------------------------------------------------------------------
create table if not exists public.valorizacion_partidas (
  id                   uuid primary key default gen_random_uuid(),
  valorizacion_id      uuid not null references public.valorizaciones(id) on delete cascade,
  partida_id           uuid not null references public.proyecto_partidas(id) on delete restrict,
  metrado_contractual  numeric(14,4) not null,                       -- snapshot al momento
  metrado_anterior     numeric(14,4) not null default 0,             -- acumulado de val anteriores
  metrado_periodo      numeric(14,4) not null default 0 check (metrado_periodo >= 0),
  metrado_acumulado    numeric(14,4) generated always as (metrado_anterior + metrado_periodo) stored,
  precio_unitario      numeric(14,4) not null,                       -- snapshot precio venta
  monto_periodo        numeric(14,2) generated always as (metrado_periodo * precio_unitario) stored,
  monto_acumulado      numeric(14,2) generated always as ((metrado_anterior + metrado_periodo) * precio_unitario) stored,
  porcentaje_periodo   numeric(5,2)  generated always as (
    case when metrado_contractual > 0
      then least(round((metrado_periodo / metrado_contractual * 100)::numeric, 2), 100)
      else 0 end
  ) stored,
  porcentaje_acumulado numeric(5,2)  generated always as (
    case when metrado_contractual > 0
      then least(round(((metrado_anterior + metrado_periodo) / metrado_contractual * 100)::numeric, 2), 100)
      else 0 end
  ) stored,
  orden                int not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists idx_vp_val on public.valorizacion_partidas (valorizacion_id, orden);

alter table public.valorizaciones        enable row level security;
alter table public.valorizacion_partidas enable row level security;

drop policy if exists "val_select" on public.valorizaciones;
create policy "val_select" on public.valorizaciones for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "val_modify" on public.valorizaciones;
create policy "val_modify" on public.valorizaciones for all to authenticated
  using (public.es_mando())
  with check (public.es_mando());

drop policy if exists "vp_select" on public.valorizacion_partidas;
create policy "vp_select" on public.valorizacion_partidas for select to authenticated using (
  exists (select 1 from public.valorizaciones v where v.id = valorizacion_id)
);
drop policy if exists "vp_modify" on public.valorizacion_partidas;
create policy "vp_modify" on public.valorizacion_partidas for all to authenticated
  using (public.es_mando())
  with check (public.es_mando());

-- ---------------------------------------------------------------------
-- Adicionales y Deductivos
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'addtype') then
    create type public.addtype as enum ('adicional','deductivo');
  end if;
end$$;

create table if not exists public.adicionales_deductivos (
  id            uuid primary key default gen_random_uuid(),
  codigo        text unique,
  proyecto_id   uuid not null references public.proyectos(id) on delete cascade,
  tipo          public.addtype not null,
  numero        int not null,
  descripcion   text not null,
  sustento      text,
  monto         numeric(14,2) not null check (monto > 0),
  fecha         date not null default current_date,
  aprobado      boolean not null default false,
  aprobado_por  uuid references auth.users(id) on delete set null,
  aprobado_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (proyecto_id, tipo, numero)
);

drop trigger if exists audit_addded on public.adicionales_deductivos;
create trigger audit_addded after insert or update or delete on public.adicionales_deductivos
  for each row execute function azur.fn_audit_trigger();

alter table public.adicionales_deductivos enable row level security;
drop policy if exists "add_select" on public.adicionales_deductivos;
create policy "add_select" on public.adicionales_deductivos for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "add_modify" on public.adicionales_deductivos;
create policy "add_modify" on public.adicionales_deductivos for all to authenticated
  using (public.es_mando())
  with check (public.es_mando());

-- =====================================================================
-- FUNCIÓN: generar valorización desde el avance actual del proyecto
-- =====================================================================
create or replace function public.fn_generar_valorizacion(
  p_proyecto_id uuid,
  p_periodo_inicio date,
  p_periodo_fin date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_numero  int;
  v_val_id  uuid;
  v_count   int;
begin
  if p_periodo_fin < p_periodo_inicio then
    raise exception 'Periodo inválido';
  end if;

  -- Siguiente número
  select coalesce(max(numero), 0) + 1 into v_numero
    from public.valorizaciones
   where proyecto_id = p_proyecto_id;

  insert into public.valorizaciones (
    proyecto_id, numero, periodo_inicio, periodo_fin,
    estado, created_by
  ) values (
    p_proyecto_id, v_numero, p_periodo_inicio, p_periodo_fin,
    'borrador', auth.uid()
  )
  returning id into v_val_id;

  -- Snapshot de partidas: metrado_periodo = (ejecutado - acumulado_anterior)
  -- Acumulado anterior = suma de metrado_periodo de valorizaciones anteriores
  with anteriores as (
    select vp.partida_id, coalesce(sum(vp.metrado_periodo), 0) as acumulado
      from public.valorizacion_partidas vp
      join public.valorizaciones v on v.id = vp.valorizacion_id
     where v.proyecto_id = p_proyecto_id
       and v.numero < v_numero
       and v.estado <> 'rechazada'
     group by vp.partida_id
  )
  insert into public.valorizacion_partidas (
    valorizacion_id, partida_id, metrado_contractual,
    metrado_anterior, metrado_periodo, precio_unitario, orden
  )
  select
    v_val_id,
    pp.id,
    pp.metrado_contractual,
    coalesce(a.acumulado, 0),
    greatest(pp.metrado_ejecutado - coalesce(a.acumulado, 0), 0),
    pp.precio_unitario_venta,
    pp.orden
  from public.proyecto_partidas pp
  left join anteriores a on a.partida_id = pp.id
  where pp.proyecto_id = p_proyecto_id
  order by pp.orden;

  get diagnostics v_count = row_count;
  raise notice 'Valorización % generada con % partidas', v_numero, v_count;

  return v_val_id;
end;
$$;

grant execute on function public.fn_generar_valorizacion(uuid, date, date) to authenticated;

-- =====================================================================
-- Vista: Curva S por proyecto (planificado vs ejecutado acumulado)
-- =====================================================================
create or replace view public.v_curva_s as
  select
    v.proyecto_id,
    v.periodo_fin as fecha,
    v.numero as periodo,
    sum(vp.monto_periodo) as monto_periodo,
    sum(sum(vp.monto_periodo)) over (
      partition by v.proyecto_id order by v.numero
    ) as monto_acumulado
  from public.valorizaciones v
  join public.valorizacion_partidas vp on vp.valorizacion_id = v.id
  where v.estado <> 'rechazada'
  group by v.proyecto_id, v.numero, v.periodo_fin
  order by v.proyecto_id, v.numero;

-- Vista: resumen de valorización con totales
create or replace view public.v_valorizacion_totales as
  select
    v.id,
    v.codigo,
    v.proyecto_id,
    v.numero,
    v.periodo_inicio,
    v.periodo_fin,
    v.estado,
    v.amortizacion_adelanto,
    v.retencion_porcentaje,
    v.igv_porcentaje,
    coalesce(sum(vp.monto_periodo), 0)  as monto_periodo,
    coalesce(sum(vp.monto_acumulado), 0) as monto_acumulado,
    round(coalesce(sum(vp.monto_periodo), 0) * (v.retencion_porcentaje / 100.0), 2) as retencion,
    round(
      (coalesce(sum(vp.monto_periodo), 0)
       - coalesce(sum(vp.monto_periodo), 0) * (v.retencion_porcentaje / 100.0)
       - v.amortizacion_adelanto)
      * (v.igv_porcentaje / 100.0),
      2
    ) as igv,
    round(
      (coalesce(sum(vp.monto_periodo), 0)
       - coalesce(sum(vp.monto_periodo), 0) * (v.retencion_porcentaje / 100.0)
       - v.amortizacion_adelanto)
      * (1 + v.igv_porcentaje / 100.0),
      2
    ) as monto_a_pagar
  from public.valorizaciones v
  left join public.valorizacion_partidas vp on vp.valorizacion_id = v.id
  group by v.id;
