-- RLS para tipos_servicio: se creó en 0057 sin políticas → el cliente
-- autenticado leía 0 filas (no aparecían en la cotización). Tabla de
-- referencia: lee/escribe autenticado; el "solo gerencia" para escribir se
-- aplica en el server action (módulo 'configuracion'), igual que trabajadores.
alter table tipos_servicio enable row level security;
drop policy if exists tipos_servicio_sel on tipos_servicio;
create policy tipos_servicio_sel on tipos_servicio for select to authenticated using (true);
drop policy if exists tipos_servicio_wr on tipos_servicio;
create policy tipos_servicio_wr on tipos_servicio for all to authenticated using (true) with check (true);
