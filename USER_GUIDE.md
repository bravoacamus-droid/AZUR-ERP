# AZUR ERP — Manual de usuario

> Manual operativo del sistema **AZUR ERP + PWA** para Constructora e Inmobiliaria.
> Versión 1.0 · Fase 9 cerrada · Documento generado por Promptive.

---

## Índice

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Roles y permisos](#2-roles-y-permisos)
3. [ERP — Plataforma central (desktop)](#3-erp--plataforma-central)
   - [Dashboard ejecutivo](#dashboard-ejecutivo)
   - [Comercial: cotizaciones, catálogo, APU](#comercial)
   - [Proyectos: presupuesto, valorizaciones, Curva S, adicionales](#proyectos)
   - [Finanzas: solicitudes, aprobaciones, pagos, cajas](#finanzas)
   - [Auditoría](#auditoría)
4. [PWA — App de campo](#4-pwa--app-de-campo)
   - [Instalación en celular](#instalación-en-celular)
   - [Check-in GPS](#check-in-gps)
   - [Parte diario (RDO)](#parte-diario-rdo)
   - [Evidencias fotográficas](#evidencias-fotográficas)
   - [Solicitudes de pago](#solicitudes-de-pago-móvil)
   - [SST: charla, observaciones, incidentes](#sst)
   - [Almacén y documentos](#almacén-y-documentos)
   - [Notificaciones push](#notificaciones-push)
5. [Voucher público (WhatsApp)](#5-voucher-público-whatsapp)
6. [Reportes](#6-reportes)
7. [Soporte](#7-soporte)

---

## 1. Acceso al sistema

URL del sistema: **https://azur-erp.vercel.app** (dominio dev; el productivo se configura al final del proyecto).

**Etapa de desarrollo:** debajo del formulario de login encontrarás **6 botones de acceso rápido**, uno por cada rol. Estos botones desaparecen en producción.

Para login normal:
1. Ingresa tu correo corporativo (`@azur.dev` durante desarrollo).
2. Ingresa tu contraseña (la inicial es `azur2026` para usuarios sembrados — debes cambiarla).
3. El sistema te redirige automáticamente al home correcto según tu rol.

---

## 2. Roles y permisos

| Rol | Acceso | Funciones principales |
|---|---|---|
| **Gerencia General** | ERP completo + PWA | Visión integral, aprobaciones finales, reportes ejecutivos, auditoría, gestión de usuarios |
| **Jefe de Proyectos** | Proyectos + Finanzas + PWA | Aprobación de solicitudes, valorización, cronograma, curva S, informes al cliente |
| **Jefe de Presupuestos** | Comercial + Proyectos + PWA | APU, control presupuesto vs ejecutado, adicionales/deductivos |
| **Administrador** | Finanzas | Programación de pagos, vouchers, cajas, detracciones |
| **Comercial** | Comercial | Cotizaciones, catálogo de partidas e insumos |
| **Residente / Coordinador** | PWA campo | Check-in GPS, RDO, solicitudes, evidencias, SST, almacén |

La asignación de un residente a un proyecto se hace desde el ERP. Esa asignación es la que controla qué proyectos ve el residente en su PWA.

---

## 3. ERP — Plataforma central

### Dashboard ejecutivo
Ruta: `/dashboard` (login default de Gerencia)

KPIs en tiempo real:
- Proyectos activos
- Cartera total en contrato
- Solicitudes pendientes de aprobar
- Proyectos en riesgo (gasto real > 110% del avance valorizado)

Gráficos:
- **Avance vs gasto real** por proyecto (barras agrupadas)
- **Gasto por categoría** (pie chart: proveedor, contratista, jornales, etc.)

### Comercial

**Catálogo (`/comercial/catalogo`)**
- Insumos maestros: 22 sembrados (mano de obra, materiales, equipos, transporte, gastos generales)
- Partidas maestras: 4 sembradas (concreto, encofrado, acero, albañilería)
- Cuadrillas: 4 sembradas con componentes (capataz + operarios + peones)

**Cotizaciones (`/comercial/cotizaciones`)**
1. **Nueva** → datos generales + cliente + GG% + Utilidad% + IGV%
2. **Detalle** → agregar partidas (código + descripción + unidad + cantidad + PU)
3. Totales se calculan automáticamente: **Costo Directo + GG% + Utilidad% + IGV% = Total**
4. Estados: Borrador → Enviada → En negociación → Aprobada / Rechazada
5. **PDF descargable** A4 con membrete AZUR, tabla profesional y términos
6. **Al aprobar** → se genera el proyecto automáticamente (trigger SQL)

### Proyectos

**Listado (`/proyectos`)**
- Tarjetas por proyecto con avance, contrato vs ejecutado, badges de estado

**Detalle (`/proyectos/[id]`)**
- 4 KPI cards (avance físico, contrato, ejecutado, margen estimado)
- Estructura del proyecto con tabla de partidas
- **Metrado ejecutado editable inline** — el avance % se recalcula al guardar
- Botones de cambio de estado (planificado / curso / pausado / cerrado / cancelado)

**Valorizaciones (`/proyectos/[id]/valorizaciones`)**
1. **Curva S** (planificado vs ejecutado acumulado)
2. **Generar valorización** → indica periodo (default quincena actual)
3. Sistema calcula `metrado_periodo = ejecutado − acumulado_anterior` para cada partida
4. **Detalle** con tabla formato sector peruano: contractual / anterior / periodo / acumulado / PU / monto / %
5. **PDF landscape** con cálculo automático: Monto periodo − Retención − Amortización + IGV = **Monto a pagar**
6. Estados: Borrador → Enviada → Aprobada → Pagada

**Adicionales / Deductivos (`/proyectos/[id]/adicionales`)**
- KPIs: contrato base, total adicionales (+), total deductivos (−), **presupuesto vigente**
- Form para registrar con tipo + monto + descripción + sustento

### Finanzas

**Solicitudes (`/finanzas/solicitudes`)**
- Listado con todas las solicitudes, filtros visuales por urgencia y estado
- **Nueva solicitud:** proyecto + categoría + concepto + beneficiario + monto + urgencia + notas

**Aprobaciones (`/finanzas/aprobaciones`)**
- Bandeja según rol:
  - Jefes ven **pendientes** (esperando aprobación)
  - Administrador ve **aprobadas por jefe** (listas para programar)
- Ordenadas por urgencia DESC + antigüedad ASC

**Detalle de solicitud (`/finanzas/solicitudes/[id]`)**
1. **Aprobar/Rechazar** (con motivo)
2. Si aprobada, **administrador programa pago** (banco, cuenta, fecha, nro op)
3. **Subir voucher** (PDF o imagen) → marca solicitud como pagada
4. Botón **"Compartir por WhatsApp"** abre `wa.me` con mensaje formateado y link a `/voucher/[token]`

**Pagos (`/finanzas/pagos`)**
Tabla cronológica con datos bancarios y estado del voucher.

**Cajas (`/finanzas/cajas`)**
Caja central + cajas chicas por proyecto con saldo en tiempo real (entradas − salidas).

**Reportes (`/finanzas/reportes`)**
Descargas Excel semanal/quincenal/mensual con 2 hojas (Solicitudes + Pagos), autoformato AZUR.

### Auditoría
Ruta: `/auditoria` (solo Gerencia)
- Log inmutable de cada INSERT/UPDATE/DELETE en tablas críticas
- Filtros por tabla y acción
- Diff JSON colapsable para UPDATEs

---

## 4. PWA — App de campo

### Instalación en celular
1. Abre la URL del sistema en Chrome/Safari del celular
2. Inicia sesión (residente@azur.dev en desarrollo)
3. El navegador te ofrecerá **"Instalar app"** o un banner inferior del sistema
4. La app queda como ícono en la pantalla principal, funciona offline y recibe notificaciones push

### Check-in GPS
Ruta PWA: `/checkin`
1. Selecciona el proyecto al que llegaste
2. Toca **"Obtener mi GPS"** — el sistema mide tu posición
3. Si estás dentro del **radio de geofence** (default 200m del centro de obra), se marca como válido
4. Toca **Check-IN** / **Check-OUT** según corresponda

### Parte diario (RDO)
Ruta PWA: `/rdo`
- Form: proyecto + fecha + clima emoji + temperatura + resumen + observaciones + incidencias + personal
- Una entrada por proyecto/día (upsert)

### Evidencias fotográficas
Ruta PWA: `/evidencias`
1. Selecciona proyecto + título
2. **"Obtener GPS"** (opcional, geotag)
3. **"Tocar para capturar"** abre la cámara del celular
4. Imagen se comprime a 1.5MB max / 1920px (antes de subir)
5. Galería personal con últimas 12 fotos

### Solicitudes de pago (móvil)
Ruta PWA: `/solicitudes` (lista propias) → botón "Nueva solicitud"
Mismo flujo que en ERP, optimizado para celular.

### SST
Ruta PWA: `/sst`
1. **Charla de 5 minutos**: tema + asistencia (1 por proyecto/día)
2. **Observación**: acto inseguro / condición insegura / sugerencia
3. **Incidente**: severidad + descripción + involucrados + acciones inmediatas

### Almacén y documentos
- **`/almacen`**: registrar salida o devolución de herramientas/materiales
- **`/docs`**: subir y consultar documentos por carpeta (planos, contratos, cotizaciones, fichas, permisos)

### Notificaciones push
Desde **`/inicio`** → sección "Notificaciones push" → toca **"Activar notificaciones push"**.
Recibirás avisos cuando tus solicitudes cambien de estado, haya aprobaciones pendientes, etc.

---

## 5. Voucher público (WhatsApp)

Cuando un pago se ejecuta y se sube el voucher, el sistema genera una **URL pública sin login**:

```
https://azur-erp.vercel.app/voucher/<token-uuid>
```

- El destinatario abre el link desde WhatsApp y ve la constancia con logo AZUR, datos bancarios, monto y el voucher embebido
- El link es válido 24 horas (luego se regenera firma)
- El botón "Compartir por WhatsApp" desde el ERP pre-arma el mensaje:
```
📄 Constancia de pago — AZUR
Beneficiario: <nombre>
Concepto: <concepto>
Monto: <monto>
Fecha: <fecha>
Voucher: <URL>
```

---

## 6. Reportes

| Reporte | Ruta | Formato |
|---|---|---|
| Dashboard ejecutivo | `/dashboard` | Interactivo + gráficos |
| Cotización profesional | `/comercial/cotizaciones/[id]` → "Descargar PDF" | PDF A4 |
| Valorización formato sector | `/proyectos/[id]/valorizaciones/[valId]` → "PDF" | PDF A4 landscape |
| Voucher público | `/voucher/[token]` (compartible) | HTML responsivo |
| Reporte financiero semanal | `/finanzas/reportes` | Excel 2 hojas |
| Reporte financiero quincenal | `/finanzas/reportes` | Excel 2 hojas |
| Reporte financiero mensual | `/finanzas/reportes` | Excel 2 hojas |

---

## 7. Soporte

- **Garantía de código:** 12 meses (cualquier bug del desarrollo se corrige sin costo)
- **Soporte gratuito:** 1 mes post entrega
- **Mantenimiento opcional:** S/ 750 + IGV / mes (8 horas de evolutivos + monitoreo + backups)

Contacto técnico:
- **Promptive** · Luigi Bravo Arribasplata
- Email: bravo.a.camus@gmail.com
- WhatsApp / Llamada / Correo (en horario nocturno si Azur prefiere)
- Reuniones cortas martes y viernes (30 min)

---

*Documento generado por Promptive · Luciérnaga & Asociados S.A.C. para AZUR Constructora e Inmobiliaria · 2026.*
