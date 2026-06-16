-- Habilita Realtime (postgres_changes) en las tablas que la app escucha en vivo:
-- edición colaborativa de cotizaciones y notificaciones en tiempo real.

-- REPLICA IDENTITY FULL → permite que RLS evalúe UPDATE/DELETE y que el cliente
-- reciba el registro anterior (necesario para propagar bajas con seguridad).
alter table cotizacion_items replica identity full;
alter table cotizaciones replica identity full;
alter table notificaciones replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table cotizacion_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table cotizaciones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table notificaciones; exception when duplicate_object then null; end;
end $$;
