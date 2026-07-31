-- Last Planner: dependencias entre fechas + hitos (reunión 4, #7/#8).
-- depende_de: predecesor (al cambiar su entrega, esta actividad se reprograma).
-- es_hito / hito_de: fila de control sin costo ni valorización, anclada a una partida.
alter table proyecto_items add column if not exists depende_de uuid references proyecto_items(id) on delete set null;
alter table proyecto_items add column if not exists es_hito boolean not null default false;
alter table proyecto_items add column if not exists hito_de uuid references proyecto_items(id) on delete cascade;

create index if not exists idx_proyitem_depende on proyecto_items(depende_de);
create index if not exists idx_proyitem_hito_de on proyecto_items(hito_de);
