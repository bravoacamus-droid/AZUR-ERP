# AZUR ERP · Constructora e Inmobiliaria

ERP integral + PWA de obra para **AZUR Constructora e Inmobiliaria**.
Del lead a la liquidación, con una sola fuente de verdad y trazabilidad total.

> Referencia: documento maestro **PRO-2026-AZUR-001**.

## Stack
- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth + Storage + Realtime + RLS)
- **Vercel** (deploy / CI-CD desde GitHub)
- **@react-pdf/renderer** (PDF), **recharts** (gráficos), **web-push** (VAPID)

## Módulos
- **Comercial** — cotizaciones con árbol de 4 niveles, cuadro de costos + margen por
  partida (`P.U. = C.U. / (1 − margen)`), bloque de totales con GG/GA/utilidad/IGV
  ocultables, descuento comercial activable, formas de pago dinámicas, plantillas de
  condiciones, estados, versionado, **edición colaborativa en tiempo real** (presencia +
  sync), **PDF cliente** y **aprobación → crea proyecto sin margen**.
- **Proyectos (Last Planner)** — 4 cuadrantes: itemizado/presupuesto, programación
  (contratista/fechas/duración), **valorizaciones semanales acumulables** y **estado /
  prioridad automáticos** (proyectado proporcional vs. real). **Dilución del adelanto**,
  cronograma de cobros (armadas), adicionales/deductivos, equipo de obra.
- **Finanzas** — solicitudes de pago (5 tipos · 17 campos) con **flujo de aprobación de 3
  niveles** (Jefe → Administrador → Gerencia según umbral), comprobante por WhatsApp
  (`wa.me`), **CxC** (facturas + cobros + aging), **CxP** (obligaciones) y **cajas**
  (central/chica con saldos en tiempo real y alerta de 80%).
- **Dashboards** — barra de tres tramos por proyecto (Proyectado · Pagos · Gasto) con las
  dos reglas de salud, KPIs y alertas críticas.
- **PWA de campo** — check-in/out GPS, parte diario (RDO), evidencias con cámara + GPS,
  SST (charlas/observaciones/incidentes), almacén, instalable y con service worker.
- **Catálogos**, **Usuarios**, **Inventario**, **Alertas**, **Reportes** (estado de
  resultados por línea, gasto por categoría, export CSV), **Notificaciones push** (VAPID).

## Puesta en marcha
```bash
npm install
cp .env.example .env.local   # completar credenciales (ver abajo)
npm run dev                  # http://localhost:3000
```

### Variables de entorno (`.env.local` / Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tu@empresa.com
NEXT_PUBLIC_APP_URL=
```
> Las claves VAPID se generan con `npx web-push generate-vapid-keys`.
> ⚠️ Pegar las claves en Vercel **sin espacios en blanco**.

## Base de datos
El esquema vive en `supabase/migrations/` (enums, tablas, RLS, vistas, triggers de
auditoría) y se aplica con:
```bash
node scripts/apply-sql.mjs supabase/migrations/0001_schema.sql
node scripts/apply-sql.mjs supabase/migrations/0002_rls_views.sql
node scripts/apply-sql.mjs supabase/migrations/0003_seed.sql       # datos de referencia
node scripts/apply-sql.mjs supabase/migrations/0004_seed_demo.sql  # proyecto demo (borrable)
node scripts/apply-sql.mjs supabase/migrations/0005_grants.sql
node scripts/seed-users.mjs        # usuarios de prueba
node scripts/create-buckets.mjs    # buckets de Storage
node scripts/gen-icons.mjs         # iconos PWA desde el logo
```

## Usuarios de prueba
Contraseña para todos: **`Azur2026!`** (también listados bajo el login para QA rápido).

| Rol | Correo |
|---|---|
| Gerencia General | `gerencia@azur.pe` |
| Jefe de Proyectos | `proyectos@azur.pe` |
| Jefe de Presupuestos | `presupuestos@azur.pe` |
| Administrador | `admin@azur.pe` |
| Comercial | `comercial@azur.pe` |
| Residente | `residente@azur.pe` |
| Prevencionista (SOMA) | `soma@azur.pe` |
| Logístico | `logistica@azur.pe` |

> Antes de producción: quitar el bloque de usuarios de prueba del login
> (`src/lib/dev-users.ts` + `<DevUsers/>`), limpiar los datos sembrados y **rotar
> credenciales**.

## Diagnóstico de push
- `GET /api/push/diag` — estado VAPID + suscripciones + prueba de envío.
- `GET /api/push/test` — push de prueba al usuario logueado.

---
© AZUR Constructora e Inmobiliaria · Colores de marca `#E20627` / `#BE1723`.
