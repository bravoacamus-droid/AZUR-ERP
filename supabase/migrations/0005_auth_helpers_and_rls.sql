-- =====================================================================
-- AZUR ERP · Migration 0005 — Auth helpers + políticas RLS base
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: rol actual del usuario autenticado
-- ---------------------------------------------------------------------
create or replace function public.current_user_rol()
returns public.rol_sistema
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select rol from public.profiles where id = auth.uid()
$$;

comment on function public.current_user_rol is 'Rol del usuario autenticado (lookup cacheado por query)';

-- ---------------------------------------------------------------------
-- Helper: ¿el usuario tiene alguno de estos roles?
-- ---------------------------------------------------------------------
create or replace function public.es_rol_in(roles public.rol_sistema[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and activo = true
      and rol = any(roles)
  )
$$;

comment on function public.es_rol_in is 'true si el usuario autenticado tiene uno de los roles indicados';

-- ---------------------------------------------------------------------
-- Helper: ¿está asignado a este proyecto?
-- ---------------------------------------------------------------------
create or replace function public.tiene_proyecto(p_proyecto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.usuario_proyectos
    where user_id = auth.uid()
      and proyecto_id = p_proyecto_id
      and activo = true
  )
$$;

comment on function public.tiene_proyecto is 'true si el usuario está asignado activamente al proyecto';

-- ---------------------------------------------------------------------
-- Helper: ¿es gerencia o jefe? (acceso amplio)
-- ---------------------------------------------------------------------
create or replace function public.es_mando()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.es_rol_in(array['gerencia_general','jefe_proyectos','jefe_presupuestos']::public.rol_sistema[])
$$;

comment on function public.es_mando is 'true si es gerencia o jefe (proyectos / presupuestos)';

-- =====================================================================
-- POLÍTICAS RLS — extendidas
-- =====================================================================

-- ---------- profiles ----------
-- Gerencia puede actualizar cualquier perfil (cambiar rol, desactivar)
drop policy if exists "profiles_update_gerencia" on public.profiles;
create policy "profiles_update_gerencia" on public.profiles
  for update to authenticated
  using (public.es_rol_in(array['gerencia_general']::public.rol_sistema[]))
  with check (public.es_rol_in(array['gerencia_general']::public.rol_sistema[]));

-- Insert: solo service_role (vía signup/trigger). Bloqueamos cualquier insert directo.
drop policy if exists "profiles_insert_none" on public.profiles;
create policy "profiles_insert_none" on public.profiles
  for insert to authenticated with check (false);

-- Delete: nadie desde el cliente
drop policy if exists "profiles_delete_none" on public.profiles;
create policy "profiles_delete_none" on public.profiles
  for delete to authenticated using (false);

-- ---------- proyectos ----------
alter table public.proyectos enable row level security;

drop policy if exists "proyectos_select" on public.proyectos;
create policy "proyectos_select" on public.proyectos
  for select to authenticated
  using (
    public.es_mando()
    or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
    or public.tiene_proyecto(id)
  );

drop policy if exists "proyectos_insert_mando" on public.proyectos;
create policy "proyectos_insert_mando" on public.proyectos
  for insert to authenticated
  with check (public.es_mando() or public.es_rol_in(array['comercial']::public.rol_sistema[]));

drop policy if exists "proyectos_update_mando" on public.proyectos;
create policy "proyectos_update_mando" on public.proyectos
  for update to authenticated
  using (public.es_mando())
  with check (public.es_mando());

drop policy if exists "proyectos_delete_gerencia" on public.proyectos;
create policy "proyectos_delete_gerencia" on public.proyectos
  for delete to authenticated
  using (public.es_rol_in(array['gerencia_general']::public.rol_sistema[]));

-- ---------- usuario_proyectos ----------
alter table public.usuario_proyectos enable row level security;

drop policy if exists "usuario_proyectos_select" on public.usuario_proyectos;
create policy "usuario_proyectos_select" on public.usuario_proyectos
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
  );

drop policy if exists "usuario_proyectos_modify_mando" on public.usuario_proyectos;
create policy "usuario_proyectos_modify_mando" on public.usuario_proyectos
  for all to authenticated
  using (public.es_mando())
  with check (public.es_mando());

-- ---------- audit_log ----------
alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_gerencia" on public.audit_log;
create policy "audit_log_select_gerencia" on public.audit_log
  for select to authenticated
  using (public.es_rol_in(array['gerencia_general']::public.rol_sistema[]));

-- Nadie inserta directamente (solo el trigger via security definer)
drop policy if exists "audit_log_no_direct_writes" on public.audit_log;
create policy "audit_log_no_direct_writes" on public.audit_log
  for insert to authenticated with check (false);
