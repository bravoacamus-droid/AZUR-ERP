drop view if exists v_cajas_saldos cascade;
create view v_cajas_saldos as
select
  c.id as caja_id, c.proyecto_id, c.tipo, c.nombre, c.monto_maximo,
  c.saldo_inicial, c.responsable_id, c.asignacion_semanal,
  pr.nombre as responsable_nombre,
  coalesce(sum(case
    when m.tipo in ('abono','reposicion') then m.monto
    when m.tipo = 'egreso' then -m.monto
    else m.monto end), 0) as movimientos,
  c.saldo_inicial + coalesce(sum(case
    when m.tipo in ('abono','reposicion') then m.monto
    when m.tipo = 'egreso' then -m.monto
    else m.monto end), 0) as saldo_actual
from cajas c
left join movimientos_caja m on m.caja_id = c.id
left join profiles pr on pr.id = c.responsable_id
group by c.id, pr.nombre;
grant select on v_cajas_saldos to authenticated, service_role;
