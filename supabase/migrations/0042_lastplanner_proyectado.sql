-- Last Planner Proyectado (línea base) vs Real (reunión 4, #4/#6).
-- El Real conserva fecha_inicio/fecha_entrega/duracion_dias.
-- El Proyectado guarda sus propias fechas planificadas; la curva semanal
-- planificada se calcula automáticamente (fechas + costo), sin tabla extra.
alter table proyecto_items add column if not exists fi_proy date;
alter table proyecto_items add column if not exists fe_proy date;
alter table proyecto_items add column if not exists dur_proy numeric(8,2);

-- Semilla: la línea base parte igual al cronograma actual y luego diverge.
update proyecto_items
   set fi_proy = coalesce(fi_proy, fecha_inicio),
       fe_proy = coalesce(fe_proy, fecha_entrega),
       dur_proy = coalesce(dur_proy, duracion_dias)
 where fi_proy is null and (fecha_inicio is not null or fecha_entrega is not null or duracion_dias is not null);
