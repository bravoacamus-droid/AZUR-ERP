-- =====================================================================
-- AZUR ERP · Migration 0003 — Perfiles de usuario
-- =====================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null unique,
  full_name     text not null default '',
  rol           public.rol_sistema not null default 'residente',
  telefono      text,
  dni           text,
  cargo         text,
  avatar_url    text,
  activo        boolean not null default true,
  preferencias  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Perfil 1:1 con auth.users, incluye rol del sistema';

create index if not exists idx_profiles_rol on public.profiles (rol);
create index if not exists idx_profiles_activo on public.profiles (activo);

-- Trigger updated_at
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function azur.fn_set_updated_at();

-- Trigger audit
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function azur.fn_audit_trigger();

-- ---------------------------------------------------------------------
-- Trigger: al crear un auth.user, crea automáticamente el profile
--          - lee full_name y rol desde raw_user_meta_data si vienen
--          - rol por defecto: residente
-- ---------------------------------------------------------------------
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol public.rol_sistema;
  v_full_name text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  begin
    v_rol := coalesce((new.raw_user_meta_data->>'rol')::public.rol_sistema, 'residente');
  exception when invalid_text_representation then
    v_rol := 'residente';
  end;

  insert into public.profiles (id, email, full_name, rol)
  values (new.id, new.email, v_full_name, v_rol)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ---------------------------------------------------------------------
-- RLS profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- helper inline simple (la helper "tiene_rol" llega en 0005)
-- Lectura: cualquier usuario autenticado puede ver perfiles activos (necesario para mostrar nombres en aprobaciones, RDOs, etc.)
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (activo = true or id = auth.uid());

-- Update: usuario puede actualizar su propio perfil (campos no sensibles)
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Gerencia y service_role manejan los cambios de rol/activo (políticas en 0005)
