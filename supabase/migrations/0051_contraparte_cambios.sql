-- Solicitudes de cambio a proveedores/contrapartes: editar un proveedor ya
-- validado requiere aprobación de finanzas/gerencia. Los roles que no son
-- finanzas proponen el cambio aquí; al aprobarse se aplica sobre contrapartes.
create table if not exists contraparte_cambios (
  id uuid primary key default gen_random_uuid(),
  contraparte_id uuid references contrapartes(id) on delete cascade,
  cambios jsonb not null,                         -- { campo: nuevo_valor }
  estado text not null default 'pendiente',       -- pendiente | aprobado | rechazado
  motivo text,                                    -- motivo del rechazo (opcional)
  solicitado_por uuid references profiles(id),
  revisado_por uuid references profiles(id),
  revisado_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_contraparte_cambios_estado on contraparte_cambios(estado, created_at);

-- RLS: lee/escribe autenticado; la restricción de quién aprueba se aplica en el
-- server action (igual que trabajadores/categorias_gasto, ver 0049).
alter table contraparte_cambios enable row level security;
drop policy if exists contraparte_cambios_sel on contraparte_cambios;
create policy contraparte_cambios_sel on contraparte_cambios for select to authenticated using (true);
drop policy if exists contraparte_cambios_wr on contraparte_cambios;
create policy contraparte_cambios_wr on contraparte_cambios for all to authenticated using (true) with check (true);
