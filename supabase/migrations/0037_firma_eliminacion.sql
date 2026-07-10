-- Firma por usuario (data URI PNG) para incrustar en PDFs.
alter table profiles add column if not exists firma_data text;

-- Eliminación de cotización con aprobación de Gerencia.
alter table cotizaciones add column if not exists eliminacion_solicitada boolean not null default false;
alter table cotizaciones add column if not exists eliminacion_por uuid references profiles(id) on delete set null;
alter table cotizaciones add column if not exists eliminacion_at timestamptz;
