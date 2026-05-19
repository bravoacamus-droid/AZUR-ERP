-- =====================================================================
-- AZUR ERP · Migration 0019 — Visibilidad en documentos + RLS por nivel
-- =====================================================================

-- Columna de visibilidad
alter table public.documentos_proyecto
  add column if not exists visibilidad text not null default 'publica'
    check (visibilidad in ('publica','mando','gerencia'));

create index if not exists idx_docs_visibilidad on public.documentos_proyecto (visibilidad);

-- RLS de SELECT segmentada por visibilidad
drop policy if exists "docs_select" on public.documentos_proyecto;
create policy "docs_select" on public.documentos_proyecto for select to authenticated using (
  -- publica: visible para cualquiera con acceso al proyecto
  (visibilidad = 'publica' and (
    public.es_mando()
    or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
    or public.tiene_proyecto(proyecto_id)
  ))
  -- mando: gerencia, jefes, administrador (no residente, no comercial)
  or (visibilidad = 'mando' and (
    public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
  ))
  -- gerencia: SOLO gerencia general
  or (visibilidad = 'gerencia' and
    public.es_rol_in(array['gerencia_general']::public.rol_sistema[]))
);

-- INSERT: cualquiera con acceso al proyecto puede subir
-- La restricción de qué visibilidad puede setear cada rol se valida en el server action
drop policy if exists "docs_modify" on public.documentos_proyecto;
create policy "docs_insert" on public.documentos_proyecto for insert to authenticated
  with check (
    public.es_mando()
    or public.es_rol_in(array['administrador','comercial']::public.rol_sistema[])
    or (public.es_rol_in(array['residente']::public.rol_sistema[]) and public.tiene_proyecto(proyecto_id))
  );

-- UPDATE: solo el que subió o gerencia pueden modificar
drop policy if exists "docs_update_owner" on public.documentos_proyecto;
create policy "docs_update_owner" on public.documentos_proyecto for update to authenticated
  using (
    subido_por = auth.uid()
    or public.es_rol_in(array['gerencia_general']::public.rol_sistema[])
  )
  with check (
    subido_por = auth.uid()
    or public.es_rol_in(array['gerencia_general']::public.rol_sistema[])
  );

-- DELETE: solo el que subió o gerencia
drop policy if exists "docs_delete_owner" on public.documentos_proyecto;
create policy "docs_delete_owner" on public.documentos_proyecto for delete to authenticated
  using (
    subido_por = auth.uid()
    or public.es_rol_in(array['gerencia_general']::public.rol_sistema[])
  );
