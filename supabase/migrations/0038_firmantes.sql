-- Firmantes configurables por documento (array de user_ids a mostrar en el PDF).
alter table cotizaciones add column if not exists firmantes jsonb not null default '[]'::jsonb;
alter table proyectos   add column if not exists firmantes jsonb not null default '[]'::jsonb;
