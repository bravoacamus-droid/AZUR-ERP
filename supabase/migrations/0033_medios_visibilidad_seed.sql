-- Visibilidad de cada medio de pago por documento (elige dónde se muestra al cliente).
alter table medios_pago_empresa add column if not exists mostrar_cotizacion boolean not null default true;
alter table medios_pago_empresa add column if not exists mostrar_valorizacion boolean not null default true;
alter table medios_pago_empresa add column if not exists mostrar_liquidacion boolean not null default true;

-- Cuentas de AZUR CONSTRUYE S.A.C. (idempotente por número de cuenta).
-- BBVA — Soles
insert into medios_pago_empresa (banco, titular, cuenta_soles, cci_soles, es_detraccion, orden)
select 'BBVA', 'AZUR CONSTRUYE S.A.C.', '001107870100039419', '01178700010003941995', false,
       coalesce((select max(orden) from medios_pago_empresa), 0) + 1
where not exists (select 1 from medios_pago_empresa where cuenta_soles = '001107870100039419');

-- Interbank — Soles + Dólares
insert into medios_pago_empresa (banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, orden)
select 'Interbank', 'AZUR CONSTRUYE S.A.C.', '200-3002318715', '003-200-003002318715-33',
       '200-3003722829', '003-200-003003722829-30', false,
       coalesce((select max(orden) from medios_pago_empresa), 0) + 1
where not exists (select 1 from medios_pago_empresa where cuenta_soles = '200-3002318715');
