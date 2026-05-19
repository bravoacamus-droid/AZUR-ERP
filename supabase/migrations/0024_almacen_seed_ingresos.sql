-- =====================================================================
-- AZUR ERP · Migration 0024 — Seed inicial del almacén central
-- Idempotente: solo siembra si NO hay ingresos previos.
-- =====================================================================

do $$
declare
  v_ingresos_existentes int;
  v_proveedor_default text := 'Stock inicial del almacén';
  v_fecha date := current_date - interval '7 days';
begin
  select count(*) into v_ingresos_existentes
  from public.almacen_movimientos where tipo = 'ingreso';

  if v_ingresos_existentes > 0 then
    raise notice 'Ya existen % ingresos — skip seed', v_ingresos_existentes;
    return;
  end if;

  raise notice 'Sembrando ingresos iniciales al almacén central...';

  insert into public.almacen_movimientos (
    proyecto_id, tipo, insumo_id, descripcion, cantidad, unidad,
    proveedor, numero_documento, costo_unit, fecha, notas
  )
  select
    null,
    'ingreso',
    i.id,
    i.descripcion,
    seed.cantidad,
    i.unidad,
    v_proveedor_default,
    'STOCK-INI-' || i.codigo,
    i.precio_unit,
    v_fecha,
    'Stock inicial sembrado en la implementación del sistema'
  from public.insumos_maestros i
  join (
    values
      ('HER-0001', 3),
      ('HER-0002', 2),
      ('HER-0003', 4),
      ('HER-0004', 2),
      ('HER-0005', 5),
      ('HER-0006', 1),
      ('HER-0007', 2),
      ('HER-0008', 1),
      ('HER-0009', 20),
      ('HER-0010', 1),
      ('HER-0011', 3),
      ('HER-0012', 1),
      ('HER-0013', 2),
      ('HER-0014', 2),
      ('HER-0015', 2),
      ('HER-0016', 6),
      ('HER-0017', 8),
      ('HER-0018', 15),
      ('HER-0019', 10),
      ('HER-0020', 8),
      ('MAT-0001', 200),
      ('MAT-0002', 100),
      ('MAT-0003', 50),
      ('MAT-0004', 30),
      ('MAT-0005', 25),
      ('MAT-0006', 40),
      ('MAT-0007', 35),
      ('MAT-0008', 150),
      ('MAT-0009', 100),
      ('MAT-0010', 120),
      ('MAT-0011', 40),
      ('MAT-0012', 30),
      ('MAT-0013', 25),
      ('MAT-0014', 25),
      ('MAT-0015', 40),
      ('MAT-0016', 30),
      ('MAT-0017', 50),
      ('MAT-0018', 500),
      ('MAT-0019', 30),
      ('MAT-0020', 40),
      ('MAT-0021', 80),
      ('MAT-0022', 60),
      ('MAT-0023', 100),
      ('MAT-0024', 60),
      ('MAT-0025', 30),
      ('MAT-0026', 20),
      ('MAT-0027', 15),
      ('MAT-0028', 10),
      ('MAT-0029', 12),
      ('MAT-0030', 10),
      ('EPP-0001', 20),
      ('EPP-0002', 20),
      ('EPP-0003', 30),
      ('EPP-0004', 25),
      ('EPP-0005', 15),
      ('EPP-0006', 18),
      ('EPP-0007', 100),
      ('EPP-0008', 6),
      ('EPP-0009', 6),
      ('EPP-0010', 50)
  ) as seed(codigo, cantidad) on seed.codigo = i.codigo;

  raise notice 'Seed completado';
end $$;
