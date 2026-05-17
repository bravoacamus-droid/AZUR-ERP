-- =====================================================================
-- AZUR ERP · Migration 0015 — SST + Almacén básico + Documentos del proyecto
-- =====================================================================

-- ---------------------------------------------------------------------
-- SST: charla diaria de 5 minutos con asistencia
-- ---------------------------------------------------------------------
create table if not exists public.sst_charlas (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  fecha        date not null default current_date,
  tema         text not null,
  asistencia   int not null default 0 check (asistencia >= 0),
  notas        text,
  reportada_por uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (proyecto_id, fecha)
);

create index if not exists idx_sst_charlas_proy on public.sst_charlas (proyecto_id, fecha desc);
drop trigger if exists audit_sst_charlas on public.sst_charlas;
create trigger audit_sst_charlas after insert or update or delete on public.sst_charlas
  for each row execute function azur.fn_audit_trigger();

-- Observaciones (actos/condiciones inseguras)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sst_obs_tipo') then
    create type public.sst_obs_tipo as enum ('acto_inseguro','condicion_insegura','sugerencia');
  end if;
end$$;

create table if not exists public.sst_observaciones (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  tipo         public.sst_obs_tipo not null,
  descripcion  text not null,
  accion_correctiva text,
  fecha        date not null default current_date,
  resuelta     boolean not null default false,
  reportada_por uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

drop trigger if exists audit_sst_obs on public.sst_observaciones;
create trigger audit_sst_obs after insert or update or delete on public.sst_observaciones
  for each row execute function azur.fn_audit_trigger();

-- Incidentes
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sst_inc_severidad') then
    create type public.sst_inc_severidad as enum ('leve','moderado','grave','critico');
  end if;
end$$;

create table if not exists public.sst_incidentes (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  fecha        date not null default current_date,
  hora         timestamptz not null default now(),
  severidad    public.sst_inc_severidad not null,
  descripcion  text not null,
  involucrados text,
  acciones     text,
  evidencia_path text,                                              -- foto en bucket evidencias
  reportado_por uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

drop trigger if exists audit_sst_inc on public.sst_incidentes;
create trigger audit_sst_inc after insert or update or delete on public.sst_incidentes
  for each row execute function azur.fn_audit_trigger();

-- RLS SST
alter table public.sst_charlas       enable row level security;
alter table public.sst_observaciones enable row level security;
alter table public.sst_incidentes    enable row level security;

drop policy if exists "sst_charlas_select" on public.sst_charlas;
create policy "sst_charlas_select" on public.sst_charlas for select to authenticated using (
  public.es_mando() or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "sst_charlas_modify" on public.sst_charlas;
create policy "sst_charlas_modify" on public.sst_charlas for all to authenticated
  using (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)))
  with check (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)));

drop policy if exists "sst_obs_select" on public.sst_observaciones;
create policy "sst_obs_select" on public.sst_observaciones for select to authenticated using (
  public.es_mando() or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "sst_obs_modify" on public.sst_observaciones;
create policy "sst_obs_modify" on public.sst_observaciones for all to authenticated
  using (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)))
  with check (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)));

drop policy if exists "sst_inc_select" on public.sst_incidentes;
create policy "sst_inc_select" on public.sst_incidentes for select to authenticated using (
  public.es_mando() or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "sst_inc_modify" on public.sst_incidentes;
create policy "sst_inc_modify" on public.sst_incidentes for all to authenticated
  using (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)))
  with check (public.es_mando() or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id)));

-- ---------------------------------------------------------------------
-- Almacén básico: movimientos de salidas/devoluciones
-- ---------------------------------------------------------------------
create table if not exists public.almacen_movimientos (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  tipo         text not null check (tipo in ('salida','devolucion')),
  fecha        date not null default current_date,
  insumo_id    uuid references public.insumos_maestros(id) on delete set null,
  descripcion  text not null,                                       -- snapshot por si no hay insumo_id
  cantidad     numeric(14,4) not null check (cantidad > 0),
  unidad       text not null references public.unidades_medida(codigo),
  responsable  text,                                                -- nombre de quien recibe
  notas        text,
  registrado_por uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_alm_proyecto on public.almacen_movimientos (proyecto_id, fecha desc);

drop trigger if exists audit_alm on public.almacen_movimientos;
create trigger audit_alm after insert or update or delete on public.almacen_movimientos
  for each row execute function azur.fn_audit_trigger();

alter table public.almacen_movimientos enable row level security;
drop policy if exists "alm_select" on public.almacen_movimientos;
create policy "alm_select" on public.almacen_movimientos for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "alm_modify" on public.almacen_movimientos;
create policy "alm_modify" on public.almacen_movimientos for all to authenticated
  using (
    public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  )
  with check (
    public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  );

-- ---------------------------------------------------------------------
-- Documentos del proyecto (storage bucket "documentos")
-- ---------------------------------------------------------------------
create table if not exists public.documentos_proyecto (
  id            uuid primary key default gen_random_uuid(),
  proyecto_id   uuid not null references public.proyectos(id) on delete cascade,
  titulo        text not null,
  descripcion   text,
  carpeta       text not null default 'general',                    -- planos, contratos, cotizaciones, fichas
  storage_path  text not null,
  tipo_mime     text,
  tamano_bytes  bigint,
  subido_por    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_docs_proy on public.documentos_proyecto (proyecto_id, carpeta);

drop trigger if exists audit_docs on public.documentos_proyecto;
create trigger audit_docs after insert or update or delete on public.documentos_proyecto
  for each row execute function azur.fn_audit_trigger();

alter table public.documentos_proyecto enable row level security;
drop policy if exists "docs_select" on public.documentos_proyecto;
create policy "docs_select" on public.documentos_proyecto for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
  or public.tiene_proyecto(proyecto_id)
);
drop policy if exists "docs_modify" on public.documentos_proyecto;
create policy "docs_modify" on public.documentos_proyecto for all to authenticated
  using (
    public.es_mando()
    or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  )
  with check (
    public.es_mando()
    or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  );
