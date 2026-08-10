-- Tarifa del tareo pasa de "diaria" a JORNAL SEMANAL (confirmado por el cliente).
-- Pago del día = jornal_semana / 48 × horas; hora extra = jornal_semana / 48 × 1.2.
-- Se renombra la columna en el maestro y en el snapshot del tareo.
alter table trabajadores rename column tarifa_dia to jornal_semana;
comment on column trabajadores.jornal_semana is 'Jornal semanal S/ (editable solo por jefe de proyectos o gerencia)';

alter table tareo rename column tarifa_dia to jornal_semana;
comment on column tareo.jornal_semana is 'Snapshot del jornal semanal al registrar el tareo';
