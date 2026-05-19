-- =====================================================================
-- AZUR ERP · Migration 0021 — Tabla de log para debug de push notifications
-- =====================================================================

create table if not exists public.push_log (
  id bigserial primary key,
  source text not null,
  target_user_id uuid,
  title text,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_log_created on public.push_log (created_at desc);

alter table public.push_log enable row level security;

drop policy if exists "push_log_select_gerencia" on public.push_log;
create policy "push_log_select_gerencia" on public.push_log for select to authenticated
  using (public.es_rol_in(array['gerencia_general']::public.rol_sistema[]));
