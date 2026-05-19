-- =====================================================================
-- AZUR ERP · Migration 0022 — Catálogo seed de herramientas/materiales/EPP
--                              + vista de stock disponible por proyecto
-- =====================================================================

-- ---------------------------------------------------------------------
-- Seed de insumos típicos de obra (herramientas + materiales + EPP)
-- Códigos prefijados (HER-, MAT-, EPP-) para distinguirlos de los del
-- catálogo de cotizaciones (que usan INS-).
-- on conflict do nothing → idempotente, no machaca data existente.
-- ---------------------------------------------------------------------
insert into public.insumos_maestros (codigo, descripcion, categoria, unidad, precio_unit, notas, activo)
values
  -- HERRAMIENTAS / EQUIPOS
  ('HER-0001', 'Taladro percutor Bosch GBH 2-26',          'equipo',   'und',  650.00, 'Devolver con maletín',         true),
  ('HER-0002', 'Rotomartillo Makita HR2470',                'equipo',   'und',  890.00, 'Devolver con brocas',          true),
  ('HER-0003', 'Esmeril angular Dewalt 4½"',                'equipo',   'und',  320.00, NULL,                           true),
  ('HER-0004', 'Sierra circular Skil 7¼" 1400W',            'equipo',   'und',  450.00, NULL,                           true),
  ('HER-0005', 'Atornillador eléctrico Bosch GSR 12V',      'equipo',   'und',  380.00, 'Devolver con batería + carg.', true),
  ('HER-0006', 'Compactadora vibratoria tipo plancha',      'equipo',   'und', 4500.00, 'Solo con autorización',        true),
  ('HER-0007', 'Vibrador de concreto 1HP manguera 4m',      'equipo',   'und', 1800.00, NULL,                           true),
  ('HER-0008', 'Mezcladora de concreto 9 p3',               'equipo',   'und', 6200.00, NULL,                           true),
  ('HER-0009', 'Andamio modular cuerpo 1.5m',               'equipo',   'und',  320.00, 'Devolver completo c/seguros',  true),
  ('HER-0010', 'Plancha topadora bobcat',                   'equipo',   'und', 2800.00, NULL,                           true),
  ('HER-0011', 'Escalera telescópica de aluminio 6 m',      'equipo',   'und',  580.00, NULL,                           true),
  ('HER-0012', 'Soldadora MIG/MAG Indura 250A',             'equipo',   'und', 2200.00, NULL,                           true),
  ('HER-0013', 'Generador eléctrico 5 kVA',                 'equipo',   'und', 3800.00, 'Devolver con combustible',     true),
  ('HER-0014', 'Bomba sumergible 2" 1HP',                   'equipo',   'und',  890.00, NULL,                           true),
  ('HER-0015', 'Compresor de aire 25 lt 2HP',               'equipo',   'und', 1500.00, NULL,                           true),
  ('HER-0016', 'Carretilla buggy reforzada',                'equipo',   'und',  180.00, NULL,                           true),
  ('HER-0017', 'Pico, pala, comba, barreta (set)',          'equipo',   'und',   95.00, NULL,                           true),
  ('HER-0018', 'Wincha 5m Stanley',                         'equipo',   'und',   25.00, NULL,                           true),
  ('HER-0019', 'Nivel de mano 60 cm',                       'equipo',   'und',   35.00, NULL,                           true),
  ('HER-0020', 'Plomada de acero',                          'equipo',   'und',   18.00, NULL,                           true),

  -- MATERIALES
  ('MAT-0001', 'Cemento Sol Tipo I bolsa 42.5 kg',          'material', 'bls',   28.50, NULL,                           true),
  ('MAT-0002', 'Cemento Andino Tipo I bolsa 42.5 kg',       'material', 'bls',   27.50, NULL,                           true),
  ('MAT-0003', 'Cemento Quisqueya Tipo I bolsa 42.5 kg',    'material', 'bls',   27.00, NULL,                           true),
  ('MAT-0004', 'Arena gruesa de río',                       'material', 'm3',    70.00, NULL,                           true),
  ('MAT-0005', 'Arena fina',                                'material', 'm3',    75.00, NULL,                           true),
  ('MAT-0006', 'Piedra chancada ½"',                        'material', 'm3',    85.00, NULL,                           true),
  ('MAT-0007', 'Piedra chancada ¾"',                        'material', 'm3',    85.00, NULL,                           true),
  ('MAT-0008', 'Fierro corrugado 8 mm varilla 9 m',         'material', 'und',   18.00, NULL,                           true),
  ('MAT-0009', 'Fierro corrugado ½" varilla 9 m',           'material', 'und',   42.00, NULL,                           true),
  ('MAT-0010', 'Fierro corrugado ⅜" varilla 9 m',           'material', 'und',   28.00, NULL,                           true),
  ('MAT-0011', 'Alambre negro N°16',                        'material', 'kg',     6.50, NULL,                           true),
  ('MAT-0012', 'Alambre negro N°8',                         'material', 'kg',     6.20, NULL,                           true),
  ('MAT-0013', 'Clavo común 2"',                            'material', 'kg',     7.80, NULL,                           true),
  ('MAT-0014', 'Clavo común 3"',                            'material', 'kg',     7.50, NULL,                           true),
  ('MAT-0015', 'Tubo PVC 4" desagüe x 3 m',                 'material', 'und',   45.00, NULL,                           true),
  ('MAT-0016', 'Codo PVC 4" desagüe 90°',                   'material', 'und',   12.00, NULL,                           true),
  ('MAT-0017', 'Tubo PVC ½" agua x 3 m',                    'material', 'und',   14.00, NULL,                           true),
  ('MAT-0018', 'Cable eléctrico THW N°14 AWG',              'material', 'm',      1.80, NULL,                           true),
  ('MAT-0019', 'Tomacorriente doble universal',             'material', 'und',    8.50, NULL,                           true),
  ('MAT-0020', 'Interruptor simple',                        'material', 'und',    6.00, NULL,                           true),
  ('MAT-0021', 'Plancha drywall ⅝" 1.22×2.44 m',            'material', 'und',   38.00, NULL,                           true),
  ('MAT-0022', 'Perfil drywall stud calibre 26 × 2.44 m',   'material', 'und',   15.00, NULL,                           true),
  ('MAT-0023', 'Mayólica 25×40 cm primera',                 'material', 'm2',    32.00, NULL,                           true),
  ('MAT-0024', 'Porcelanato 60×60 cm rectificado',          'material', 'm2',    78.00, NULL,                           true),
  ('MAT-0025', 'Pegamento cerámico bolsa 25 kg',            'material', 'bls',   28.00, NULL,                           true),
  ('MAT-0026', 'Pintura látex galón',                       'material', 'gal',   75.00, NULL,                           true),
  ('MAT-0027', 'Pintura esmalte galón',                     'material', 'gal',   85.00, NULL,                           true),
  ('MAT-0028', 'Tiner galón',                               'material', 'gal',   45.00, NULL,                           true),
  ('MAT-0029', 'Brocha 4"',                                 'material', 'und',   18.00, NULL,                           true),
  ('MAT-0030', 'Rodillo de lana 9"',                        'material', 'und',   22.00, NULL,                           true),

  -- EPP (registrado como material, distinguido por código)
  ('EPP-0001', 'Casco de seguridad clase E con barbiquejo', 'material', 'und',   28.00, 'EPP obligatorio en obra',      true),
  ('EPP-0002', 'Chaleco reflectivo naranja',                'material', 'und',   22.00, 'EPP obligatorio en obra',      true),
  ('EPP-0003', 'Lentes de seguridad claros',                'material', 'und',   12.00, 'EPP obligatorio en obra',      true),
  ('EPP-0004', 'Guantes de cuero',                          'material', 'par',   18.00, NULL,                           true),
  ('EPP-0005', 'Guantes anticorte nivel 5',                 'material', 'par',   28.00, NULL,                           true),
  ('EPP-0006', 'Botín punta de acero',                      'material', 'par',  115.00, 'EPP obligatorio en obra',      true),
  ('EPP-0007', 'Mascarilla N95',                            'material', 'und',    8.50, NULL,                           true),
  ('EPP-0008', 'Arnés de cuerpo entero',                    'material', 'und',  185.00, 'Obligatorio para trabajo en altura', true),
  ('EPP-0009', 'Línea de vida con absorbedor 1.8 m',        'material', 'und',  125.00, 'Obligatorio para trabajo en altura', true),
  ('EPP-0010', 'Tapón auditivo desechable',                 'material', 'par',    2.50, NULL,                           true)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------
-- Vista de stock disponible por proyecto + insumo
-- Suma salidas - devoluciones. Si disponible > 0, hay material/herramientas
-- prestados/entregados sin devolver. Si < 0, hubo más devoluciones que salidas
-- (puede ser ingreso inicial sin registrar salida — investigar).
-- Cubre tanto movimientos con insumo_id como con texto libre.
-- ---------------------------------------------------------------------
drop view if exists public.v_almacen_stock;
create view public.v_almacen_stock as
  select
    am.proyecto_id,
    p.codigo as proyecto_codigo,
    p.nombre as proyecto_nombre,
    am.insumo_id,
    coalesce(i.codigo, '—') as insumo_codigo,
    coalesce(i.descripcion, am.descripcion) as descripcion,
    coalesce(i.categoria::text, 'libre') as categoria,
    am.unidad,
    sum(case when am.tipo = 'salida' then am.cantidad else 0 end)::numeric(14,4) as total_salidas,
    sum(case when am.tipo = 'devolucion' then am.cantidad else 0 end)::numeric(14,4) as total_devoluciones,
    sum(case when am.tipo = 'salida' then am.cantidad else -am.cantidad end)::numeric(14,4) as disponible,
    max(am.fecha) as ultimo_movimiento,
    count(*)::int as cantidad_movimientos
  from public.almacen_movimientos am
  left join public.proyectos p on p.id = am.proyecto_id
  left join public.insumos_maestros i on i.id = am.insumo_id
  group by am.proyecto_id, p.codigo, p.nombre, am.insumo_id, i.codigo, i.descripcion, i.categoria, am.descripcion, am.unidad;

comment on view public.v_almacen_stock is 'Saldo disponible por proyecto e insumo: salidas - devoluciones';
