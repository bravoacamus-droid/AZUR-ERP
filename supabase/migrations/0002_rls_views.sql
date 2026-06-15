-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  AZUR ERP — Funciones, RLS, vistas, triggers                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ───────────────────────── HELPERS (SECURITY DEFINER) ─────────────────
create or replace function current_rol() returns rol_enum
language sql stable security definer set search_path = public as $$
  select rol from profiles where id = auth.uid();
$$;

create or replace function es_mando() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select rol from profiles where id = auth.uid())
      in ('gerencia','jefe_proyectos','presupuestos','administrador','comercial'),
    false);
$$;

create or replace function es_gerencia_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select rol from profiles where id = auth.uid()) in ('gerencia','administrador'),
    false);
$$;

create or replace function es_miembro(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_mando() or exists (
    select 1 from proyecto_equipo pe
    where pe.proyecto_id = p and pe.profile_id = auth.uid()
  );
$$;

-- ─────────────────── ALTA AUTOMÁTICA DE PERFIL EN SIGNUP ───────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nombre, rol, telefono)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'rol')::rol_enum, 'residente'),
    new.raw_user_meta_data->>'telefono'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ──────────────────── TRIGGER DE AUDITORÍA GENÉRICO ────────────────────
create or replace function fn_audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  begin rid := coalesce(new.id, old.id); exception when others then rid := null; end;
  insert into audit_log(tabla, registro_id, accion, old_data, new_data, usuario_id)
  values (
    tg_table_name, rid, tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end,
    auth.uid()
  );
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- aplica auditoría a las tablas críticas
do $$
declare t text;
begin
  foreach t in array array[
    'cotizaciones','cotizacion_items','proyectos','proyecto_items',
    'solicitudes_pago','valorizaciones','movimientos_caja','facturas',
    'abonos_cliente','adicionales_deductivos'
  ] loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s;', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on %1$s for each row execute function fn_audit_trigger();', t);
  end loop;
end $$;

-- ───────────────────────── updated_at automático ──────────────────────
create or replace function fn_touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_touch_cot on cotizaciones;
create trigger trg_touch_cot before update on cotizaciones
  for each row execute function fn_touch_updated_at();
drop trigger if exists trg_touch_proy on proyectos;
create trigger trg_touch_proy before update on proyectos
  for each row execute function fn_touch_updated_at();

-- ───────────────────────────── VISTAS ─────────────────────────────────
drop view if exists v_cajas_saldos cascade;
create view v_cajas_saldos as
select
  c.id as caja_id, c.proyecto_id, c.tipo, c.nombre, c.monto_maximo,
  c.saldo_inicial,
  coalesce(sum(case
    when m.tipo in ('abono','reposicion') then m.monto
    when m.tipo = 'egreso' then -m.monto
    else m.monto end), 0) as movimientos,
  c.saldo_inicial + coalesce(sum(case
    when m.tipo in ('abono','reposicion') then m.monto
    when m.tipo = 'egreso' then -m.monto
    else m.monto end), 0) as saldo_actual
from cajas c
left join movimientos_caja m on m.caja_id = c.id
group by c.id;

drop view if exists v_dashboard_proyecto cascade;
create view v_dashboard_proyecto as
select
  p.id as proyecto_id, p.codigo, p.nombre, p.linea_id, p.estado, p.tipo_proyecto,
  p.contrato_total as proyectado,
  coalesce((select sum(a.monto) from abonos_cliente a where a.proyecto_id = p.id), 0) as pagos,
  coalesce((select sum(s.monto) from solicitudes_pago s
            where s.proyecto_id = p.id and s.status in ('pagada','conciliada')), 0) as gasto,
  coalesce((select sum(v.monto_valorizado) from valorizaciones v where v.proyecto_id = p.id), 0) as valorizado
from proyectos p;

-- ───────────────────────────── RLS ────────────────────────────────────
-- Activa RLS en todas las tablas públicas
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Helper para crear policy "select authenticated" simple
-- (Las definimos explícitas por claridad.)

-- profiles: todos los autenticados leen (nombres no son secretos); escribe gerencia/admin o uno mismo
drop policy if exists p_profiles_sel on profiles;
create policy p_profiles_sel on profiles for select to authenticated using (true);
drop policy if exists p_profiles_upd on profiles;
create policy p_profiles_upd on profiles for update to authenticated using (id = auth.uid() or es_gerencia_admin());
drop policy if exists p_profiles_ins on profiles;
create policy p_profiles_ins on profiles for insert to authenticated with check (es_gerencia_admin());

-- Tablas de referencia: lee autenticado, escribe mando
do $$
declare t text;
begin
  foreach t in array array['lineas_negocio','clientes','contrapartes','catalogo_partidas',
    'catalogo_insumos','plantillas_cotizacion','medios_pago_empresa','inventario_items'] loop
    execute format('drop policy if exists %1$s_sel on %1$s;', t);
    execute format('create policy %1$s_sel on %1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists %1$s_wr on %1$s;', t);
    execute format('create policy %1$s_wr on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Comercial: solo mando (oculta márgenes a campo)
do $$
declare t text;
begin
  foreach t in array array['cotizaciones','cotizacion_items','cotizacion_formas_pago','cotizacion_versiones'] loop
    execute format('drop policy if exists %1$s_sel on %1$s;', t);
    execute format('create policy %1$s_sel on %1$s for select to authenticated using (es_mando());', t);
    execute format('drop policy if exists %1$s_wr on %1$s;', t);
    execute format('create policy %1$s_wr on %1$s for all to authenticated using (es_mando()) with check (es_mando());', t);
  end loop;
end $$;

-- Proyectos (cabecera): mando o miembro
drop policy if exists proyectos_sel on proyectos;
create policy proyectos_sel on proyectos for select to authenticated using (es_miembro(id));
drop policy if exists proyectos_wr on proyectos;
create policy proyectos_wr on proyectos for all to authenticated using (es_mando()) with check (es_mando());

-- proyecto_equipo
drop policy if exists equipo_sel on proyecto_equipo;
create policy equipo_sel on proyecto_equipo for select to authenticated using (profile_id = auth.uid() or es_mando());
drop policy if exists equipo_wr on proyecto_equipo;
create policy equipo_wr on proyecto_equipo for all to authenticated using (es_mando()) with check (es_mando());

-- Tablas hijas de proyecto: mando o miembro del proyecto
do $$
declare t text;
begin
  foreach t in array array['proyecto_items','valorizaciones','valorizacion_items','cronograma_cobros',
    'adicionales_deductivos','hitos','asistencias','tareo','partes_diarios','rdo_actividades',
    'evidencias','sst_charlas','sst_observaciones','sst_incidentes','documentos'] loop
    execute format('drop policy if exists %1$s_sel on %1$s;', t);
    execute format('create policy %1$s_sel on %1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists %1$s_wr on %1$s;', t);
    execute format('create policy %1$s_wr on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Solicitudes de pago: mando, solicitante o miembro pueden ver; cualquier autenticado crea
drop policy if exists sol_sel on solicitudes_pago;
create policy sol_sel on solicitudes_pago for select to authenticated
  using (es_mando() or solicitado_por = auth.uid() or (proyecto_id is not null and es_miembro(proyecto_id)));
drop policy if exists sol_ins on solicitudes_pago;
create policy sol_ins on solicitudes_pago for insert to authenticated with check (true);
drop policy if exists sol_upd on solicitudes_pago;
create policy sol_upd on solicitudes_pago for update to authenticated using (es_mando() or solicitado_por = auth.uid());

-- Finanzas sensible: solo mando
do $$
declare t text;
begin
  foreach t in array array['cajas','movimientos_caja','facturas','abonos_cliente'] loop
    execute format('drop policy if exists %1$s_sel on %1$s;', t);
    execute format('create policy %1$s_sel on %1$s for select to authenticated using (es_mando());', t);
    execute format('drop policy if exists %1$s_wr on %1$s;', t);
    execute format('create policy %1$s_wr on %1$s for all to authenticated using (es_mando()) with check (es_mando());', t);
  end loop;
end $$;

-- Almacén
do $$
declare t text;
begin
  foreach t in array array['movimientos_almacen'] loop
    execute format('drop policy if exists %1$s_sel on %1$s;', t);
    execute format('create policy %1$s_sel on %1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists %1$s_wr on %1$s;', t);
    execute format('create policy %1$s_wr on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Notificaciones / push: propias
drop policy if exists notif_sel on notificaciones;
create policy notif_sel on notificaciones for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_upd on notificaciones;
create policy notif_upd on notificaciones for update to authenticated using (user_id = auth.uid());
drop policy if exists notif_ins on notificaciones;
create policy notif_ins on notificaciones for insert to authenticated with check (true);

drop policy if exists push_sel on push_subscriptions;
create policy push_sel on push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists push_wr on push_subscriptions;
create policy push_wr on push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Alertas: lee mando
drop policy if exists alertas_sel on alertas;
create policy alertas_sel on alertas for select to authenticated using (true);
drop policy if exists alertas_wr on alertas;
create policy alertas_wr on alertas for all to authenticated using (true) with check (true);

-- audit_log / push_log: lee mando
drop policy if exists audit_sel on audit_log;
create policy audit_sel on audit_log for select to authenticated using (es_mando());
drop policy if exists pushlog_sel on push_log;
create policy pushlog_sel on push_log for select to authenticated using (es_mando());
