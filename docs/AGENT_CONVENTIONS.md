# Convenciones de desarrollo — AZUR ERP (para subagentes)

Proyecto Next.js 14 (App Router) + TS + Tailwind + Supabase. Carpeta raíz:
`c:\Users\LUIGI\Desktop\Azur proyecto completo\azur-erp`. Alias `@/*` → `src/*`.

## Reglas duras
- **NO** ejecutes `npm install`, `npm run build`, `tsc` ni git. Solo crea/edita archivos.
- **NO** modifiques archivos compartidos existentes (`src/lib/*`, `src/components/ui/*`,
  `src/components/shell/*`, `src/middleware.ts`, layouts existentes, `tailwind.config.ts`,
  `src/lib/nav.ts`). Solo crea archivos nuevos en las rutas que se te asignen.
- Idioma de la UI: **español**. Marca: rojo AZUR (`text-azur-600`, `bg-azur-gradient`,
  variantes `azur` en botones/badges). Moderno, limpio, móvil-first.
- Fechas: usa helpers de `@/lib/format` (`fmtDate`, `fmtDateTime`, `fmtMoney`, `fmtPct`).
  NUNCA `toLocaleString` sin timeZone.
- Server Actions: archivo `actions.ts` con `'use server'`. Patrón: (1) `requireSession()`
  o `requireRol([...])`, (2) validar con zod, (3) mutar con `createClient()` (RLS),
  (4) lookups internos/notif con `createAdminClient()` (bypass RLS), (5) `notifyUser`/
  `notifyRoles` ANTES de cualquier redirect, (6) `revalidatePath()`.
- Event handlers (onClick/onChange) SOLO en componentes con `'use client'`.

## APIs disponibles (no las redefinas, impórtalas)
- `@/lib/supabase/server` → `createClient()` (server components / actions, respeta RLS).
- `@/lib/supabase/client` → `createClient()` (client components).
- `@/lib/supabase/admin` → `createAdminClient()` (service_role, solo server).
- `@/lib/auth` → `getSession()`, `requireSession()`, `requireRol(roles)`. Devuelve
  `SessionUser { id, email, nombre, rol, telefono, avatar_url, activo }`.
- `@/lib/roles` → `ROLES`, `Rol`, `ROL_META`, `rolLabel()`, `ROLES_VEN_MARGEN`, etc.
- `@/lib/format` → formatters. `@/lib/codigo` → `formatCodigo(prefijo, n)`.
- `@/lib/estados` → mapas estado→{label,variant} (ESTADO_PROYECTO, STATUS_SOLICITUD,
  ESTADO_TAREA, PRIORIDAD, TIPO_SOLICITUD_LABEL…).
- `@/lib/push/notify` → `notifyUser(userId, {title,body,url,tag})`, `notifyRoles(roles, payload)`.
- `@/types/database` → `Database` (tipos generados de Supabase).

## UI primitives (en `@/components/ui/`)
- `button` → `<Button variant="default|gradient|outline|secondary|ghost|destructive|link" size="default|sm|lg|icon">`.
- `card` → `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`.
- `input`, `textarea`, `label`, `select` (`<Select>` nativo estilizado), `badge` (`<Badge variant=...>`).
- `table` → `Table, TableHeader, TableBody, TableRow, TableHead, TableCell`.
- `dialog` → `<Modal open onClose title description footer>`. `tabs` → `<Tabs tabs value onChange>`.
- `dropdown` → `<Dropdown trigger>` + `<DropdownItem>`. `page` → `<PageHeader title description action>`, `<KpiCard label value sub icon tone>`.
- `misc` → `Avatar, EmptyState, Field, Separator, Skeleton`.
- Iconos: `lucide-react`.

## Patrón de página de listado (server component)
```tsx
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requireSession(); // o requireRol([...])
  const supabase = createClient();
  const { data } = await supabase.from('tabla').select('*').order('created_at',{ascending:false});
  return (<div className="space-y-6"><PageHeader .../> ...<Table>...</Table></div>);
}
```

## Tablas relevantes (esquema ya creado en Supabase)
- Referencia: `lineas_negocio(codigo,nombre,color)`, `clientes`, `contrapartes(tipo:contratista|proveedor|ambos)`,
  `catalogo_partidas`, `catalogo_insumos`, `plantillas_cotizacion`, `medios_pago_empresa`, `profiles`.
- Proyectos: `proyectos`, `proyecto_equipo`, `proyecto_items`, `valorizaciones`, `valorizacion_items`,
  `cronograma_cobros`, `adicionales_deductivos`, `hitos`.
- Finanzas: `solicitudes_pago`, `cajas`, `movimientos_caja`, `facturas`, `abonos_cliente`.
- Campo: `asistencias`, `tareo`, `partes_diarios`, `rdo_actividades`, `evidencias`,
  `sst_charlas`, `sst_observaciones`, `sst_incidentes`.
- Almacén: `inventario_items(tipo:herramienta|material|consumible)`, `movimientos_almacen`
  (CHECK: tipo='ingreso' ⇒ proyecto_id NULL; tipo in salida/devolucion ⇒ proyecto_id NOT NULL).
- Notif: `notificaciones`, `alertas(severidad:info|advertencia|critica)`, `documentos(visibilidad:publica|mando|gerencia)`.
- Vistas: `v_dashboard_proyecto(proyecto_id,codigo,nombre,proyectado,pagos,gasto,valorizado)`,
  `v_cajas_saldos(caja_id,proyecto_id,nombre,saldo_inicial,saldo_actual,monto_maximo)`.

## Storage (Supabase) — buckets a usar para subir archivos
Buckets: `avatars`, `documentos`, `evidencias`, `vouchers`. Para subir desde client:
`createClient().storage.from('evidencias').upload(path, file)` y obtener URL pública con
`.getPublicUrl(path)`. (Si un bucket no existe, el upload fallará — degradar con elegancia.)
