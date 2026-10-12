-- 0066 · Forma de pago con decimales y monto fijo (pedido de Juan).
-- El % se guardaba como fracción numeric(6,4) (= 2 decimales de %) y el
-- editor lo redondeaba a entero; tampoco se podía pactar un monto fijo.
--   · porcentaje admite más precisión (12,8).
--   · monto: si viene, es un monto FIJO pactado (en la moneda de la
--     cotización); el % se deriva de él y no cambia aunque cambie el total.
alter table cotizacion_formas_pago alter column porcentaje type numeric(12,8);
alter table cotizacion_formas_pago add column if not exists monto numeric(16,2);
alter table cronograma_cobros alter column porcentaje type numeric(12,8);
