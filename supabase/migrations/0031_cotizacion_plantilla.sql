-- Marca una cotización como plantilla (con sus partidas) para reutilizar/duplicar.
alter table cotizaciones add column if not exists es_plantilla boolean not null default false;
create index if not exists idx_cot_plantilla on cotizaciones(es_plantilla);
