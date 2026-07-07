-- Las cuentas anteriores eran de prueba (ficticias). Se reemplazan por las
-- cuentas reales de AZUR CONSTRUYE S.A.C. (no hay FKs a esta tabla).
delete from medios_pago_empresa;

-- BBVA — Soles
insert into medios_pago_empresa
  (banco, titular, cuenta_soles, cci_soles, es_detraccion, orden,
   mostrar_cotizacion, mostrar_valorizacion, mostrar_liquidacion)
values
  ('BBVA', 'AZUR CONSTRUYE S.A.C.', '001107870100039419', '01178700010003941995', false, 1, true, true, true);

-- Interbank — Soles + Dólares
insert into medios_pago_empresa
  (banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, orden,
   mostrar_cotizacion, mostrar_valorizacion, mostrar_liquidacion)
values
  ('Interbank', 'AZUR CONSTRUYE S.A.C.', '200-3002318715', '003-200-003002318715-33',
   '200-3003722829', '003-200-003003722829-30', false, 2, true, true, true);
