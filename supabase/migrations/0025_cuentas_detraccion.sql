-- Cuentas de detracción y datos bancarios del cliente (pagos de detracciones).
alter table contrapartes add column if not exists cuenta_detraccion text;
alter table clientes add column if not exists banco text;
alter table clientes add column if not exists cuenta text;
alter table clientes add column if not exists cci text;
alter table clientes add column if not exists cuenta_detraccion text;
