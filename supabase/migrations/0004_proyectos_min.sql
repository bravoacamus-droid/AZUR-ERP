-- =====================================================================
-- AZUR ERP · Migration 0004 — Proyectos (mínimo) + asignación de usuarios
-- =====================================================================
-- Versión mínima de proyectos para soportar usuario_proyectos y RLS por
-- proyecto desde Fase 1. La estructura completa (etapas/partidas/etc.)
-- se construye en Fase 4.

create table if not exists public.proyectos (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,                                      -- ej PRY-2026-001
  nombre          text not null,
  descripcion     text,
  estado          text not null default 'planificado'
                  check (estado in ('planificado','en_curso','pausado','cerrado','cancelado')),
  cliente         text,
  ubicacion       text,
  latitud         numeric(10,7),
  longitud        numeric(10,7),
  radio_geofence_m int default 200 check (radio_geofence_m > 0),
  fecha_inicio    date,
  fecha_fin_plan  date,
  fecha_fin_real  date,
  monto_contrato  numeric(14,2) default 0,
  moneda          text not null default 'PEN' check (moneda in ('PEN','USD')),
  jefe_proyecto_id uuid references auth.users(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_proyectos_estado on public.proyectos (estado);
create index if not exists idx_proyectos_jefe on public.proyectos (jefe_proyecto_id);

drop trigger if exists set_updated_at_proyectos on public.proyectos;
create trigger set_updated_at_proyectos
  before update on public.proyectos
  for each row execute function azur.fn_set_updated_at();

drop trigger if exists audit_proyectos on public.proyectos;
create trigger audit_proyectos
  after insert or update or delete on public.proyectos
  for each row execute function azur.fn_audit_trigger();

-- ---------------------------------------------------------------------
-- Asignación de usuarios (residentes/coords) a proyectos
-- ---------------------------------------------------------------------
create table if not exists public.usuario_proyectos (
  user_id     uuid not null references auth.users(id) on delete cascade,
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  rol_obra    text not null default 'residente'
              check (rol_obra in ('residente','coordinador','supervisor','jefe')),
  desde       date not null default current_date,
  hasta       date,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (user_id, proyecto_id)
);

create index if not exists idx_usuario_proyectos_proyecto on public.usuario_proyectos (proyecto_id) where activo;
create index if not exists idx_usuario_proyectos_user on public.usuario_proyectos (user_id) where activo;

drop trigger if exists audit_usuario_proyectos on public.usuario_proyectos;
create trigger audit_usuario_proyectos
  after insert or update or delete on public.usuario_proyectos
  for each row execute function azur.fn_audit_trigger();
