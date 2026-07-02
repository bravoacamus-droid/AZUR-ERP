-- Cuenta de origen del depósito del cliente (para el match de seguridad en cobros).
alter table abonos_cliente add column if not exists cuenta_origen text;
