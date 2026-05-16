# AZUR · ERP Integral + PWA

Plataforma a medida para **AZUR Constructora e Inmobiliaria** — finanzas, proyectos y comercial integrados, con app móvil PWA para el personal de campo.

> Referencia comercial: `PRO-2026-AZUR-001` · Lima, mayo 2026.
> Desarrollado por **Promptive** · Luciérnaga & Asociados S.A.C.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend (web + PWA) | Next.js 14 (App Router) · React 18 · TypeScript |
| UI | Tailwind CSS · Radix UI · Framer Motion · Lucide |
| Backend / DB | Supabase (PostgreSQL · Auth · Storage · Realtime · RLS) |
| Hosting | Vercel |
| PDF / Excel | `@react-pdf/renderer` · `exceljs` |
| Push | Web Push API + VAPID (self-hosted) |

## Estructura

```
app/
  (auth)/        Login + recuperación (rutas públicas)
  (erp)/         Interfaz desktop: gerencia, jefes, admin, comercial
  (pwa)/         Interfaz mobile-first: residentes y coordinadores
components/      Sistema de diseño (ui/), por contexto (erp/, pwa/) y PDF
lib/             Supabase clients, auth, formatters, helpers
supabase/        Migraciones SQL + seeds + políticas RLS
scripts/         Generación de íconos PWA, migraciones, seeds
public/          Logo + íconos PWA
```

## Módulos

1. **Finanzas y Administración** — solicitudes → aprobación doble nivel → pago → voucher con URL pública para WhatsApp, cajas chicas por proyecto, caja central, dashboards, reportes (semanal/quincenal/mensual/cierre), auditoría inmutable.
2. **Gestión de Proyectos** — presupuesto heredado del módulo Comercial, etapas/partidas/subpartidas, cronograma planificado vs ejecutado, valorización quincenal con formato del sector, APU, Curva S, adicionales/deductivos, RDO consolidado, repositorio fotográfico, liquidación.
3. **Comercial** — cotizaciones con APU, catálogo maestro de partidas e insumos, rendimientos por cuadrilla, margen comercial, estados con historial, al aprobar genera el proyecto automáticamente.
4. **PWA Campo** — check-in/out GPS, tareo, parte diario digital (RDO), captura fotográfica geolocalizada, solicitudes de pago, SST (charla 5 min, observaciones, incidentes), almacén básico, docs del proyecto, push notifications.

## Comandos

```bash
pnpm install
pnpm icons:generate     # Genera íconos PWA desde public/logo.png
pnpm dev                # Servidor dev en http://localhost:3000
pnpm typecheck          # tsc --noEmit
pnpm lint
pnpm build              # Build de producción
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar. Los secretos de Supabase están listados en la propuesta interna; rotarlos al cierre del proyecto.

## Roadmap

- [x] **Fase 0** — Setup repo, Next.js 14, Tailwind, branding, landing
- [ ] **Fase 1** — Supabase schema base, roles, RLS, auth, 6 usuarios dev sembrados
- [ ] **Fase 2** — Layouts ERP + PWA, manifest, service worker, íconos
- [ ] **Fase 3** — Módulo Comercial (catálogo + APU + cotizaciones + PDF)
- [ ] **Fase 4** — Módulo Proyectos (presupuesto heredado, cronograma)
- [ ] **Fase 5** — Módulo Finanzas (solicitudes → pagos → vouchers + cajas)
- [ ] **Fase 6** — PWA campo (GPS + RDO + evidencias + push)
- [ ] **Fase 7** — Valorización + Curva S + adicionales/deductivos
- [ ] **Fase 8** — Dashboards + reportes multi-proyecto + auditoría
- [ ] **Fase 9** — SST + almacén + docs + hardening + manual usuario

## Propiedad

100% de **AZUR Constructora e Inmobiliaria**. Código fuente, base de datos y dominio bajo control total de Azur. Garantía 12 meses + 1 mes de soporte gratuito post-entrega.
