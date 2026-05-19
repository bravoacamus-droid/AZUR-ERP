-- =====================================================================
-- AZUR ERP · Migration 0023 — Almacén central: ingresos (compras) y
--                              vista de stock central real
-- =====================================================================

-- ---------------------------------------------------------------------
-- Permitir ingresos sin proyecto (van al almacén central)
-- + nuevo tipo 'ingreso'
-- + columnas para datos de compra
-- ---------------------------------------------------------------------

-- 1) Quitar el NOT NULL de proyecto_id (los ingresos al central no tienen)
alter table public.almacen_movimientos
  alter column proyecto_id drop not null;

-- 2) Ampliar el check constraint para incluir 'ingreso'
alter table public.almacen_movimientos
  drop constraint if exists almacen_movimientos_tipo_check;

alter table public.almacen_movimientos
  add constraint almacen_movimientos_tipo_check
  check (tipo in ('ingreso', 'salida', 'devolucion'));

-- 3) Reglas de integridad por tipo:
--    - ingreso  → proyecto_id DEBE ser null (va al central)
--    - salida   → proyecto_id REQUERIDO (a qué obra)
--    - devolucion → proyecto_id REQUERIDO (de qué obra)
alter table public.almacen_movimientos
  drop constraint if exists almacen_mov_proyecto_consistencia;

alter table public.almacen_movimientos
  add constraint almacen_mov_proyecto_consistencia
  check (
    (tipo = 'ingreso' and proyecto_id is null)
    or (tipo in ('salida', 'devolucion') and proyecto_id is not null)
  );

-- 4) Columnas para compras (solo aplican a ingreso, opcionales en general)
alter table public.almacen_movimientos
  add column if not exists proveedor        text,
  add column if not exists numero_documento text,
  add column if not exists costo_unit       numeric(14,4);

create index if not exists idx_alm_tipo_fecha on public.almacen_movimientos (tipo, fecha desc);
create index if not exists idx_alm_central on public.almacen_movimientos (insumo_id) where proyecto_id is null;

-- ---------------------------------------------------------------------
-- RLS: actualizar policies para que los ingresos (proyecto_id null)
-- solo los pueda insertar/leer mando + admin (no residente)
-- ---------------------------------------------------------------------
drop policy if exists "alm_select" on public.almacen_movimientos;
create policy "alm_select" on public.almacen_movimientos for select to authenticated using (
  public.es_mando()
  or public.es_rol_in(array['administrador']::public.rol_sistema[])
  or (proyecto_id is not null and public.tiene_proyecto(proyecto_id))
);

drop policy if exists "alm_modify" on public.almacen_movimientos;
create policy "alm_modify" on public.almacen_movimientos for all to authenticated
  using (
    public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
    or (
      proyecto_id is not null
      and public.es_rol_in(array['residente']::public.rol_sistema[])
      and public.tiene_proyecto(proyecto_id)
    )
  )
  with check (
    public.es_mando()
    or public.es_rol_in(array['administrador']::public.rol_sistema[])
    or (
      proyecto_id is not null
      and public.es_rol_in(array['residente']::public.rol_sistema[])
      and public.tiene_proyecto(proyecto_id)
    )
  );

-- ---------------------------------------------------------------------
-- Vista: stock del almacén CENTRAL (físico, antes de entregar a obras)
-- stock_central = sum(ingresos) - sum(salidas) + sum(devoluciones)
--
-- Solo cuenta items que pasaron por el catálogo (insumo_id not null).
-- Texto libre se ignora aquí porque no se puede agrupar confiablemente.
-- ---------------------------------------------------------------------
drop view if exists public.v_almacen_central_stock;
create view public.v_almacen_central_stock as
  select
    i.id                                          as insumo_id,
    i.codigo                                      as insumo_codigo,
    i.descripcion,
    i.categoria::text                             as categoria,
    i.unidad,
    coalesce(sum(case when am.tipo = 'ingreso'    then am.cantidad else 0 end), 0)::numeric(14,4) as total_ingresos,
    coalesce(sum(case when am.tipo = 'salida'     then am.cantidad else 0 end), 0)::numeric(14,4) as total_salidas,
    coalesce(sum(case when am.tipo = 'devolucion' then am.cantidad else 0 end), 0)::numeric(14,4) as total_devoluciones,
    coalesce(sum(case when am.tipo = 'ingreso'    then am.cantidad
                      when am.tipo = 'devolucion' then am.cantidad
                      when am.tipo = 'salida'     then -am.cantidad
                      else 0 end), 0)::numeric(14,4) as stock_disponible,
    max(am.fecha) as ultimo_movimiento,
    count(am.id)::int as cantidad_movimientos
  from public.insumos_maestros i
  left join public.almacen_movimientos am on am.insumo_id = i.id
  where i.activo = true
    and i.categoria in ('equipo', 'material')
  group by i.id, i.codigo, i.descripcion, i.categoria, i.unidad;

comment on view public.v_almacen_central_stock is
  'Stock físico del almacén central: ingresos - salidas + devoluciones, por insumo';
