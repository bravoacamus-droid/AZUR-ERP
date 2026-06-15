-- Proyecto demo ADECCO + cotización + valorización + finanzas (idempotente por código)
do $$
declare
  v_linea uuid := (select id from lineas_negocio where codigo='AZC');
  v_cliente uuid := (select id from clientes where ruc_dni='20382984537');
  v_cli_gaddi uuid := (select id from clientes where ruc_dni='20556677001');
  v_jefe uuid := (select id from profiles where email='proyectos@azur.pe');
  v_resi uuid := (select id from profiles where email='residente@azur.pe');
  v_soma uuid := (select id from profiles where email='soma@azur.pe');
  v_admin uuid := (select id from profiles where email='admin@azur.pe');
  v_comercial uuid := (select id from profiles where email='comercial@azur.pe');
  v_proy uuid;
  v_proy2 uuid;
  v_caja uuid;
  v_val uuid;
  v_pg1 uuid; v_pg2 uuid; v_pg3 uuid; v_pg4 uuid;
  v_it uuid;
  v_contra uuid := (select id from contrapartes where razon_social='ACABADOS FINOS S.A.C.');
  rec record;
begin
  if exists (select 1 from proyectos where codigo='PROY-0001') then
    raise notice 'demo ya sembrado, skip'; return;
  end if;

  -- ── Proyecto principal (sano) ───────────────────────────────────────
  insert into proyectos (codigo, linea_id, cliente_id, nombre, direccion, tipo_proyecto, estado,
      modalidad_cobro, jefe_id, fecha_inicio, fecha_fin, contrato_total, adelanto_pct, caja_maximo)
  values ('PROY-0001', v_linea, v_cliente, 'ADECCO — Instalación de viniles y laminados',
      'Av. Circunvalación Club Golf 206, Surco', 'grande', 'en_ejecucion',
      'credito', v_jefe, current_date - 25, current_date + 20, 4324194.94, 0.20, 50000)
  returning id into v_proy;

  -- equipo de obra (residente + prevencionista)
  insert into proyecto_equipo (proyecto_id, profile_id, rol_obra) values
    (v_proy, v_jefe, 'jefe'), (v_proy, v_resi, 'residente'), (v_proy, v_soma, 'prevencionista');

  -- itemizado (árbol). Partidas generales (nivel1, no hoja) + sub partidas (hoja)
  insert into proyecto_items (proyecto_id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, total_costo)
    values (v_proy, null, 1, 1, '1.0', 'PARTIDA GENERAL 1 — Obras preliminares', false, 0) returning id into v_pg1;
  insert into proyecto_items (proyecto_id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, total_costo)
    values (v_proy, null, 1, 2, '2.0', 'PARTIDA GENERAL 2 — Estructuras', false, 0) returning id into v_pg2;
  insert into proyecto_items (proyecto_id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, total_costo)
    values (v_proy, null, 1, 3, '3.0', 'PARTIDA GENERAL 3 — Arquitectura', false, 0) returning id into v_pg3;
  insert into proyecto_items (proyecto_id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, total_costo)
    values (v_proy, null, 1, 4, '4.0', 'PARTIDA GENERAL 4 — Instalaciones', false, 0) returning id into v_pg4;

  -- hojas con costo, contratista, fechas
  insert into proyecto_items (proyecto_id, parent_id, nivel, orden, item_codigo, titulo, unidad, cantidad, costo_unitario, total_costo, contratista_id, fecha_inicio, fecha_entrega, duracion_dias, es_hoja, estado_tarea, prioridad)
  values
    (v_proy, v_pg1, 2, 1, '1.1', 'Cerco y señalización', 'glb', 1, 240000, 240000, v_contra, current_date-25, current_date-6, 19, true, 'completado', 'baja'),
    (v_proy, v_pg1, 2, 2, '1.2', 'Instalaciones provisionales', 'glb', 1, 175000, 175000, v_contra, current_date-20, current_date-2, 18, true, 'en_progreso', 'media'),
    (v_proy, v_pg2, 2, 1, '2.1', 'Concreto armado', 'm3', 100, 4500, 450000, v_contra, current_date-15, current_date+5, 20, true, 'en_progreso', 'alta'),
    (v_proy, v_pg2, 2, 2, '2.2', 'Acero de refuerzo', 'kg', 5000, 6, 300000, v_contra, current_date-10, current_date+8, 18, true, 'en_progreso', 'media'),
    (v_proy, v_pg3, 2, 1, '3.1', 'Tabiquería y acabados', 'm2', 800, 95, 76000, v_contra, current_date-5, current_date+12, 17, true, 'en_progreso', 'alta'),
    (v_proy, v_pg3, 2, 2, '3.2', 'Instalación de viniles', 'm2', 1200, 85, 102000, v_contra, current_date, current_date+15, 15, true, 'en_espera', 'media'),
    (v_proy, v_pg4, 2, 1, '4.1', 'Instalaciones eléctricas', 'pto', 200, 350, 70000, v_contra, current_date+2, current_date+18, 16, true, 'pendiente', 'media'),
    (v_proy, v_pg4, 2, 2, '4.2', 'Instalaciones sanitarias', 'pto', 100, 280, 28000, v_contra, current_date+3, current_date+19, 16, true, 'pendiente', 'baja');

  -- rollup de totales a las partidas generales
  update proyecto_items pg set total_costo = (
    select coalesce(sum(c.total_costo),0) from proyecto_items c where c.parent_id = pg.id)
  where pg.proyecto_id = v_proy and pg.es_hoja = false;

  -- caja chica
  insert into cajas (proyecto_id, tipo, nombre, monto_maximo, modalidad, saldo_inicial)
  values (v_proy, 'chica', 'Caja chica — ADECCO', 50000, 'credito', 50000) returning id into v_caja;

  -- cronograma de cobros (armadas)
  insert into cronograma_cobros (proyecto_id, orden, concepto, porcentaje, monto, condicion_tipo, condicion_valor, fecha_esperada, estado) values
    (v_proy, 1, 'Adelanto 20%',          0.20, 864838.99, 'fecha', null, current_date-25, 'cobrado'),
    (v_proy, 2, 'Valorización al 50%',   0.30, 1297258.48,'avance', 50, current_date+5, 'pendiente'),
    (v_proy, 3, 'Valorización al 90%',   0.30, 1297258.48,'avance', 90, current_date+18,'pendiente'),
    (v_proy, 4, 'Liquidación final',     0.20, 864838.99, 'avance', 100,current_date+25,'pendiente');

  -- abono del adelanto (impacta caja como abono) + ingreso a caja
  insert into abonos_cliente (proyecto_id, monto, fecha, metodo, es_adelanto, created_by)
  values (v_proy, 864838.99, current_date-25, 'Transferencia', true, v_admin);
  insert into movimientos_caja (caja_id, proyecto_id, tipo, monto, concepto, created_by)
  values (v_caja, v_proy, 'abono', 50000, 'Asignación inicial de caja chica', v_admin);

  -- valorización N1
  insert into valorizaciones (proyecto_id, numero, semana, fecha_corte, monto_valorizado, amortizacion_adelanto, cobro_neto, created_by)
  values (v_proy, 1, 1, current_date-4, 821250, 164250, 657000, v_jefe) returning id into v_val;
  -- items valorizados (avance en hojas)
  for rec in select id, total_costo from proyecto_items where proyecto_id=v_proy and es_hoja loop
    insert into valorizacion_items (valorizacion_id, proyecto_item_id, pct_avance, total)
    values (v_val, rec.id, 0.25, round(rec.total_costo*0.25, 2));
  end loop;
  -- abono de la valorización (cobro neto)
  insert into abonos_cliente (proyecto_id, monto, fecha, metodo, created_by)
  values (v_proy, 657000, current_date-3, 'Transferencia', v_admin);

  -- solicitudes de pago (varios estados → bandeja + gasto)
  insert into solicitudes_pago (codigo, tipo, proyecto_id, partida_ppto, beneficiario_nombre, especialidad, categoria_etapa, linea_id, monto, constancia, descripcion, ruc_dni, razon_social, num_comprobante, status, contraparte_id, solicitado_por, aprobado_por, aprobado_at, pagado_por, pagado_at, banco_origen, voucher_url)
  values
    ('SP-0001','contratistas', v_proy, '2.1', 'ACABADOS FINOS S.A.C.', 'Estructuras', 'MOD', v_linea, 180000, 'factura', 'Valorización 1 concreto armado', '20556677889','ACABADOS FINOS S.A.C.','F001-120','conciliada', v_contra, v_resi, v_jefe, now()-interval '5 days', v_admin, now()-interval '3 days','Interbank','https://example.com/voucher1.pdf'),
    ('SP-0002','proveedores', v_proy, '4.1', 'FERRETERÍA INDUSTRIAL LIMA', 'Materiales', 'MAT', v_linea, 95000, 'factura', 'Compra de materiales eléctricos', '20667788990','FERRETERÍA INDUSTRIAL LIMA','F002-330','pagada', null, v_resi, v_jefe, now()-interval '2 days', v_admin, now()-interval '1 day','BBVA',null),
    ('SP-0003','caja_chica', v_proy, '1.2', 'Miguel Quispe', 'Varios', 'CC', v_linea, 3500, 'boleta', 'Reposición de caja chica', null,null,'B001-45','aprobada', null, v_resi, v_jefe, now()-interval '6 hours', null, null,null,null),
    ('SP-0004','honorarios', v_proy, '3.1', 'Ing. Pedro Salas', 'Supervisión', 'HON', v_linea, 8000, 'rhe', 'Honorarios supervisión semana 4', '10456789012','Pedro Salas','E001-22','solicitada', null, v_resi, null, null, null, null,null,null);

  -- egresos de caja por las solicitudes pagadas/conciliadas
  insert into movimientos_caja (caja_id, proyecto_id, tipo, monto, concepto, referencia_tipo, created_by)
  values (v_caja, v_proy, 'egreso', 3500, 'Reposición caja chica SP-0003', 'solicitud', v_admin);

  -- ── Proyecto 2 (en rojo: gasto > pagos → alerta regla #1) ───────────
  insert into proyectos (codigo, linea_id, cliente_id, nombre, direccion, tipo_proyecto, estado,
      modalidad_cobro, jefe_id, fecha_inicio, fecha_fin, contrato_total, adelanto_pct, caja_maximo)
  values ('PROY-0002', (select id from lineas_negocio where codigo='MNT'), v_cli_gaddi,
      'GADDI — Acondicionamiento de local', 'C.C. Plaza Norte, Local 210', 'chico', 'en_ejecucion',
      'contado', v_jefe, current_date - 15, current_date + 5, 180000, 0, 8000)
  returning id into v_proy2;
  insert into proyecto_equipo (proyecto_id, profile_id, rol_obra) values
    (v_proy2, v_jefe, 'jefe'), (v_proy2, v_resi, 'residente');
  insert into abonos_cliente (proyecto_id, monto, fecha, metodo, created_by)
  values (v_proy2, 60000, current_date-15, 'Transferencia', v_admin);
  insert into solicitudes_pago (codigo, tipo, proyecto_id, beneficiario_nombre, linea_id, monto, constancia, descripcion, status, solicitado_por, aprobado_por, pagado_por, pagado_at)
  values ('SP-0005','servicios', v_proy2, 'Servicios Generales SAC', (select id from lineas_negocio where codigo='MNT'), 95000, 'factura', 'Subcontrato de acondicionamiento', 'conciliada', v_resi, v_jefe, v_admin, now()-interval '2 days');

  -- ── Cotización demo (en negociación) ────────────────────────────────
  insert into cotizaciones (codigo, linea_id, cliente_id, proyecto_nombre, descripcion, asunto, ubicacion,
      tipo_cotizacion, tipo_proyecto, estado, fecha, vigencia_dias, plazo_valor, plazo_tipo,
      responsable_id, origen)
  values ('COT-0001', v_linea, v_cli_gaddi, 'GADDI — Ampliación de local', 'Ampliación de área de ventas',
      'Construcción', 'C.C. Plaza Norte', 'unica', 'grande', 'en_negociacion', current_date-2, 7, 30, 'calendario',
      v_comercial, 'oficina');

  -- alerta demo
  insert into alertas (tipo, severidad, proyecto_id, titulo, detalle)
  values ('salud_caja', 'critica', v_proy2, 'Gasto supera lo cobrado (regla #1)',
      'PROY-0002: gasto S/ 95,000 > cobrado S/ 60,000.');

  raise notice 'demo sembrado OK';
end $$;
