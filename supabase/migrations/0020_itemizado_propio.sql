-- Proyectos puede usar un itemizado propio, independiente del comercial.
-- En ese caso la comparación con la cotización es solo por totales y márgenes.
alter table proyectos add column if not exists itemizado_propio boolean not null default false;
