-- =====================================================================
-- AZUR ERP · Migration 0010 — Generar proyecto desde cotización aprobada
-- =====================================================================

create or replace function public.fn_crear_proyecto_desde_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cot        public.cotizaciones%rowtype;
  v_proyecto_id uuid;
  v_codigo_proyecto text;
  v_count      int;
  v_etapa_id   uuid;
  v_factor_venta numeric(10,6);   -- precio venta / precio costo
  v_subtotal   numeric(14,2);
  v_cd         numeric(14,2);
begin
  select * into v_cot from public.cotizaciones where id = p_cotizacion_id;
  if not found then raise exception 'Cotización % no encontrada', p_cotizacion_id; end if;
  if v_cot.estado <> 'aprobada' then
    raise exception 'La cotización debe estar APROBADA para generar el proyecto (estado actual: %)', v_cot.estado;
  end if;
  if v_cot.proyecto_id is not null then
    return v_cot.proyecto_id;
  end if;

  -- Costo directo y venta (de la vista)
  select costo_directo, subtotal into v_cd, v_subtotal
    from public.v_cotizacion_totales where id = p_cotizacion_id;

  v_cd := coalesce(v_cd, 0);
  v_subtotal := coalesce(v_subtotal, 0);
  v_factor_venta := case when v_cd > 0 then v_subtotal / v_cd else 1 end;

  -- Código secuencial del año
  select 'PRY-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
         lpad((coalesce(max(substring(codigo from 10)::int), 0) + 1)::text, 4, '0')
    into v_codigo_proyecto
    from public.proyectos
   where codigo like 'PRY-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-%';

  -- Crear proyecto
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

  -- Crear etapa única por defecto (la estructura de etapas se afina manualmente)
  insert into public.proyecto_etapas (proyecto_id, codigo, nombre, orden)
  values (v_proyecto_id, '01', 'Obra contratada', 10)
  returning id into v_etapa_id;

  -- Copiar partidas: el precio_unitario de la cotización es CD por unidad,
  -- el precio_unitario_venta = CD × factor_venta (incluye GG + utilidad, sin IGV)
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

  -- Back-ref en cotización
  update public.cotizaciones
     set proyecto_id = v_proyecto_id
   where id = p_cotizacion_id;

  raise notice 'Proyecto % creado desde cotización % con % partidas',
    v_codigo_proyecto, v_cot.codigo, v_count;

  return v_proyecto_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Trigger AFTER UPDATE en cotizaciones: si pasa a aprobada, generar proyecto
-- ---------------------------------------------------------------------
create or replace function public.fn_trigger_proyecto_desde_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'aprobada'
     and (old.estado is null or old.estado <> 'aprobada')
     and new.proyecto_id is null then
    perform public.fn_crear_proyecto_desde_cotizacion(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proyecto_desde_cotizacion on public.cotizaciones;
create trigger trg_proyecto_desde_cotizacion
  after update on public.cotizaciones
  for each row execute function public.fn_trigger_proyecto_desde_cotizacion();

-- =====================================================================
-- Vista resumen para listado de proyectos (incluye totales calculados)
-- =====================================================================
create or replace view public.v_proyectos_resumen as
  select
    p.id,
    p.codigo,
    p.nombre,
    p.estado,
    p.moneda,
    p.ubicacion,
    p.fecha_inicio,
    p.fecha_fin_plan,
    p.presupuesto_venta,
    p.presupuesto_costo,
    coalesce(sum(pp.monto_contractual_venta), 0) as total_partidas_venta,
    coalesce(sum(pp.monto_ejecutado_venta), 0)   as ejecutado_venta,
    case when coalesce(sum(pp.monto_contractual_venta),0) > 0
         then round(
                (coalesce(sum(pp.monto_ejecutado_venta),0)
                 / sum(pp.monto_contractual_venta) * 100)::numeric, 2)
         else 0
    end as porcentaje_avance,
    count(distinct pp.id) as partidas_count
  from public.proyectos p
  left join public.proyecto_partidas pp on pp.proyecto_id = p.id
  group by p.id;
