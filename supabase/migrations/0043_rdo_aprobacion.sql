-- Reporte del residente/coordinador = RDO (parte diario) con flujo de aprobación.
-- El residente lo envía y el jefe de proyectos aprueba u observa. Ambos pueden
-- descargar el PDF en cualquier estado.
alter table partes_diarios add column if not exists estado text not null default 'borrador'; -- borrador|enviado|aprobado|observado
alter table partes_diarios add column if not exists enviado_at timestamptz;
alter table partes_diarios add column if not exists revisado_by uuid references profiles(id);
alter table partes_diarios add column if not exists revisado_at timestamptz;
alter table partes_diarios add column if not exists obs_revision text;

create index if not exists idx_partes_estado on partes_diarios(proyecto_id, estado);
