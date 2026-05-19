-- =====================================================================
-- AZUR ERP · Migration 0018 — Auto-crear caja chica al generar proyecto + backfill
-- =====================================================================

-- Modificar la función para incluir creación de caja chica
create or replace function public.fn_crear_proyecto_desde_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cot              public.cotizaciones%rowtype;
  v_proyecto_id      uuid;
  v_codigo_proyecto  text;
  v_count            int;
  v_etapa_id         uuid;
  v_factor_venta     numeric(10,6);
  v_subtotal         numeric(14,2);
  v_cd               numeric(14,2);
begin
  select * into v_cot from public.cotizaciones where id = p_cotizacion_id;
  if not found then raise exception 'Cotización % no encontrada', p_cotizacion_id; end if;
  if v_cot.estado <> 'aprobada' then
    raise exception 'La cotización debe estar APROBADA para generar el proyecto (estado actual: %)', v_cot.estado;
  end if;
  if v_cot.proyecto_id is not null then
    return v_cot.proyecto_id;
  end if;

  select costo_directo, subtotal into v_cd, v_subtotal
    from public.v_cotizacion_totales where id = p_cotizacion_id;

  v_cd := coalesce(v_cd, 0);
  v_subtotal := coalesce(v_subtotal, 0);
  v_factor_venta := case when v_cd > 0 then v_subtotal / v_cd else 1 end;

  select 'PRY-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
         lpad((coalesce(max(substring(codigo from 10)::int), 0) + 1)::text, 4, '0')
    into v_codigo_proyecto
    from public.proyectos
   where codigo like 'PRY-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-%';

  insert into public.proyectos (
    codigo, nombre, descripcion, ubicacion,
    estado, fecha_inicio, monto_contrato, moneda,
    cotizacion_id, margen_porcentaje, presupuesto_costo, presupuesto_venta,
    created_by
  ) values (
    v_codigo_proyecto,
    v_cot.titulo,
    v_cot.descripcion,
    v_cot.ubicacion,
    'planificado',
    current_date,
    v_subtotal,
    v_cot.moneda,
    p_cotizacion_id,
    v_cot.margen_porcentaje,
    round(v_cd * (1 + v_cot.gastos_generales_porcentaje / 100.0), 2),
    v_subtotal,
    v_cot.created_by
  )
  returning id into v_proyecto_id;

  insert into public.proyecto_etapas (proyecto_id, codigo, nombre, orden)
  values (v_proyecto_id, '01', 'Obra contratada', 10)
  returning id into v_etapa_id;

  insert into public.proyecto_partidas (
    proyecto_id, etapa_id, codigo, descripcion, unidad,
    metrado_contractual, precio_unitario_costo, precio_unitario_venta,
    orden, cotizacion_partida_id
  )
  select
    v_proyecto_id, v_etapa_id, cp.codigo, cp.descripcion, cp.unidad,
    cp.cantidad,
    cp.precio_unitario,
    round(cp.precio_unitario * v_factor_venta, 4),
    cp.orden, cp.id
  from public.cotizacion_partidas cp
  where cp.cotizacion_id = p_cotizacion_id
  order by cp.orden;

  get diagnostics v_count = row_count;

  update public.cotizaciones
     set proyecto_id = v_proyecto_id
   where id = p_cotizacion_id;

  -- NUEVO: auto-crear caja chica del proyecto (saldo 0, misma moneda del proyecto)
  insert into public.cajas (nombre, tipo, proyecto_id, moneda, saldo_inicial, activo)
  values (
    'Caja chica · ' || v_codigo_proyecto,
    'proyecto',
    v_proyecto_id,
    v_cot.moneda,
    0,
    true
  )
  on conflict (proyecto_id, moneda) do nothing;

  raise notice 'Proyecto % creado desde cotización % con % partidas + caja chica',
    v_codigo_proyecto, v_cot.codigo, v_count;

  return v_proyecto_id;
end;
$$;

-- ---------------------------------------------------------------------
-- BACKFILL: crear caja chica para proyectos existentes que no la tengan
-- ---------------------------------------------------------------------
insert into public.cajas (nombre, tipo, proyecto_id, moneda, saldo_inicial, activo)
select
  'Caja chica · ' || p.codigo,
  'proyecto',
  p.id,
  p.moneda,
  0,
  true
from public.proyectos p
where p.estado <> 'cancelado'
  and not exists (
    select 1 from public.cajas c where c.proyecto_id = p.id and c.moneda = p.moneda
  )
on conflict (proyecto_id, moneda) do nothing;
