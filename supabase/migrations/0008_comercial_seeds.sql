-- =====================================================================
-- AZUR ERP · Migration 0008 — Seeds Comercial (insumos base, cliente ejemplo)
-- =====================================================================
-- Datos semilla típicos del sector construcción peruano para arrancar.

-- Cliente demo
insert into public.clientes (razon_social, nombre_comercial, ruc, contacto, email, telefono, direccion)
values (
  'Inversiones Constructoras Lima S.A.C.',
  'Inversiones Lima',
  '20512345678',
  'Sr. Ricardo Quispe',
  'contacto@inversioneslima.pe',
  '+51 945 678 901',
  'Av. Javier Prado Este 1234, San Isidro, Lima'
)
on conflict (ruc) do nothing;

-- Insumos maestros típicos (mano de obra + materiales)
insert into public.insumos_maestros (codigo, descripcion, categoria, unidad, precio_unit) values
  -- Mano de obra (jornales referenciales Lima 2026)
  ('MO-001', 'Capataz',                              'mano_obra', 'hh', 28.50),
  ('MO-002', 'Operario',                             'mano_obra', 'hh', 23.50),
  ('MO-003', 'Oficial',                              'mano_obra', 'hh', 19.50),
  ('MO-004', 'Peón',                                 'mano_obra', 'hh', 17.00),

  -- Materiales (precios referenciales)
  ('MAT-001', 'Cemento Portland Tipo I (bls 42.5kg)', 'material',  'bls', 32.00),
  ('MAT-002', 'Arena gruesa',                         'material',  'm3',  85.00),
  ('MAT-003', 'Piedra chancada 1/2"',                 'material',  'm3',  92.00),
  ('MAT-004', 'Agua',                                 'material',  'm3',   8.00),
  ('MAT-005', 'Fierro corrugado 1/2"',                'material',  'kg',   4.20),
  ('MAT-006', 'Fierro corrugado 3/8"',                'material',  'kg',   4.10),
  ('MAT-007', 'Alambre #16 (recocido)',               'material',  'kg',   5.50),
  ('MAT-008', 'Madera tornillo (encofrado)',          'material',  'p2',   8.20),
  ('MAT-009', 'Clavos 3"',                            'material',  'kg',   6.80),
  ('MAT-010', 'Ladrillo King Kong 18 huecos',         'material',  'und',  1.10),

  -- Equipos
  ('EQ-001', 'Mezcladora trompo 9p3',                 'equipo',    'hm', 22.00),
  ('EQ-002', 'Vibradora de concreto 4HP',             'equipo',    'hm', 14.50),
  ('EQ-003', 'Herramientas manuales (3% mano de obra)','equipo',   'glb', 0.00),
  ('EQ-004', 'Andamio metálico (alquiler)',           'equipo',    'día', 28.00),

  -- Transporte y gastos generales típicos
  ('TR-001', 'Flete materiales en obra',              'transporte','glb', 0.00),
  ('GG-001', 'Gastos generales operativos',           'gasto_general','glb', 0.00)
on conflict (codigo) do update
  set descripcion = excluded.descripcion,
      categoria   = excluded.categoria,
      unidad      = excluded.unidad,
      precio_unit = excluded.precio_unit;

-- Cuadrillas típicas
insert into public.cuadrillas (codigo, nombre, descripcion) values
  ('CUAD-001', 'Cuadrilla concreto simple',  '1 capataz + 2 operarios + 1 oficial + 4 peones'),
  ('CUAD-002', 'Cuadrilla encofrado',        '1 capataz + 2 operarios carpinteros + 2 peones'),
  ('CUAD-003', 'Cuadrilla acero',            '1 capataz + 2 operarios fierreros + 2 peones'),
  ('CUAD-004', 'Cuadrilla albañilería',      '1 capataz + 2 operarios + 1 peón')
on conflict (codigo) do nothing;

-- Componentes de cuadrillas (vincula al insumo de mano de obra)
with cuadrillas_id as (
  select id, codigo from public.cuadrillas where codigo in ('CUAD-001','CUAD-002','CUAD-003','CUAD-004')
), insumos_id as (
  select id, codigo from public.insumos_maestros where codigo in ('MO-001','MO-002','MO-003','MO-004')
)
insert into public.cuadrilla_componentes (cuadrilla_id, insumo_id, cantidad)
select c.id, i.id, v.cant
from (values
  ('CUAD-001','MO-001',1),('CUAD-001','MO-002',2),('CUAD-001','MO-003',1),('CUAD-001','MO-004',4),
  ('CUAD-002','MO-001',1),('CUAD-002','MO-002',2),('CUAD-002','MO-004',2),
  ('CUAD-003','MO-001',1),('CUAD-003','MO-002',2),('CUAD-003','MO-004',2),
  ('CUAD-004','MO-001',1),('CUAD-004','MO-002',2),('CUAD-004','MO-004',1)
) as v(cuad_codigo, ins_codigo, cant)
join cuadrillas_id c on c.codigo = v.cuad_codigo
join insumos_id    i on i.codigo = v.ins_codigo
on conflict do nothing;

-- Partidas maestras de ejemplo (concreto simple + acero + encofrado)
insert into public.partidas_maestras (codigo, descripcion, unidad, cuadrilla_id, rendimiento) values
  ('02.01.01', 'Concreto f''c=210 kg/cm² para columnas',     'm3',  null, 15.00),
  ('02.02.01', 'Encofrado y desencofrado normal para columnas', 'm2', null, 12.00),
  ('02.03.01', 'Acero de refuerzo fy=4200 kg/cm²',             'kg', null, 250.00),
  ('03.01.01', 'Muro de ladrillo King Kong soga con mortero 1:5','m2', null, 9.50)
on conflict (codigo) do nothing;
