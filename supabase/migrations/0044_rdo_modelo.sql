-- Campos para que el Reporte Diario de Obra siga el modelo de referencia AZUR.
alter table profiles add column if not exists cip text;                    -- colegiatura (CIP) del residente/supervisor
alter table partes_diarios add column if not exists jornada text;          -- p.ej. "08:00 - 17:00 h (Turno Mañana/Tarde)"
alter table partes_diarios add column if not exists programacion text;     -- plan de trabajo para la siguiente jornada
alter table rdo_actividades add column if not exists estado text;          -- Iniciado | En ejecución | Completado
