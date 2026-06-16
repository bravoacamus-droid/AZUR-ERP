-- Método de pago, N° de operación y voucher en movimientos de caja y solicitudes.
do $$ begin
  create type metodo_pago as enum ('transferencia','efectivo','yape','plin','deposito','cheque','tarjeta','otro');
exception when duplicate_object then null; end $$;

alter table movimientos_caja add column if not exists metodo metodo_pago;
alter table movimientos_caja add column if not exists num_operacion text;
alter table movimientos_caja add column if not exists voucher_url text;

alter table solicitudes_pago add column if not exists metodo metodo_pago;
alter table solicitudes_pago add column if not exists num_operacion text;
