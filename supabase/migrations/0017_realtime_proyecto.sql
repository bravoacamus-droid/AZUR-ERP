-- Realtime para el Last Planner: itemizado y valorizaciones en vivo.
alter table proyecto_items replica identity full;
alter table valorizaciones replica identity full;
alter table valorizacion_items replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table proyecto_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table valorizaciones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table valorizacion_items; exception when duplicate_object then null; end;
end $$;
