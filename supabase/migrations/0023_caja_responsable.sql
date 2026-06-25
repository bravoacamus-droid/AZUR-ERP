-- Caja chica por residente/coordinador con asignación semanal para control semanal.
alter table cajas add column if not exists responsable_id uuid references profiles(id);
alter table cajas add column if not exists asignacion_semanal numeric(14,2) not null default 0;
