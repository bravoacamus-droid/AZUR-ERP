alter table cotizacion_items add column if not exists costo_formula text;
alter table proyecto_items add column if not exists costo_formula text;
alter table proyectos add column if not exists dias_laborables text not null default 'lun_sab';
