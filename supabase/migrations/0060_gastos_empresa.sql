-- 0060 · Gastos de empresa (EEFF) — pedido de David.
-- Gastos que NO siguen el flujo de obra (planilla, publicidad, impuestos,
-- gastos financieros...). Se ingresan directo (Administración) y alimentan el
-- estado de resultados a nivel empresa y por línea de negocio.
-- Cada gasto lleva: fecha / proyecto / descripción / monto / sustento.

-- Categorías editables (David: "se debe poder agregar más categorías").
create table if not exists categorias_gasto_empresa (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  activo     boolean not null default true,
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

insert into categorias_gasto_empresa (nombre, orden)
select v.nombre, v.orden from (values
  ('Planilla', 10), ('Publicidad', 20), ('Impuestos', 30),
  ('Gastos financieros', 40), ('Alquileres', 50), ('Servicios básicos', 60)
) as v(nombre, orden)
where not exists (select 1 from categorias_gasto_empresa c where c.nombre = v.nombre);

create table if not exists gastos_empresa (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null default current_date,
  categoria_id uuid references categorias_gasto_empresa(id),
  categoria    text,                                   -- snapshot del nombre
  proyecto_id  uuid references proyectos(id),          -- opcional
  linea_id     uuid references lineas_negocio(id),     -- opcional (o heredada del proyecto)
  descripcion  text,
  monto        numeric(16,2) not null,
  sustento_url text,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);

create index if not exists idx_gastos_empresa_fecha on gastos_empresa(fecha);
create index if not exists idx_gastos_empresa_linea on gastos_empresa(linea_id);

-- RLS: tablas nuevas quedan con RLS sin políticas → leerían 0 filas.
-- Referencia: lee/escribe autenticado; el "solo Administración/Gerencia"
-- se aplica en los server actions.
alter table categorias_gasto_empresa enable row level security;
drop policy if exists cge_sel on categorias_gasto_empresa;
create policy cge_sel on categorias_gasto_empresa for select to authenticated using (true);
drop policy if exists cge_wr on categorias_gasto_empresa;
create policy cge_wr on categorias_gasto_empresa for all to authenticated using (true) with check (true);

alter table gastos_empresa enable row level security;
drop policy if exists ge_sel on gastos_empresa;
create policy ge_sel on gastos_empresa for select to authenticated using (true);
drop policy if exists ge_wr on gastos_empresa;
create policy ge_wr on gastos_empresa for all to authenticated using (true) with check (true);
