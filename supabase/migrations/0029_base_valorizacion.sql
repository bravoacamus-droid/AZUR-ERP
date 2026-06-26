-- Base de cálculo de la valorización/cobro: 'costo' (itemizado) o 'precio' (con margen).
-- Por defecto 'costo' (comportamiento actual). 'precio' aplica factor = contrato/costo_directo.
alter table proyectos add column if not exists base_valorizacion text not null default 'costo';
