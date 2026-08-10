-- Alinea v_dashboard_proyecto.valorizado con el PDF: en vez de sumar el campo
-- guardado `monto_valorizado` (base inconsistente entre proyectos), lo deriva de
-- los valorizacion_items (base costo) × factor de precio (contrato / costo directo)
-- cuando el proyecto valoriza a precio. Así el dashboard/reportes cuadran con la
-- valorización emitida y no arrastran descuadres históricos.
create or replace view v_dashboard_proyecto as
select
  p.id as proyecto_id, p.codigo, p.nombre, p.linea_id, p.estado, p.tipo_proyecto,
  p.contrato_total as proyectado,
  coalesce((select sum(a.monto) from abonos_cliente a where a.proyecto_id = p.id), 0) as pagos,
  coalesce((select sum(s.monto) from solicitudes_pago s
            where s.proyecto_id = p.id and s.status in ('pagada','conciliada')), 0) as gasto,
  coalesce(
    (select sum(vi.total)
       from valorizaciones v
       join valorizacion_items vi on vi.valorizacion_id = v.id
      where v.proyecto_id = p.id), 0
  ) * (
    case
      when p.base_valorizacion = 'precio'
       and coalesce((select sum(pi.total_costo) from proyecto_items pi
                      where pi.proyecto_id = p.id and pi.es_hoja), 0) > 0
      then p.contrato_total / (select sum(pi.total_costo) from proyecto_items pi
                                where pi.proyecto_id = p.id and pi.es_hoja)
      else 1
    end
  ) as valorizado
from proyectos p;
