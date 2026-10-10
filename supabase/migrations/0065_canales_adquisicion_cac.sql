-- 0065 · Canales de adquisición + inversión de marketing (dashboard CAC).
-- Informe AZ-TDR-SIS-001: "Costo de Adquisición de Clientes (CAC) — coste del
-- cliente por canal de adquisición vs clientes ganados". El origen del lead
-- era un enum fijo (directo/recomendación/oficina/llamada) y no existía la
-- inversión por canal. Ahora:
--   · canales_adquisicion: maestro editable (Configuración, solo gerencia).
--   · cotizaciones.canal_id: canal del lead de cada cotización.
--   · inversion_marketing: lo invertido por canal y mes.

create table if not exists canales_adquisicion (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  origen_base origen_lead not null default 'directo', -- compatibilidad con cotizaciones.origen
  activo      boolean not null default true,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

insert into canales_adquisicion (nombre, origen_base, orden)
select v.nombre, v.origen::origen_lead, v.orden
from (values
  ('Contacto directo', 'directo', 10),
  ('Referido / recomendación', 'recomendacion', 20),
  ('Oficina', 'oficina', 30),
  ('Llamada', 'llamada', 40),
  ('Cliente recurrente', 'directo', 50),
  ('Google Ads', 'directo', 60),
  ('Meta Ads', 'directo', 70),
  ('Web / SEO', 'directo', 80),
  ('Feria', 'directo', 90)
) as v(nombre, origen, orden)
where not exists (select 1 from canales_adquisicion c where c.nombre = v.nombre);

alter table cotizaciones add column if not exists canal_id uuid references canales_adquisicion(id);

-- Las cotizaciones existentes heredan el canal equivalente a su origen.
update cotizaciones c
set canal_id = ca.id
from canales_adquisicion ca
where c.canal_id is null
  and ca.nombre = case c.origen
    when 'directo' then 'Contacto directo'
    when 'recomendacion' then 'Referido / recomendación'
    when 'oficina' then 'Oficina'
    when 'llamada' then 'Llamada'
  end;

create table if not exists inversion_marketing (
  id         uuid primary key default gen_random_uuid(),
  canal_id   uuid not null references canales_adquisicion(id) on delete cascade,
  mes        date not null, -- primer día del mes
  monto      numeric(14,2) not null check (monto >= 0),
  nota       text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (canal_id, mes)
);

-- RLS: tablas de referencia (lee/escribe autenticado); quién edita se valida
-- en el server action (módulo 'configuracion' = gerencia).
alter table canales_adquisicion enable row level security;
drop policy if exists canales_adquisicion_sel on canales_adquisicion;
create policy canales_adquisicion_sel on canales_adquisicion for select to authenticated using (true);
drop policy if exists canales_adquisicion_wr on canales_adquisicion;
create policy canales_adquisicion_wr on canales_adquisicion for all to authenticated using (true) with check (true);

alter table inversion_marketing enable row level security;
drop policy if exists inversion_marketing_sel on inversion_marketing;
create policy inversion_marketing_sel on inversion_marketing for select to authenticated using (true);
drop policy if exists inversion_marketing_wr on inversion_marketing;
create policy inversion_marketing_wr on inversion_marketing for all to authenticated using (true) with check (true);
