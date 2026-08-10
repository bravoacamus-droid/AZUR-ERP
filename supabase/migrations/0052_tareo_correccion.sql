-- Corrección post-pago del tareo: cuando un jornal ya está pagado y hubo un
-- error, se agrega una corrección ADITIVA por fecha (una fila nueva marcada),
-- sin tocar lo ya pagado. Fluye por el mismo circuito de aprobación.
alter table tareo add column if not exists es_correccion boolean not null default false;
alter table tareo add column if not exists nota text; -- motivo de la corrección (opcional)
comment on column tareo.es_correccion is 'Fila de corrección aditiva sobre un tareo ya pagado';
