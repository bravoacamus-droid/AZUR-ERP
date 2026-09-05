-- 0061 · Comentarios de David sobre los formularios de gasto.
-- Gasto de caja chica: se simplifica el formulario y se agregan los campos que
-- pidió (fecha propia del gasto, gestor y varias fotos de sustento).
-- El N° de Fact/RHE ya existía como `num_comprobante`.
alter table solicitudes_pago
  add column if not exists fecha_gasto date,
  add column if not exists gestor text,
  add column if not exists sustento_urls text[];

-- Gastos de empresa: agregar Gestor (David: aquí NO se adjunta sustento).
alter table gastos_empresa
  add column if not exists gestor text;
