-- La valorización al cliente debe salir con precio (margen + GG/GA/utilidad/IGV).
-- Se cambia el default a 'precio' y se pasan los proyectos existentes a 'precio'
-- (el toggle sigue disponible por si algún proyecto quiere ver a costo).
alter table proyectos alter column base_valorizacion set default 'precio';
update proyectos set base_valorizacion = 'precio' where base_valorizacion is null or base_valorizacion = 'costo';
