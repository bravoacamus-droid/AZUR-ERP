-- La cantidad también admite fórmulas (ej. =10+20+30), igual que el costo unitario.
alter table cotizacion_items add column if not exists cantidad_formula text;
alter table proyecto_items  add column if not exists cantidad_formula text;
