-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  AZUR ERP — Datos sembrados (demo). Idempotente por códigos/guards.    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── Líneas de negocio ──────────────────────────────────────────────────
insert into lineas_negocio (codigo, nombre, color) values
  ('CP',  'Cocina Pro',        '#BE1723'),
  ('AZC', 'Azur Construcción', '#E20627'),
  ('MNT', 'Mantenimiento',     '#9F1320')
on conflict (codigo) do nothing;

-- ── Medios de pago de la empresa (del modelo real) ─────────────────────
insert into medios_pago_empresa (banco, titular, cuenta_soles, cci_soles, es_detraccion, orden)
select 'BANCO INTERBANK', 'AZUR CONSTRUYE S.A.C.', '200-3002318715', '003-200-003002318715-33', false, 1
where not exists (select 1 from medios_pago_empresa where banco='BANCO INTERBANK');
insert into medios_pago_empresa (banco, titular, cuenta_soles, cci_soles, es_detraccion, orden)
select 'BANCO BBVA', 'AZUR CONSTRUYE S.A.C.', '0011-0787-0100039419', '011-787-000100039419-95', false, 2
where not exists (select 1 from medios_pago_empresa where banco='BANCO BBVA');
insert into medios_pago_empresa (banco, titular, cuenta_soles, cci_soles, es_detraccion, orden)
select 'BANCO DE LA NACIÓN', 'AZUR CONSTRUYE S.A.C.', '00017040456', '01801700001704045640', true, 3
where not exists (select 1 from medios_pago_empresa where es_detraccion = true);

-- ── Clientes ───────────────────────────────────────────────────────────
insert into clientes (razon_social, tipo_doc, ruc_dni, contacto_nombre, contacto_telefono, ubicacion, origen)
select 'ADECCO PERU S.A.', 'RUC', '20382984537', 'Área de Infraestructura', '5114000000',
       'Av. Circunvalación Club Golf Nro. 206 Int. 101B', 'directo'
where not exists (select 1 from clientes where ruc_dni='20382984537');
insert into clientes (razon_social, tipo_doc, ruc_dni, contacto_nombre, origen)
select 'MERCER PERÚ S.A.C.', 'RUC', '20509998881', 'Facilities', 'recomendacion'
where not exists (select 1 from clientes where ruc_dni='20509998881');
insert into clientes (razon_social, tipo_doc, ruc_dni, contacto_nombre, origen)
select 'INVERSIONES GADDI S.A.C.', 'RUC', '20556677001', 'Gerencia de Local', 'oficina'
where not exists (select 1 from clientes where ruc_dni='20556677001');

-- ── Contratistas / proveedores ─────────────────────────────────────────
insert into contrapartes (razon_social, tipo, ruc_dni, especialidad, banco, cuenta)
select * from (values
  ('CONSTRUCTORA DEL SUR E.I.R.L.', 'contratista'::tipo_contraparte, '20445566778', 'Estructuras', 'BCP', '191-1234567-0-01'),
  ('ACABADOS FINOS S.A.C.',         'contratista'::tipo_contraparte, '20556677889', 'Arquitectura',  'Interbank', '200-3009988776'),
  ('FERRETERÍA INDUSTRIAL LIMA',    'proveedor'::tipo_contraparte,   '20667788990', 'Materiales',    'BBVA', '0011-0111-2233445566'),
  ('VINILES & LAMINADOS PERÚ',      'proveedor'::tipo_contraparte,   '20778899001', 'Viniles',       'BCP', '191-7654321-0-02')
) v(razon_social, tipo, ruc_dni, especialidad, banco, cuenta)
where not exists (select 1 from contrapartes where razon_social = v.razon_social);

-- ── Catálogo de partidas e insumos ─────────────────────────────────────
insert into catalogo_partidas (linea_id, codigo, descripcion, unidad, costo_referencial)
select (select id from lineas_negocio where codigo='AZC'), c, d, u, p from (values
  ('PRE-001','Obras preliminares y provisionales','glb', 12000),
  ('EST-001','Concreto f''c=210 kg/cm2','m3', 4500),
  ('ARQ-001','Tabiquería drywall','m2', 95),
  ('VIN-001','Instalación de vinil decorativo','m2', 85),
  ('PIN-001','Pintura látex 2 manos','m2', 22)
) t(c,d,u,p)
where not exists (select 1 from catalogo_partidas where codigo = t.c);

insert into catalogo_insumos (codigo, nombre, unidad, precio, tipo)
select * from (values
  ('CEM-01','Cemento Portland Tipo I','bls', 32.5,'material'),
  ('FIE-01','Acero corrugado 1/2"','var', 28.0,'material'),
  ('MO-CAL','Mano de obra calificada','hh', 18.0,'mano_obra'),
  ('MO-NOC','Mano de obra no calificada','hh', 11.0,'mano_obra')
) v(c,n,u,p,t)
where not exists (select 1 from catalogo_insumos where codigo = v.c);

-- ── Plantilla de cotización (modelo real ADECCO como base editable) ─────
insert into plantillas_cotizacion (linea_id, nombre, condiciones, servicios_incluidos, servicios_omitidos, garantia)
select (select id from lineas_negocio where codigo='AZC'),
  'Plantilla estándar AZUR',
  'Condiciones generales de contratación AZUR CONSTRUYE S.A.C.',
  E'• Servicio a todo costo e incluye impuestos.\n• Equipo técnico de campo, logístico y de supervisión.\n• El servicio de limpieza es sobre los ambientes trabajados y será limpieza de obra.\n• Seguros contra todo riesgo (SCTR) del personal de AZUR CONSTRUYE S.A.C.',
  E'• Ejecución de partidas fuera del proyecto aprobado.\n• Servicio de limpieza a fondo.\n• Cualquier tipo de póliza y cartas fianzas a excepción del SCTR.',
  'La empresa otorgará una garantía de hasta 1 año calendario posterior a la entrega de obra, correspondiente a mano de obra y/o suministro de materiales según el trabajo realizado.'
where not exists (select 1 from plantillas_cotizacion where nombre='Plantilla estándar AZUR');

-- ── Inventario de almacén (base) ───────────────────────────────────────
insert into inventario_items (codigo, nombre, unidad, stock, tipo)
select v.c, v.n, v.u, v.s, v.t::tipo_inventario from (values
  ('HER-001','Taladro percutor', 'und', 5, 'herramienta'),
  ('HER-002','Andamio certificado','cuerpo', 12, 'herramienta'),
  ('MAT-001','Cemento Portland Tipo I','bls', 200, 'material'),
  ('CON-001','Cinta de señalización','rollo', 30, 'consumible')
) v(c,n,u,s,t)
where not exists (select 1 from inventario_items where codigo = v.c);
