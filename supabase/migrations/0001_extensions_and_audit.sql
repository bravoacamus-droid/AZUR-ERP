-- =====================================================================
-- AZUR ERP · Migration 0001 — Extensiones + log de auditoría inmutable
-- =====================================================================

-- Extensiones
create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";
create extension if not exists "btree_gist";

-- Schema técnico para utilidades
create schema if not exists azur;

comment on schema azur is 'Funciones, tipos y vistas técnicas internas del ERP AZUR';

-- ---------------------------------------------------------------------
-- Tabla genérica de auditoría (append-only)
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id            bigserial primary key,
  occurred_at   timestamptz not null default now(),
  actor_id      uuid references auth.users(id) on delete set null,
  actor_email   text,
  table_name    text not null,
  record_id     text,
  action        text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data      jsonb,
  new_data      jsonb,
  diff          jsonb,
  context       jsonb default '{}'::jsonb
);

create index if not exists idx_audit_log_occurred_at on public.audit_log (occurred_at desc);
create index if not exists idx_audit_log_table_record on public.audit_log (table_name, record_id);
create index if not exists idx_audit_log_actor on public.audit_log (actor_id);
create index if not exists idx_audit_log_action on public.audit_log (action);

comment on table public.audit_log is 'Log inmutable de cambios en tablas críticas del ERP';

-- ---------------------------------------------------------------------
-- Trigger reutilizable: registra INSERT/UPDATE/DELETE en audit_log
-- ---------------------------------------------------------------------
create or replace function azur.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_diff jsonb := '{}'::jsonb;
  v_actor_email text;
  v_record_id text;
begin
  v_old := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_new := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(k, jsonb_build_object('from', v_old->k, 'to', v_new->k)), '{}'::jsonb)
      into v_diff
    from jsonb_object_keys(v_new) as k
    where (v_old->k) is distinct from (v_new->k);
  end if;

  if v_new ? 'id' then
    v_record_id := v_new->>'id';
  elsif v_old ? 'id' then
    v_record_id := v_old->>'id';
  end if;

  begin
    select email into v_actor_email from auth.users where id = auth.uid();
  exception when others then
    v_actor_email := null;
  end;

  insert into public.audit_log (
    actor_id, actor_email, table_name, record_id, action, old_data, new_data, diff
  ) values (
    auth.uid(), v_actor_email, tg_table_name, v_record_id, tg_op, v_old, v_new, v_diff
  );

  return coalesce(new, old);
end;
$$;

comment on function azur.fn_audit_trigger is 'Trigger genérico: registra cualquier INSERT/UPDATE/DELETE en audit_log';

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function azur.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function azur.fn_set_updated_at is 'Mantiene la columna updated_at sincronizada';
