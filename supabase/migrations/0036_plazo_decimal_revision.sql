-- Plazo admite decimales (p. ej. 3.5 semanas).
alter table cotizaciones alter column plazo_valor type numeric(7,2) using plazo_valor::numeric;

-- Flujo de revisión/validación de cotizaciones (p. ej. Presupuestos valida).
alter table cotizaciones add column if not exists revision_estado text;           -- null | 'pendiente' | 'aprobada' | 'observada'
alter table cotizaciones add column if not exists revision_nota text;
alter table cotizaciones add column if not exists revision_por uuid references profiles(id) on delete set null;
alter table cotizaciones add column if not exists revision_at timestamptz;
alter table cotizaciones add column if not exists revision_solicitada_por uuid references profiles(id) on delete set null;
