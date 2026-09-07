-- 0062 · Categorías de gasto de empresa que pidió David (honorarios, comisiones).
-- La lista es editable desde Finanzas → Gastos de empresa → Categorías; esto
-- solo deja precargadas las que mencionó para que no tenga que crearlas.
insert into categorias_gasto_empresa (nombre, orden)
select v.nombre, v.orden from (values
  ('Honorarios', 15),
  ('Comisiones', 25)
) as v(nombre, orden)
where not exists (select 1 from categorias_gasto_empresa c where c.nombre = v.nombre);

select string_agg(nombre, ' · ' order by orden) as categorias from categorias_gasto_empresa where activo;
