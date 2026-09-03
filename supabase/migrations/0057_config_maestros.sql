-- 0057 · Configuración: maestro de Tipos de servicio + relación con cotizaciones.
-- Pedido de Juan (reunión): "tipo de cotización" pasa a ser "Tipo de servicio",
-- editable en un maestro (Configuración, solo gerencia). El tamaño Grande/Chico
-- (tipo_proyecto) queda como selector aparte, así la valorización no se toca.

create table if not exists tipos_servicio (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  activo     boolean not null default true,
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

-- Semilla con los servicios que mencionó Juan (idempotente por nombre).
insert into tipos_servicio (nombre, orden)
select v.nombre, v.orden
from (values
  ('Construcción de edificio', 10),
  ('Diseño de edificio', 20),
  ('Construcción de casa', 30),
  ('Diseño de casa', 40),
  ('Implementación de oficina', 50),
  ('Mantenimiento de oficina', 60)
) as v(nombre, orden)
where not exists (select 1 from tipos_servicio t where t.nombre = v.nombre);

-- Relación en la cotización (nullable: las cotizaciones viejas quedan sin servicio).
alter table cotizaciones
  add column if not exists tipo_servicio_id uuid references tipos_servicio(id);
