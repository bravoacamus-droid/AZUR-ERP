-- Descuento de cotización: además del % permite un descuento por MONTO directo
-- (cerrar en un total redondo), y una opción para MOSTRAR el % en el PDF.
alter table cotizaciones add column if not exists descuento_tipo text not null default 'pct'; -- 'pct' | 'monto'
alter table cotizaciones add column if not exists descuento_monto numeric(16,2) not null default 0;
alter table cotizaciones add column if not exists mostrar_descuento_pct boolean not null default false;
