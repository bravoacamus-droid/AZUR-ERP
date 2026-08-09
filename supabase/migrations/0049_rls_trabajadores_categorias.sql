-- Fix RLS: trabajadores y categorias_gasto se crearon después del setup inicial
-- y quedaron sin políticas → "new row violates row-level security policy".
-- Se tratan como tablas de referencia: lee autenticado, escribe autenticado
-- (la restricción de quién edita la tarifa se aplica en el server action).
alter table trabajadores enable row level security;
drop policy if exists trabajadores_sel on trabajadores;
create policy trabajadores_sel on trabajadores for select to authenticated using (true);
drop policy if exists trabajadores_wr on trabajadores;
create policy trabajadores_wr on trabajadores for all to authenticated using (true) with check (true);

alter table categorias_gasto enable row level security;
drop policy if exists categorias_gasto_sel on categorias_gasto;
create policy categorias_gasto_sel on categorias_gasto for select to authenticated using (true);
drop policy if exists categorias_gasto_wr on categorias_gasto;
create policy categorias_gasto_wr on categorias_gasto for all to authenticated using (true) with check (true);
