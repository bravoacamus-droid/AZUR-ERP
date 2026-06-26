-- Toggle opcional para mostrar el equivalente en soles cuando la cotización es en USD.
alter table cotizaciones add column if not exists mostrar_equiv_pen boolean not null default true;
