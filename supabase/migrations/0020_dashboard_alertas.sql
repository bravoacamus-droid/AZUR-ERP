-- =====================================================================
-- AZUR ERP · Migration 0020 — Extender vista de dashboard con campos
-- requeridos por el motor de alertas (fechas + coordenadas).
-- =====================================================================

drop view if exists public.v_dashboard_avance_vs_gasto;

create view public.v_dashboard_avance_vs_gasto as
  select
    p.id,
    p.codigo,
    p.nombre,
    p.estado,
    p.presupuesto_venta,
    p.fecha_inicio,
    p.fecha_fin_plan,
    p.fecha_fin_real,
    p.latitud,
    p.longitud,
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
