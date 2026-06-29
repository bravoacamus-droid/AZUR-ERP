-- Moneda de la solicitud de pago (algunos proyectos manejan dólares). Detracción ya existe (detraccion_monto).
alter table solicitudes_pago add column if not exists moneda text not null default 'PEN';
