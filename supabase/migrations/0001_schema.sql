-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  AZUR ERP — Esquema base (Postgres 17 / Supabase)                      ║
-- ║  Modelo derivado del documento maestro PRO-2026-AZUR-001              ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ─────────────────────────────── ENUMS ───────────────────────────────
do $$ begin
  create type rol_enum as enum ('gerencia','jefe_proyectos','presupuestos','administrador','comercial','residente','prevencionista','logistico');
exception when duplicate_object then null; end $$;

do $$ begin create type tipo_cotizacion as enum ('unica','programada','recurrencia'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_proyecto as enum ('grande','chico'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_cotizacion as enum ('borrador','enviada','en_negociacion','aceptada','vencida','rechazada'); exception when duplicate_object then null; end $$;
do $$ begin create type moneda_enum as enum ('PEN','USD'); exception when duplicate_object then null; end $$;
do $$ begin create type plazo_tipo as enum ('calendario','util'); exception when duplicate_object then null; end $$;
do $$ begin create type origen_lead as enum ('directo','recomendacion','oficina','llamada'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_proyecto as enum ('planeacion','en_ejecucion','pausado','cerrado','liquidado'); exception when duplicate_object then null; end $$;
do $$ begin create type modalidad_cobro as enum ('contado','credito'); exception when duplicate_object then null; end $$;
do $$ begin create type rol_obra as enum ('jefe','residente','prevencionista','logistico'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_tarea as enum ('completado','en_progreso','detenido','en_espera','pendiente','retrasado','cancelado'); exception when duplicate_object then null; end $$;
do $$ begin create type prioridad_enum as enum ('muy_baja','baja','media','alta','muy_alta'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_solicitud as enum ('contratistas','proveedores','caja_chica','servicios','honorarios'); exception when duplicate_object then null; end $$;
do $$ begin create type constancia_enum as enum ('factura','boleta','rhe'); exception when duplicate_object then null; end $$;
do $$ begin create type status_solicitud as enum ('solicitada','aprobada','programada','pagada','conciliada','rechazada','devuelta'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_caja as enum ('central','chica'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_mov_caja as enum ('abono','egreso','traslado','reposicion','ajuste'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_factura as enum ('emitida','vencida','parcial','cobrada','anulada'); exception when duplicate_object then null; end $$;
do $$ begin create type condicion_armada as enum ('avance','fecha'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_armada as enum ('pendiente','por_facturar','facturado','cobrado'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_adicional as enum ('adicional','deductivo'); exception when duplicate_object then null; end $$;
do $$ begin create type estado_adicional as enum ('solicitado','aprobado','rechazado'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_asistencia as enum ('checkin','checkout'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_mov_almacen as enum ('ingreso','salida','devolucion'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_inventario as enum ('herramienta','material','consumible'); exception when duplicate_object then null; end $$;
do $$ begin create type visibilidad_doc as enum ('publica','mando','gerencia'); exception when duplicate_object then null; end $$;
do $$ begin create type severidad_alerta as enum ('info','advertencia','critica'); exception when duplicate_object then null; end $$;
do $$ begin create type tipo_contraparte as enum ('contratista','proveedor','ambos'); exception when duplicate_object then null; end $$;

-- ─────────────────────────── PERFILES / USUARIOS ──────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  rol rol_enum not null default 'residente',
  telefono text,
  avatar_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────── LÍNEAS DE NEGOCIO / MAESTROS ───────────────────
create table if not exists lineas_negocio (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  color text not null default '#E20627',
  logo_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  tipo_doc text not null default 'RUC',
  ruc_dni text,
  contacto_nombre text,
  contacto_email text,
  contacto_telefono text,
  ubicacion text,
  origen origen_lead,
  recomendado_por text,
  created_at timestamptz not null default now()
);
create index if not exists idx_clientes_ruc on clientes(ruc_dni);

create table if not exists contrapartes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  tipo tipo_contraparte not null default 'proveedor',
  ruc_dni text,
  especialidad text,
  contacto text,
  telefono text,
  banco text,
  cuenta text,
  cci text,
  created_at timestamptz not null default now()
);

create table if not exists catalogo_partidas (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid references lineas_negocio(id) on delete set null,
  codigo text,
  descripcion text not null,
  unidad text,
  costo_referencial numeric(14,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists catalogo_insumos (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  nombre text not null,
  unidad text,
  precio numeric(14,2) default 0,
  tipo text,
  created_at timestamptz not null default now()
);

create table if not exists plantillas_cotizacion (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid references lineas_negocio(id) on delete set null,
  nombre text not null,
  condiciones text,
  servicios_incluidos text,
  servicios_omitidos text,
  garantia text,
  created_at timestamptz not null default now()
);

create table if not exists medios_pago_empresa (
  id uuid primary key default gen_random_uuid(),
  banco text not null,
  titular text not null,
  cuenta_soles text,
  cci_soles text,
  cuenta_dolares text,
  cci_dolares text,
  es_detraccion boolean not null default false,
  logo_url text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────── COTIZACIONES ────────────────────────────
create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  correlativo int generated always as identity,
  codigo text unique,
  linea_id uuid references lineas_negocio(id),
  cliente_id uuid references clientes(id),
  proyecto_nombre text not null,
  descripcion text,
  asunto text,
  ubicacion text,
  tipo_cotizacion tipo_cotizacion not null default 'unica',
  tipo_proyecto tipo_proyecto not null default 'grande',
  estado estado_cotizacion not null default 'borrador',
  moneda moneda_enum not null default 'PEN',
  tipo_cambio numeric(10,4) default 1,
  fecha date not null default current_date,
  vigencia_dias int default 7,
  plazo_valor int,
  plazo_tipo plazo_tipo default 'calendario',
  -- porcentajes del bloque de totales
  gg_pct numeric(6,4) default 0.05,
  ga_pct numeric(6,4) default 0.05,
  utilidad_pct numeric(6,4) default 0.05,
  igv_pct numeric(6,4) default 0.18,
  descuento_pct numeric(6,4) default 0,
  descuento_activo boolean not null default false,
  margen_min_pct numeric(6,4) default 0.30,
  -- toggles de visibilidad (Anexo B A.5)
  mostrar_gg boolean not null default true,
  mostrar_ga boolean not null default true,
  mostrar_utilidad boolean not null default true,
  mostrar_igv boolean not null default true,
  garantia_activa boolean not null default true,
  -- condiciones (precargadas de plantilla, editables)
  plantilla_id uuid references plantillas_cotizacion(id),
  condiciones text,
  servicios_incluidos text,
  servicios_omitidos text,
  garantia text,
  -- origen y meta
  origen origen_lead,
  recomendado_por text,
  responsable_id uuid references profiles(id),
  version int not null default 1,
  proyecto_id uuid,
  motivo_rechazo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cot_linea on cotizaciones(linea_id);
create index if not exists idx_cot_estado on cotizaciones(estado);
create index if not exists idx_cot_cliente on cotizaciones(cliente_id);

-- Árbol de hasta 4 niveles. Solo el nivel hoja captura unidad/cantidad/CU/margen.
create table if not exists cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  parent_id uuid references cotizacion_items(id) on delete cascade,
  nivel int not null default 1,
  orden int not null default 0,
  item_codigo text,
  titulo text not null,
  unidad text,
  cantidad numeric(14,4),
  costo_unitario numeric(14,4),
  margen_pct numeric(6,4) default 0.30,
  es_hoja boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_cotitem_cot on cotizacion_items(cotizacion_id);
create index if not exists idx_cotitem_parent on cotizacion_items(parent_id);

create table if not exists cotizacion_formas_pago (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  orden int not null default 0,
  concepto text not null,
  porcentaje numeric(6,4) not null default 0,
  es_adelanto boolean not null default false
);

create table if not exists cotizacion_versiones (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  justificacion text,
  total numeric(16,2),
  usuario_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ───────────────────────────── PROYECTOS ─────────────────────────────
create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  correlativo int generated always as identity,
  codigo text unique,
  cotizacion_id uuid references cotizaciones(id),
  linea_id uuid references lineas_negocio(id),
  cliente_id uuid references clientes(id),
  nombre text not null,
  direccion text,
  tipo_proyecto tipo_proyecto not null default 'grande',
  estado estado_proyecto not null default 'planeacion',
  modalidad_cobro modalidad_cobro not null default 'credito',
  jefe_id uuid references profiles(id),
  fecha_inicio date,
  fecha_fin date,
  contrato_total numeric(16,2) default 0,
  adelanto_pct numeric(6,4) default 0.20,
  caja_maximo numeric(14,2) default 0,
  gg_pct numeric(6,4) default 0.05,
  ga_pct numeric(6,4) default 0.05,
  utilidad_pct numeric(6,4) default 0.05,
  igv_pct numeric(6,4) default 0.18,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_proy_linea on proyectos(linea_id);
create index if not exists idx_proy_estado on proyectos(estado);

create table if not exists proyecto_equipo (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  rol_obra rol_obra not null,
  created_at timestamptz not null default now(),
  unique (proyecto_id, profile_id, rol_obra)
);
create index if not exists idx_equipo_proy on proyecto_equipo(proyecto_id);
create index if not exists idx_equipo_profile on proyecto_equipo(profile_id);

-- Itemizado del proyecto (cuadrantes 1, 2 y 4 del Last Planner).
create table if not exists proyecto_items (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  parent_id uuid references proyecto_items(id) on delete cascade,
  nivel int not null default 1,
  orden int not null default 0,
  item_codigo text,
  titulo text not null,
  unidad text,
  cantidad numeric(14,4),
  costo_unitario numeric(14,4),
  total_costo numeric(16,2) default 0,           -- presupuesto comercial (tope)
  contratista_id uuid references contrapartes(id),
  fecha_inicio date,
  fecha_entrega date,
  duracion_dias numeric(8,2),
  estado_tarea estado_tarea not null default 'pendiente',
  prioridad prioridad_enum not null default 'media',
  estado_override estado_tarea,                  -- override manual (p.ej. Cancelado)
  es_hoja boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_proyitem_proy on proyecto_items(proyecto_id);
create index if not exists idx_proyitem_parent on proyecto_items(parent_id);

-- Valorizaciones semanales acumulables (cuadrante 3).
create table if not exists valorizaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  numero int not null,
  semana int not null,
  fecha_corte date not null default current_date,
  estado text not null default 'abierta',
  monto_valorizado numeric(16,2) default 0,
  amortizacion_adelanto numeric(16,2) default 0,
  cobro_neto numeric(16,2) default 0,
  notas text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (proyecto_id, numero)
);

create table if not exists valorizacion_items (
  id uuid primary key default gen_random_uuid(),
  valorizacion_id uuid not null references valorizaciones(id) on delete cascade,
  proyecto_item_id uuid not null references proyecto_items(id) on delete cascade,
  pct_avance numeric(6,4) not null default 0,
  total numeric(16,2) not null default 0,
  unique (valorizacion_id, proyecto_item_id)
);

create table if not exists cronograma_cobros (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  orden int not null default 0,
  concepto text not null,
  porcentaje numeric(6,4) not null default 0,
  monto numeric(16,2) default 0,
  condicion_tipo condicion_armada not null default 'avance',
  condicion_valor numeric(10,2),
  fecha_esperada date,
  estado estado_armada not null default 'pendiente',
  factura_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists adicionales_deductivos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tipo tipo_adicional not null,
  descripcion text not null,
  monto numeric(16,2) not null default 0,
  proyecto_item_id uuid references proyecto_items(id),
  sustento_url text,
  estado estado_adicional not null default 'solicitado',
  solicitado_por uuid references profiles(id),
  aprobado_por uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists hitos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  nombre text not null,
  fecha_comprometida date not null,
  cumplido boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── FINANZAS ──────────────────────────────
create table if not exists solicitudes_pago (
  id uuid primary key default gen_random_uuid(),
  correlativo int generated always as identity,
  codigo text unique,
  tipo tipo_solicitud not null,
  proyecto_id uuid references proyectos(id),
  proyecto_item_id uuid references proyecto_items(id),
  partida_ppto text,
  fecha_registro timestamptz not null default now(),
  beneficiario_nombre text,
  especialidad text,
  categoria_etapa text,
  linea_id uuid references lineas_negocio(id),
  monto numeric(16,2) not null default 0,
  constancia constancia_enum,
  gestor_id uuid references profiles(id),
  descripcion text,
  cta_bancaria text,
  ruc_dni text,
  razon_social text,
  num_comprobante text,
  status status_solicitud not null default 'solicitada',
  contraparte_id uuid references contrapartes(id),
  -- trazabilidad
  solicitado_por uuid references profiles(id),
  aprobado_por uuid references profiles(id),
  aprobado_at timestamptz,
  programado_por uuid references profiles(id),
  programado_at timestamptz,
  pagado_por uuid references profiles(id),
  pagado_at timestamptz,
  banco_origen text,
  fecha_programada date,
  voucher_url text,
  sustento_url text,
  detraccion_monto numeric(14,2) default 0,
  motivo_rechazo text,
  requiere_gerencia boolean not null default false,
  aprobado_gerencia_por uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_sol_proy on solicitudes_pago(proyecto_id);
create index if not exists idx_sol_status on solicitudes_pago(status);
create index if not exists idx_sol_solicita on solicitudes_pago(solicitado_por);

create table if not exists cajas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id) on delete cascade,
  tipo tipo_caja not null default 'chica',
  nombre text not null,
  monto_maximo numeric(14,2) default 0,
  modalidad modalidad_cobro,
  saldo_inicial numeric(16,2) default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_caja_proy on cajas(proyecto_id);

create table if not exists movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  caja_id uuid not null references cajas(id) on delete cascade,
  proyecto_id uuid references proyectos(id),
  tipo tipo_mov_caja not null,
  monto numeric(16,2) not null,
  concepto text,
  referencia_tipo text,
  referencia_id uuid,
  fecha date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_movcaja_caja on movimientos_caja(caja_id);

create table if not exists facturas (
  id uuid primary key default gen_random_uuid(),
  numero text,
  cliente_id uuid references clientes(id),
  proyecto_id uuid references proyectos(id),
  armada_id uuid references cronograma_cobros(id),
  monto numeric(16,2) not null default 0,
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  estado estado_factura not null default 'emitida',
  monto_cobrado numeric(16,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_fact_cliente on facturas(cliente_id);
create index if not exists idx_fact_proy on facturas(proyecto_id);

create table if not exists abonos_cliente (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid references facturas(id),
  proyecto_id uuid references proyectos(id),
  monto numeric(16,2) not null,
  fecha date not null default current_date,
  metodo text,
  es_adelanto boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────── PWA / CAMPO ─────────────────────────────
create table if not exists asistencias (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id),
  profile_id uuid references profiles(id),
  tipo tipo_asistencia not null,
  lat numeric(10,6),
  lng numeric(10,6),
  registrado_at timestamptz not null default now()
);

create table if not exists tareo (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id),
  fecha date not null default current_date,
  trabajador_nombre text not null,
  presente boolean not null default true,
  horas numeric(5,2),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists partes_diarios (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  fecha date not null default current_date,
  clima text,
  personal_count int,
  equipos text,
  materiales_recibidos text,
  observaciones text,
  incidencias text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists rdo_actividades (
  id uuid primary key default gen_random_uuid(),
  rdo_id uuid not null references partes_diarios(id) on delete cascade,
  descripcion text not null,
  proyecto_item_id uuid references proyecto_items(id),
  avance_pct numeric(6,4),
  foto_url text
);

create table if not exists evidencias (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  proyecto_item_id uuid references proyecto_items(id),
  rdo_id uuid references partes_diarios(id),
  url text not null,
  lat numeric(10,6),
  lng numeric(10,6),
  tomada_en timestamptz default now(),
  descripcion text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists sst_charlas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id),
  fecha date not null default current_date,
  tema text not null,
  asistentes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists sst_observaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id),
  tipo text not null default 'condicion',
  descripcion text not null,
  foto_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists sst_incidentes (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id),
  descripcion text not null,
  gravedad text default 'leve',
  foto_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ───────────────────────────── ALMACÉN ───────────────────────────────
create table if not exists inventario_items (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  nombre text not null,
  unidad text,
  stock numeric(14,2) not null default 0,
  tipo tipo_inventario not null default 'material',
  created_at timestamptz not null default now()
);

create table if not exists movimientos_almacen (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventario_items(id) on delete cascade,
  proyecto_id uuid references proyectos(id),
  tipo tipo_mov_almacen not null,
  cantidad numeric(14,2) not null,
  proyecto_item_id uuid references proyecto_items(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  -- Anexo A.2 / 8bis: ingreso ⇒ sin proyecto; salida/devolución ⇒ con proyecto
  constraint chk_almacen_proyecto check (
    (tipo = 'ingreso' and proyecto_id is null) or
    (tipo in ('salida','devolucion') and proyecto_id is not null)
  )
);

-- ───────────────────── DOCUMENTOS / EXPEDIENTE ────────────────────────
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id) on delete cascade,
  carpeta text not null default 'general',
  nombre text not null,
  url text not null,
  visibilidad visibilidad_doc not null default 'mando',
  tipo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ──────────────── NOTIFICACIONES / ALERTAS / PUSH / AUDIT ──────────────
create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  titulo text not null,
  cuerpo text,
  url text,
  tipo text default 'info',
  leida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on notificaciones(user_id, leida);

create table if not exists alertas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  severidad severidad_alerta not null default 'advertencia',
  proyecto_id uuid references proyectos(id) on delete cascade,
  titulo text not null,
  detalle text,
  resuelta boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerta_proy on alertas(proyecto_id, resuelta);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_user on push_subscriptions(user_id);

create table if not exists push_log (
  id uuid primary key default gen_random_uuid(),
  source text,
  target_user_id uuid,
  title text,
  status text,
  detail text,
  sent int default 0,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid,
  accion text not null,
  old_data jsonb,
  new_data jsonb,
  usuario_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_reg on audit_log(tabla, registro_id);
