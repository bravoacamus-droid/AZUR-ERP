-- =====================================================================
-- AZUR ERP · Migration 0012 — PWA de campo (GPS, RDO, evidencias, push)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Asistencias GPS (check-in / check-out)
-- ---------------------------------------------------------------------
create table if not exists public.asistencias_gps (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  proyecto_id       uuid not null references public.proyectos(id) on delete cascade,
  tipo              text not null check (tipo in ('checkin','checkout')),
  fecha             date not null default current_date,
  hora              timestamptz not null default now(),
  latitud           numeric(10,7) not null,
  longitud          numeric(10,7) not null,
  precision_metros  numeric(8,2),
  distancia_obra_m  numeric(10,2),                                 -- distancia al centroide del proyecto
  dentro_geofence   boolean,
  observaciones     text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_asist_user_fecha on public.asistencias_gps (user_id, fecha desc);
create index if not exists idx_asist_proyecto_fecha on public.asistencias_gps (proyecto_id, fecha desc);

drop trigger if exists audit_asist on public.asistencias_gps;
create trigger audit_asist after insert or update or delete on public.asistencias_gps
  for each row execute function azur.fn_audit_trigger();

alter table public.asistencias_gps enable row level security;

drop policy if exists "asist_select" on public.asistencias_gps;
create policy "asist_select" on public.asistencias_gps for select to authenticated using (
  user_id = auth.uid()
  or public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
);

drop policy if exists "asist_insert_self" on public.asistencias_gps;
create policy "asist_insert_self" on public.asistencias_gps for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Reporte Diario de Obra (RDO)
-- ---------------------------------------------------------------------
create table if not exists public.rdo_partes (
  id            uuid primary key default gen_random_uuid(),
  codigo        text unique,                                       -- RDO-YYYY-NNNN
  proyecto_id   uuid not null references public.proyectos(id) on delete cascade,
  fecha         date not null default current_date,
  clima         text check (clima in ('soleado','nublado','lluvioso','tormenta','nuboso')),
  temperatura_c numeric(4,1),
  resumen       text,
  observaciones text,
  incidencias   text,
  personal_total int default 0,
  reportado_por uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (proyecto_id, fecha)                                       -- 1 parte diario por proyecto/día
);

create index if not exists idx_rdo_proyecto on public.rdo_partes (proyecto_id, fecha desc);

drop trigger if exists set_updated_at_rdo on public.rdo_partes;
create trigger set_updated_at_rdo before update on public.rdo_partes
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_rdo on public.rdo_partes;
create trigger audit_rdo after insert or update or delete on public.rdo_partes
  for each row execute function azur.fn_audit_trigger();

-- Trigger correlativo
create or replace function public.fn_generar_codigo_rdo()
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
    from public.rdo_partes where codigo like 'RDO-' || v_year || '-%';
  new.codigo := 'RDO-' || v_year || '-' || lpad((v_max + 1)::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists generar_codigo_rdo on public.rdo_partes;
create trigger generar_codigo_rdo before insert on public.rdo_partes
  for each row execute function public.fn_generar_codigo_rdo();

-- Avances por partida en el RDO
create table if not exists public.rdo_avances (
  id              uuid primary key default gen_random_uuid(),
  rdo_id          uuid not null references public.rdo_partes(id) on delete cascade,
  partida_id      uuid not null references public.proyecto_partidas(id) on delete cascade,
  metrado_dia     numeric(14,4) not null check (metrado_dia >= 0),
  observaciones   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_rdo_av_rdo on public.rdo_avances (rdo_id);

alter table public.rdo_partes   enable row level security;
alter table public.rdo_avances  enable row level security;

drop policy if exists "rdo_select" on public.rdo_partes;
create policy "rdo_select" on public.rdo_partes for select to authenticated using (
  reportado_por = auth.uid()
  or public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "rdo_modify" on public.rdo_partes;
create policy "rdo_modify" on public.rdo_partes for all to authenticated
  using (
    public.es_mando()
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  )
  with check (
    public.es_mando()
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  );

drop policy if exists "rdo_av_select" on public.rdo_avances;
create policy "rdo_av_select" on public.rdo_avances for select to authenticated using (
  exists (select 1 from public.rdo_partes r where r.id = rdo_id)
);
drop policy if exists "rdo_av_modify" on public.rdo_avances;
create policy "rdo_av_modify" on public.rdo_avances for all to authenticated
  using (
    public.es_mando()
    or public.es_rol_in(array['residente']::public.rol_sistema[])
  )
  with check (
    public.es_mando()
    or public.es_rol_in(array['residente']::public.rol_sistema[])
  );

-- ---------------------------------------------------------------------
-- Evidencias fotográficas
-- ---------------------------------------------------------------------
create table if not exists public.evidencias (
  id            uuid primary key default gen_random_uuid(),
  proyecto_id   uuid not null references public.proyectos(id) on delete cascade,
  partida_id    uuid references public.proyecto_partidas(id) on delete set null,
  rdo_id        uuid references public.rdo_partes(id) on delete set null,
  storage_path  text not null,                                      -- bucket "evidencias"/...
  titulo        text,
  descripcion   text,
  latitud       numeric(10,7),
  longitud      numeric(10,7),
  tomada_en     timestamptz not null default now(),                 -- timestamp captura
  capturada_por uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_evid_proyecto on public.evidencias (proyecto_id, tomada_en desc);
create index if not exists idx_evid_partida on public.evidencias (partida_id);
create index if not exists idx_evid_capturada on public.evidencias (capturada_por);

drop trigger if exists audit_evid on public.evidencias;
create trigger audit_evid after insert or update or delete on public.evidencias
  for each row execute function azur.fn_audit_trigger();

alter table public.evidencias enable row level security;
drop policy if exists "evid_select" on public.evidencias;
create policy "evid_select" on public.evidencias for select to authenticated using (
  capturada_por = auth.uid()
  or public.es_mando()
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "evid_insert" on public.evidencias;
create policy "evid_insert" on public.evidencias for insert to authenticated
  with check (
    capturada_por = auth.uid()
    or public.es_mando()
  );
drop policy if exists "evid_modify_owner" on public.evidencias;
create policy "evid_modify_owner" on public.evidencias for update to authenticated
  using (capturada_por = auth.uid() or public.es_mando())
  with check (capturada_por = auth.uid() or public.es_mando());

-- ---------------------------------------------------------------------
-- Push notifications (suscripciones VAPID)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_used_at timestamptz default now()
);

create index if not exists idx_push_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_self_all" on public.push_subscriptions;
create policy "push_self_all" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Notificaciones (in-app)
-- ---------------------------------------------------------------------
create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null,                                        -- solicitud_pendiente, pago_ejecutado, etc.
  titulo      text not null,
  mensaje     text not null,
  href        text,                                                  -- link al recurso
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notif_user_leida on public.notificaciones (user_id, leida, created_at desc);

alter table public.notificaciones enable row level security;
drop policy if exists "notif_self_select" on public.notificaciones;
create policy "notif_self_select" on public.notificaciones for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "notif_self_update" on public.notificaciones;
create policy "notif_self_update" on public.notificaciones for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================================
-- Seed: asignar el usuario residente@azur.dev a un proyecto demo
-- =====================================================================
do $$
declare
  v_residente_id uuid;
  v_proyecto_id  uuid;
begin
  select id into v_residente_id from auth.users where email = 'residente@azur.dev';
  select id into v_proyecto_id from public.proyectos order by created_at limit 1;
  if v_residente_id is not null and v_proyecto_id is not null then
    insert into public.usuario_proyectos (user_id, proyecto_id, rol_obra, activo)
    values (v_residente_id, v_proyecto_id, 'residente', true)
    on conflict do nothing;
  end if;
end$$;
