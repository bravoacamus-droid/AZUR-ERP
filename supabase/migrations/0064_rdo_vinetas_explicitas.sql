-- RDO: las viñetas del "Plan programado" pasan a ser explícitas (el usuario
-- puede borrarlas para escribir títulos o texto libre). Hasta ahora el PDF
-- ponía viñeta a TODAS las líneas; para que los reportes ya guardados se vean
-- igual, se antepone "• " a cada línea no vacía que aún no tenga marcador.
update partes_diarios
set programacion = (
  select string_agg(
           case
             when btrim(l) = '' then l
             when l ~ '^\s*[•·*–○◦●▪-]\s' then l
             else '• ' || btrim(l)
           end,
           E'\n' order by n)
  from unnest(string_to_array(programacion, E'\n')) with ordinality as t(l, n)
)
where programacion is not null and btrim(programacion) <> '';

-- Las líneas que son títulos (sin minúsculas y terminadas en ":", p. ej.
-- "ACTIVIDADES PROGRAMADAS PARA EL LUNES 05 DE OCTUBRE:") quedan sin viñeta.
update partes_diarios
set programacion = (
  select string_agg(
           case when l ~ '^• [^a-záéíóúñü]+:\s*$' then substr(l, 3) else l end,
           E'\n' order by n)
  from unnest(string_to_array(programacion, E'\n')) with ordinality as t(l, n)
)
where programacion ~ '(^|\n)• [^a-záéíóúñü\n]+:\s*(\n|$)';
