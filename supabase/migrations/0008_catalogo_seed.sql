-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Catálogo amplio de partidas e insumos (referenciales, editables).     ║
-- ║  Idempotente por código. Precios S/ aproximados de mercado (Perú).     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

insert into catalogo_partidas (linea_id, codigo, descripcion, unidad, costo_referencial)
select (select id from lineas_negocio where codigo = v.linea), v.cod, v.descr, v.und, v.precio
from (values
  -- Obras preliminares y provisionales
  ('AZC','OP-001','Cartel de obra gigantografía 3.60x2.40m','und',450),
  ('AZC','OP-002','Caseta de guardianía y almacén','m2',180),
  ('AZC','OP-003','Cerco provisional con malla raschel','m',35),
  ('AZC','OP-004','Trazo, niveles y replanteo','m2',3.5),
  ('AZC','OP-005','Movilización y desmovilización de equipos','glb',2500),
  ('AZC','OP-006','Baño portátil (alquiler mensual)','mes',350),
  ('AZC','OP-007','Energía y agua para construcción','glb',1800),
  -- Movimiento de tierras
  ('AZC','MOV-001','Excavación manual en terreno normal','m3',45),
  ('AZC','MOV-002','Excavación con maquinaria','m3',18),
  ('AZC','MOV-003','Relleno y compactación con material propio','m3',28),
  ('AZC','MOV-004','Eliminación de material excedente','m3',38),
  ('AZC','MOV-005','Nivelación y compactación de terreno','m2',8.5),
  -- Estructuras
  ('AZC','EST-002','Concreto f''c=175 kg/cm2 en cimientos','m3',400),
  ('AZC','EST-003','Encofrado y desencofrado de columnas','m2',55),
  ('AZC','EST-004','Encofrado y desencofrado de vigas','m2',60),
  ('AZC','EST-005','Encofrado y desencofrado de losas','m2',50),
  ('AZC','EST-006','Acero corrugado fy=4200 kg/cm2','kg',6.5),
  ('AZC','EST-007','Concreto f''c=210 en zapatas','m3',430),
  ('AZC','EST-008','Losa aligerada h=20cm','m2',145),
  ('AZC','EST-009','Columnas de concreto armado','m3',480),
  ('AZC','EST-010','Placas de concreto armado','m3',470),
  -- Albañilería
  ('AZC','ALB-001','Muro de ladrillo King Kong de soga','m2',78),
  ('AZC','ALB-002','Muro de ladrillo King Kong de cabeza','m2',95),
  ('AZC','ALB-003','Tarrajeo de muros interiores','m2',32),
  ('AZC','ALB-004','Tarrajeo de cielo raso','m2',38),
  ('AZC','ALB-005','Tarrajeo de columnas y vigas','m2',42),
  -- Arquitectura / cielos
  ('AZC','ARQ-002','Tabiquería drywall resistente a humedad','m2',110),
  ('AZC','ARQ-003','Cielo raso baldosa acústica 60x60','m2',85),
  ('AZC','ARQ-004','Cielo raso de drywall','m2',92),
  ('AZC','ARQ-005','Falso cielo raso desmontable','m2',78),
  -- Pisos
  ('AZC','PIS-001','Piso porcelanato 60x60','m2',120),
  ('AZC','PIS-002','Piso cerámico 45x45','m2',75),
  ('AZC','PIS-003','Piso vinílico LVT','m2',95),
  ('AZC','PIS-004','Piso laminado','m2',85),
  ('AZC','PIS-005','Contrapiso e=4cm','m2',38),
  ('AZC','PIS-006','Piso de cemento pulido','m2',45),
  ('AZC','PIS-007','Zócalo de porcelanato h=10cm','m',28),
  ('AZC','PIS-008','Alfombra modular en losetas','m2',110),
  -- Pintura
  ('AZC','PIN-002','Pintura látex en cielo raso','m2',24),
  ('AZC','PIN-003','Empastado de muros','m2',18),
  ('AZC','PIN-004','Pintura epóxica para pisos','m2',55),
  ('AZC','PIN-005','Pintura esmalte en carpintería metálica','m2',32),
  -- Carpintería
  ('AZC','CAR-001','Puerta contraplacada MDF','und',480),
  ('AZC','CAR-002','Puerta cortafuego 60 min','und',1850),
  ('AZC','CAR-003','Mueble bajo de melamina','m',420),
  ('AZC','CAR-004','Mueble alto de melamina','m',350),
  ('AZC','CAR-005','Closet de melamina','m2',380),
  -- Vidrios y aluminio
  ('AZC','VID-001','Mampara de vidrio templado 10mm','m2',320),
  ('AZC','VID-002','Ventana de aluminio con vidrio','m2',240),
  ('AZC','VID-003','Puerta de vidrio templado','und',950),
  ('AZC','VID-004','División de baño en vidrio templado','m2',280),
  -- Instalaciones eléctricas
  ('AZC','IIE-001','Salida de alumbrado','pto',85),
  ('AZC','IIE-002','Salida de tomacorriente','pto',95),
  ('AZC','IIE-003','Tablero de distribución 12 polos','und',850),
  ('AZC','IIE-004','Luminaria LED panel 60x60','und',145),
  ('AZC','IIE-005','Punto de red de datos','pto',120),
  ('AZC','IIE-006','Pozo a tierra','und',1200),
  ('AZC','IIE-007','Tubería conduit y accesorios','m',12),
  -- Instalaciones sanitarias
  ('AZC','IIS-001','Salida de agua fría','pto',110),
  ('AZC','IIS-002','Salida de desagüe','pto',130),
  ('AZC','IIS-003','Inodoro one piece (incl. instalación)','und',650),
  ('AZC','IIS-004','Lavatorio con pedestal','und',380),
  ('AZC','IIS-005','Red de agua tubería PVC','m',18),
  ('AZC','IIS-006','Red de desagüe PVC 4"','m',28),
  -- Agua contra incendio / detección
  ('AZC','ACI-001','Rociador contra incendio','und',180),
  ('AZC','ACI-002','Detector de humo','und',145),
  ('AZC','ACI-003','Gabinete contra incendio','und',980),
  -- HVAC
  ('AZC','CLI-001','Equipo split 24000 BTU (incl. instalación)','und',3200),
  ('AZC','CLI-002','Ducto de aire acondicionado','m2',220),
  ('AZC','CLI-003','Extractor de aire','und',380),
  -- Viniles / retail / señalética
  ('AZC','VIN-002','Lámina de seguridad para vidrios','m2',75),
  ('AZC','VIN-003','Vinil esmerilado / pavonado','m2',65),
  ('AZC','VIN-004','Impresión y montaje de gigantografía','m2',95),
  ('AZC','VIN-005','Letrero corpóreo iluminado','und',1500),
  -- Limpieza y mantenimiento (línea Mantenimiento)
  ('MNT','LIM-001','Limpieza de obra final','m2',6),
  ('MNT','LIM-002','Limpieza profunda post construcción','m2',12),
  ('MNT','MAN-001','Mantenimiento preventivo de luminarias','pto',25),
  ('MNT','MAN-002','Cambio de faceplate','und',18),
  ('MNT','MAN-003','Pintado de mantenimiento','m2',20),
  ('MNT','MAN-004','Mantenimiento de aire acondicionado','und',180),
  ('MNT','MAN-005','Mantenimiento de pozo a tierra','und',350),
  -- Cocina Pro (línea Cocina)
  ('CP','COC-001','Campana extractora industrial','m',1200),
  ('CP','COC-002','Mesa de trabajo en acero inoxidable','m',850),
  ('CP','COC-003','Lavadero industrial 2 pozas','und',1400),
  ('CP','COC-004','Instalación de línea de gas','m',95),
  ('CP','COC-005','Piso antideslizante para cocina','m2',130),
  ('CP','COC-006','Trampa de grasa','und',1800),
  ('CP','COC-007','Mueble alacena en acero inoxidable','m',780)
) v(linea, cod, descr, und, precio)
where not exists (select 1 from catalogo_partidas cp where cp.codigo = v.cod);

-- ── Insumos maestros ───────────────────────────────────────────────────
insert into catalogo_insumos (codigo, nombre, unidad, precio, tipo)
select v.cod, v.nom, v.und, v.precio, v.tipo
from (values
  ('AGR-01','Arena gruesa','m3',65,'material'),
  ('AGR-02','Piedra chancada 1/2"','m3',75,'material'),
  ('AGR-03','Hormigón','m3',60,'material'),
  ('LAD-01','Ladrillo King Kong 18 huecos','und',1.2,'material'),
  ('LAD-02','Ladrillo pandereta','und',0.9,'material'),
  ('DRY-01','Plancha drywall 1/2" estándar','und',38,'material'),
  ('DRY-02','Plancha drywall resistente a humedad','und',52,'material'),
  ('PAR-01','Parante metálico 90mm','und',22,'material'),
  ('RIE-01','Riel metálico 90mm','und',20,'material'),
  ('POR-01','Porcelanato 60x60','m2',75,'material'),
  ('CER-01','Cerámico 45x45','m2',38,'material'),
  ('PIN-LAT','Pintura látex (galón)','gln',45,'material'),
  ('PIN-ESM','Pintura esmalte (galón)','gln',55,'material'),
  ('EMP-01','Empaste en pasta (bolsa)','bls',28,'material'),
  ('TUB-D4','Tubería PVC desagüe 4"','und',35,'material'),
  ('TUB-A12','Tubería CPVC agua 1/2"','und',12,'material'),
  ('CAB-14','Cable THW 14 AWG','m',2.2,'material'),
  ('CON-34','Tubería conduit 3/4"','und',8,'material'),
  ('INT-01','Interruptor simple','und',12,'material'),
  ('TOM-02','Tomacorriente doble','und',15,'material'),
  ('LED-60','Panel LED 60x60 40W','und',95,'material'),
  ('MO-OPE','Operario','hh',23,'mano_obra'),
  ('MO-OFI','Oficial','hh',19,'mano_obra'),
  ('MO-PEO','Peón','hh',15,'mano_obra'),
  ('EQ-MEZ','Mezcladora de concreto','hm',35,'equipos'),
  ('EQ-VIB','Vibradora de concreto','hm',18,'equipos'),
  ('EQ-AND','Andamio certificado (alquiler/día)','dia',25,'equipos')
) v(cod, nom, und, precio, tipo)
where not exists (select 1 from catalogo_insumos ci where ci.codigo = v.cod);
