-- 0059 · Gasto de caja chica con flujo corto (pedido de David).
-- El GASTO ya pagado desde la caja chica no se programa/paga/concilia como un
-- pago normal: solo se aprueba (Jefe) y el Administrador valida el sustento; en
-- ese momento cuenta al proyecto. Se cierra en 'conciliada' (estado ya contado
-- por el dashboard/P&L, con tipo <> 'caja_chica').
alter table solicitudes_pago
  add column if not exists pagado_caja_chica boolean not null default false,
  add column if not exists sustento_validado_por uuid references profiles(id),
  add column if not exists sustento_validado_at timestamptz;
