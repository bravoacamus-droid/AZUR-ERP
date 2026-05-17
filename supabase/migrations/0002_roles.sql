-- =====================================================================
-- AZUR ERP · Migration 0002 — Roles del sistema
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enum + tabla descriptiva de roles
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_sistema') then
    create type public.rol_sistema as enum (
      'gerencia_general',
      'jefe_proyectos',
      'jefe_presupuestos',
      'administrador',
      'comercial',
      'residente'
    );
  end if;
end$$;

create table if not exists public.roles (
  codigo        public.rol_sistema primary key,
  nombre        text not null,
  descripcion   text,
  scope         text not null check (scope in ('erp','pwa','both')),
  orden         int  not null default 0,
  color         text not null default '#BE1723',
  icono         text not null default 'shield-check',
  created_at    timestamptz not null default now()
);

comment on table public.roles is 'Catálogo de roles del sistema AZUR ERP';

insert into public.roles (codigo, nombre, descripcion, scope, orden, color, icono) values
  ('gerencia_general',  'Gerencia General',          'Visión integral del ERP, aprobaciones finales y reportes ejecutivos cruzados.', 'both', 10, '#BE1723', 'crown'),
  ('jefe_proyectos',    'Jefe de Proyectos',         'Aprobación de solicitudes, valorizaciones, cronograma, curva S e informes al cliente.', 'both', 20, '#E20627', 'hard-hat'),
  ('jefe_presupuestos', 'Jefe de Presupuestos',      'APU, control presupuesto vs ejecutado, adicionales/deductivos, reporte de desvíos.', 'both', 30, '#BE1723', 'calculator'),
  ('administrador',     'Administrador',             'Programación de pagos, vouchers, detracciones, caja central y caja chica.', 'erp', 40, '#E20627', 'wallet'),
  ('comercial',         'Comercial',                 'Armado y envío de cotizaciones, gestión de catálogo de partidas e insumos.', 'erp', 50, '#ECA4A9', 'briefcase'),
  ('residente',         'Residente / Coordinador',   'Check-in GPS, parte diario, solicitudes, evidencias, SST, tareo (PWA campo).', 'pwa', 60, '#0A0A0A', 'smartphone')
on conflict (codigo) do update
  set nombre      = excluded.nombre,
      descripcion = excluded.descripcion,
      scope       = excluded.scope,
      orden       = excluded.orden,
      color       = excluded.color,
      icono       = excluded.icono;

-- RLS: lectura para todos los usuarios autenticados, escritura solo gerencia
alter table public.roles enable row level security;

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

-- Las escrituras a roles las maneja el service_role en migraciones; nadie más muta este catálogo.
