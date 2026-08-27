-- Caja Chica es un PEDIDO de fondos, no un gasto del proyecto: se excluye del
-- gasto acumulado. Lo realmente gastado se registra como "Otros gastos" (u otras
-- categorías), que sí suma. El valorizado se mantiene igual que 0053.
create or replace view v_dashboard_proyecto as
select
  p.id as proyecto_id, p.codigo, p.nombre, p.linea_id, p.estado, p.tipo_proyecto,
  p.contrato_total as proyectado,
  coalesce((select sum(a.monto) from abonos_cliente a where a.proyecto_id = p.id), 0) as pagos,
  coalesce((select sum(s.monto) from solicitudes_pago s
            where s.proyecto_id = p.id and s.status in ('pagada','conciliada')
              and s.tipo <> 'caja_chica'), 0) as gasto,
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
