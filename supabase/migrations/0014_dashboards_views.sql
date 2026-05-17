-- =====================================================================
-- AZUR ERP · Migration 0014 — Vistas y agregaciones para Dashboards
-- =====================================================================

-- Cartera global por estado
create or replace view public.v_dashboard_cartera as
  select
    p.estado,
    count(*)::int as cantidad,
    coalesce(sum(p.presupuesto_venta), 0) as monto_contrato
  from public.proyectos p
  where p.estado <> 'cancelado'
  group by p.estado;

-- Gasto por categoría de solicitud (todos los proyectos activos)
create or replace view public.v_dashboard_gasto_categoria as
  select
    s.categoria,
    count(*)::int as cantidad,
    coalesce(sum(s.monto), 0) as total
  from public.solicitudes_pago s
  where s.estado in ('aprobada_jefe','programada','pagada')
  group by s.categoria
  order by total desc;

-- Avance financiero vs físico por proyecto (para detectar sobrecostos)
create or replace view public.v_dashboard_avance_vs_gasto as
  select
    p.id,
    p.codigo,
    p.nombre,
    p.estado,
    p.presupuesto_venta,
    coalesce(sum(pp.monto_contractual_venta), 0) as contractual,
    coalesce(sum(pp.monto_ejecutado_venta), 0) as ejecutado_venta,
    coalesce((
      select sum(monto)
      from public.solicitudes_pago s
      where s.proyecto_id = p.id and s.estado = 'pagada'
    ), 0) as gastado_real,
    case when coalesce(sum(pp.monto_contractual_venta), 0) > 0
         then round((sum(pp.monto_ejecutado_venta) / sum(pp.monto_contractual_venta) * 100)::numeric, 2)
         else 0
    end as pct_avance
  from public.proyectos p
  left join public.proyecto_partidas pp on pp.proyecto_id = p.id
  where p.estado <> 'cancelado'
  group by p.id;

-- Solicitudes por estado (counts)
create or replace view public.v_dashboard_solicitudes as
  select
    estado,
    count(*)::int as cantidad,
    coalesce(sum(monto), 0) as total
  from public.solicitudes_pago
  group by estado;

-- Actividad últimos 30 días por día
create or replace view public.v_dashboard_actividad_30d as
  select
    date_trunc('day', occurred_at)::date as dia,
    count(*) filter (where action = 'INSERT')::int as inserts,
    count(*) filter (where action = 'UPDATE')::int as updates,
    count(*) filter (where action = 'DELETE')::int as deletes,
    count(*)::int as total
  from public.audit_log
  where occurred_at >= now() - interval '30 days'
  group by 1
  order by 1;
