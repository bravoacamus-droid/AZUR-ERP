-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Fix cajas: caja central + caja chica por proyecto (Sección 5.7/7bis)  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 1) Caja central única (informativa, sin proyecto)
insert into cajas (proyecto_id, tipo, nombre, monto_maximo, saldo_inicial)
select null, 'central', 'Caja Central — AZUR', 0, 0
where not exists (select 1 from cajas where tipo = 'central');

-- 2) Backfill: cada proyecto debe tener su caja chica
insert into cajas (proyecto_id, tipo, nombre, monto_maximo, modalidad, saldo_inicial)
select p.id, 'chica', 'Caja chica — ' || p.nombre, coalesce(p.caja_maximo, 0), p.modalidad_cobro, 0
from proyectos p
where not exists (select 1 from cajas c where c.proyecto_id = p.id and c.tipo = 'chica');

-- 3) Inicializar la caja chica recién creada con su asignación operativa
--    (al contado o crédito arranca con el monto asignado como abono inicial).
insert into movimientos_caja (caja_id, proyecto_id, tipo, monto, concepto)
select c.id, c.proyecto_id, 'abono', c.monto_maximo,
       'Asignación inicial de caja chica'
from cajas c
where c.tipo = 'chica'
  and c.monto_maximo > 0
  and not exists (
    select 1 from movimientos_caja m
    where m.caja_id = c.id and m.concepto = 'Asignación inicial de caja chica'
  );
