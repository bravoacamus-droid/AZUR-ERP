# 🧪 Guía de pruebas — AZUR ERP + PWA

Guía paso a paso para validar **todos los flujos** de la plataforma: comercial,
proyectos, finanzas, campo (PWA), notificaciones push, dashboards y maestros.

> **Contraseña de todos los usuarios de prueba:** `Azur2026!`
> Los usuarios aparecen listados bajo el login para entrar con un clic.

| Rol | Correo | Dónde trabaja |
|---|---|---|
| Gerencia General | `gerencia@azur.pe` | ERP completo + aprobación final |
| Jefe de Proyectos | `proyectos@azur.pe` | Proyectos + 1ª aprobación de pagos |
| Jefe de Presupuestos | `presupuestos@azur.pe` | Comercial + Proyectos |
| Administrador (Pamela) | `admin@azur.pe` | Finanzas, programa y paga |
| Comercial | `comercial@azur.pe` | Cotizaciones |
| Residente | `residente@azur.pe` | PWA de campo |
| Prevencionista (SOMA) | `soma@azur.pe` | PWA — seguridad |
| Logístico | `logistica@azur.pe` | Almacén |

**Consejo:** abre dos navegadores (o uno normal + uno incógnito) para probar
flujos entre roles a la vez (p. ej. residente que solicita y jefe que aprueba).

---

## FASE 0 · Acceso y branding
1. Entra a la app (login). Verifica el **logo AZUR sobre fondo blanco** y los colores rojos de marca.
2. Toca un usuario de la lista de prueba → entra directo.
3. Según el rol, aterrizas en **/inicio** (roles de oficina) o **/campo** (roles de obra).
4. Arriba a la derecha: **campana de notificaciones** y **menú de usuario** (Mi perfil / Cerrar sesión).
5. Prueba **Cerrar sesión** → vuelve al login. ✔

---

## FASE 1 · Maestros (preparar datos)
**Entra como `comercial@azur.pe` o `gerencia@azur.pe`.**

### 1.1 Clientes (menú: Maestros → Clientes)
- Pulsa **Nuevo cliente** → completa razón social, RUC, contacto → Guardar. Aparece en la tabla.
- Usa el **buscador** por nombre/RUC.
- Prueba **Importar**: pega varias filas (Razón social ⇥ RUC ⇥ Contacto) → Importar. Verás "Importados N / duplicados M".
- Edita un cliente con el lápiz. ✔

### 1.2 Catálogos (menú: Maestros → Catálogos)
- Pestaña **Partidas**: ya hay ~93 partidas con código. Crea una nueva (código, descripción, unidad, precio, línea).
- Pestaña **Insumos**: ~31 insumos.
- Pestaña **Contratistas/Proveedores**, **Plantillas**, **Medios de pago**: revisa el CRUD.
- Botón **Actualizar precios** (arriba): elige "Insumos", pon `5`, Aplicar → sube 5% todos los precios y avisa cuántas cotizaciones podrían quedar desactualizadas. ✔

---

## FASE 2 · Comercial — Cotización completa
**Entra como `comercial@azur.pe`.** Menú **Comercial**.

### 2.1 Crear
1. **Nueva cotización**. Elige origen del lead, **cliente** (o crea uno inline con el botón **+**), línea de negocio, tipo (Única=Grande), nombre del proyecto, vigencia y **plantilla** de condiciones.
2. **Crear y armar presupuesto** → abre el editor.

### 2.2 Árbol de 4 niveles + catálogo + APU
3. **Agregar partida** → se abre el **selector de catálogo**:
   - Busca por código/descripción. Las que tienen badge **APU** traen desglose.
   - Elige **EST‑007 Concreto** (tiene APU) → se agrega con su C.U. calculado y, en acciones, el icono de capas queda en rojo (tiene APU).
   - Prueba también **Crear en blanco**.
4. En una fila, pulsa **+** para anidar: crea **sub‑partida → actividad → sub‑actividad**. Verifica la numeración **1.0 / 1.1 / 1.1.1 / 1.1.1.1**.
5. En una hoja sin APU, edita **unidad, cantidad, C.U. y % margen** directamente. Observa cómo el **Subtotal**, **P. Unitario** (= C.U./(1−margen)) y **Precio** se recalculan al instante.
6. Pulsa el icono **Detallar APU** (capas) en una partida → agrega componentes (mano de obra, materiales, equipos). El **C.U. pasa a calcularse desde el APU** (solo lectura). Pulsa **Guardar como plantilla** para mandarlo al catálogo. ✔

### 2.3 Totales, márgenes y descuento
7. Baja al **Bloque de totales**: ajusta GG/GA/Utilidad/IGV y usa los **toggles** para ocultar conceptos (vista cliente).
8. Mira la **Vista interna** (costo directo real + margen total) — esto el cliente NUNCA lo ve.
9. Pulsa **Agregar descuento comercial**, pon 5% → aparece **TOTAL CON DESCUENTO**.

### 2.4 Condiciones y pago
10. Pestaña **Condiciones y pago**: arma **Forma de pago** (ej. 20% adelanto + 80% valorizaciones). El sistema valida que **no supere 100%**. Define plazo (días calendario/útiles). Revisa los **medios de pago** con detracción.

### 2.5 Entrega y versionado
11. Menú **Acciones**:
    - **Generar PDF (cliente)**: abre el PDF limpio (sin costos ni margen) con nombre de archivo estandarizado.
    - **Descargar Excel (interno)**: baja la matriz completa con costos y márgenes.
    - **Enviar por WhatsApp**: abre `wa.me` con mensaje pre‑formateado + enlace.
    - **Guardar versión**: registra v1, v2… (pestaña Versiones).
    - **Marcar como enviada** / **Pasar a negociación**.

### 2.6 Edición colaborativa (Realtime)
12. Abre la **misma cotización** en otro navegador como `presupuestos@azur.pe`. En la cabecera verás **avatares de quién está conectado**. Edita una fila en una ventana → aparece en la otra **en segundos**. ✔

### 2.7 Aprobar → crea Proyecto
13. **Acciones → Aprobar → crear proyecto**. Confirma. Te redirige al **proyecto nuevo**:
    - El presupuesto llegó **sin margen** (a costo).
    - Se creó el **cronograma de cobros** (armadas) y la **caja chica**.
    - Notificación a Jefe de Proyectos y Presupuestos. ✔

---

## FASE 3 · Proyectos — Last Planner y valorización
**Entra como `proyectos@azur.pe`.** Menú **Proyectos** → abre **ADECCO** (o el que creaste).

### 3.1 Resumen
1. Verifica la **barra de 3 tramos** (Proyectado · Pagos · Gasto), los KPIs y la **Curva S** (planificado vs ejecutado).
2. **Hitos contractuales**: agrega uno con fecha pasada → se marca **Vencido**; con fecha futura → **Próximo**.
3. (Config rápida) ajusta estado, contrato, adelanto %, tope de caja.

### 3.2 Last Planner (4 cuadrantes)
4. Pestaña **Last Planner**. Reconoce los cuadrantes:
   - **Itemizado** (item/título/und/cant/C.U./total) — con **selector de catálogo + APU** al agregar (igual que en cotización).
   - **Programación**: asigna **contratista** (dropdown), **fecha inicio/entrega**.
   - **Estado/Prioridad**: son **automáticos** (no editables).
5. **Agregar valorización** (botón) → crea las columnas de la semana.
6. En las hojas, ingresa el **% avance de la semana**. Mira cómo suben **% Acumulado** y **Saldo** y el rollup a las partidas padre.
7. **Guardar avances**:
   - El **Estado** y la **Prioridad** se recalculan (Completado/En progreso/Detenido/Retrasado; Muy alta…Muy baja) comparando real vs proyectado.
   - Si el gasto rompe una regla de salud → se genera **alerta crítica + push a Gerencia** (lo ves en /alertas y en la campana de gerencia).
8. Panel de **dilución del adelanto**: valorizado del periodo, amortización (= %adelanto × valorizado) y **cobro neto**. Pulsa **Resumen PDF** (entregable al cliente) y **Registrar cobro** (impacta la caja del proyecto). ✔

### 3.3 Cronograma, adicionales, equipo, expediente
9. **Cronograma de cobros**: define armadas (% por avance/fecha), guarda. La suma se valida ≤100%.
10. **Adicionales**: registra un adicional/deductivo → apruébalo/recházalo.
11. **Equipo**: asigna personas con rol de obra (una persona puede tener varios roles).
12. **Expediente**: sube un documento a una carpeta (Contractuales, Evidencias, etc.) → queda listado y descargable. ✔

---

## FASE 4 · Finanzas — del pedido al pago
Flujo entre **3 roles**. Ten abiertos residente, jefe y admin.

### 4.1 Crear solicitud (desde campo)
1. Como `residente@azur.pe` (PWA) → **Pagos** (`/campo/solicitudes`) → completa una solicitud (tipo, proyecto, beneficiario, monto, constancia, etc.) → Enviar.
   - Estado **Solicitada**. Llega **push/bandeja** al Jefe de Proyectos. ✔

### 4.2 Aprobar (N1) → Programar y Pagar (N2) → Gerencia
2. Como `proyectos@azur.pe` → menú **Finanzas** → pestaña **Solicitudes de pago** → **Aprobar** (o Rechazar/Devolver con motivo). Notifica a Administración.
3. Como `admin@azur.pe` → **Programar** (banco origen + fecha) → **Pagar** (sube URL del voucher + detracción).
   - Si el **monto ≥ S/ 20,000** y no eres gerencia → queda **pendiente de aprobación final**; entra `gerencia@azur.pe` y pulsa **Aprobar final**.
4. Tras pagar/conciliar: el botón de **WhatsApp** envía el comprobante. El gasto se imputa al proyecto y, si es caja chica, **descuenta la caja**. El solicitante recibe **push de "Pago realizado"**. ✔

### 4.3 CxC (cuentas por cobrar)
5. Pestaña **Cuentas por cobrar**:
   - **Armadas por facturar** → **Emitir factura**.
   - En la factura → **Cobrar** (registra abono, parcial/total). El estado cambia y el cobro impacta la caja.
   - Revisa el **aging** (Corriente / 1‑30 / 31‑60 / +60).
6. **Factura manual** con el botón correspondiente.

### 4.4 CxP y Cajas
7. Pestaña **Cuentas por pagar**: lista de obligaciones aprobadas/programadas.
8. Pestaña **Cajas**: abre una caja (botón **Abrir**) → su **vista independiente** con KPIs, **historial de transacciones** y **registrar movimiento** (reposición/abono/egreso/traslado/ajuste). Verifica la **alerta de 80%** del tope. ✔

---

## FASE 5 · PWA de campo (móvil)
**Instala la PWA**: abre la URL en el celular (o Chrome escritorio) → "Instalar app". Entra como `residente@azur.pe`.

1. **Inicio**: **Check‑in / Check‑out** con GPS (acepta el permiso de ubicación). Verás "registrada con ubicación GPS".
2. **Parte (RDO)**: elige proyecto, clima, personal, observaciones; agrega varias **actividades** (con partida y % avance) → Enviar. Aparece en la lista de partes.
3. **Evidencias**: toma/sube **foto** (con cámara), captura GPS, vincula a partida → se sube al storage y aparece en la galería.
4. **SST** (entra como `soma@azur.pe`): pestañas **Charla 5 min**, **Observación** (acto/condición + foto), **Incidente** (gravedad + foto).
5. **Almacén** (como `logistica@azur.pe`): consulta inventario y registra **salida/devolución** a un proyecto.
6. **Offline**: activa modo avión y navega entre pantallas ya visitadas (el service worker las cachea). ✔

---

## FASE 6 · Notificaciones push (VAPID)
1. En cualquier sesión, abre la **campana** → botón **Activar notificaciones push** → acepta el permiso del navegador.
2. Verifica el setup: abre **`/api/push/diag`** → debe mostrar `vapid` todos en `true`, `suscripciones.count ≥ 1` y `testPush.ok = true` (y llega una notificación).
3. **`/api/push/test`** → llega un push de prueba (`enviadas: 1`).
4. **Flujo real**: crea una solicitud desde la PWA (residente) y apруébala desde la web (jefe) en otra ventana → debe **llegar el push** y verse en la **campana** con badge.
5. Centro de notificaciones: abre la campana → **Marcar leídas**. ✔

> En iPhone, el push solo funciona con la **PWA instalada** (no en Safari normal).

---

## FASE 7 · Dashboards, Alertas y Reportes
**Entra como `gerencia@azur.pe`.**

1. **/inicio**: KPIs del mes (ingresos/egresos/activos/alertas), **barras de 3 tramos** por proyecto con su semáforo de salud, panel de **alertas críticas**.
2. **/alertas**: filtra (abiertas/resueltas), marca una como **resuelta**.
3. **/reportes**:
   - **Estado de resultados por línea** (Cocina Pro / Azur Construcción / Mantenimiento).
   - **Gasto por las 5 categorías** (gráfico).
   - **Tabla de proyectos** con salud.
   - **Exportar CSV**. ✔

---

## FASE 8 · Usuarios y permisos
**Entra como `gerencia@azur.pe` o `admin@azur.pe`.** Menú **Usuarios**.
1. **Nuevo usuario** (nombre, email, rol, contraseña) → se crea y puede iniciar sesión.
2. Cambia el **rol** de alguien / **activa‑desactiva**.
3. **Verifica segmentación (RLS):** entra como `residente@azur.pe` → **no** ve Finanzas global, márgenes ni cajas; solo sus proyectos y su trabajo de campo. ✔
4. **Perfil** (menú de usuario → Mi perfil): cambia nombre/teléfono y sube avatar.

---

## ✅ Checklist rápido (todo en uno)
- [ ] Login con cada rol y ruteo correcto (ERP vs PWA)
- [ ] Cliente: crear, importar, inline desde cotización
- [ ] Catálogo: partidas/insumos, actualización masiva de precios
- [ ] Cotización: árbol 4 niveles, catálogo+APU, margen, descuento, totales
- [ ] Cotización: PDF, Excel, WhatsApp, versiones, edición colaborativa
- [ ] Aprobar cotización → proyecto sin margen + armadas + caja
- [ ] Proyecto: Last Planner, valorización, estado/prioridad auto, curva S
- [ ] Dilución del adelanto + cobro a caja + valorización PDF
- [ ] Cronograma cobros, adicionales, equipo, expediente, hitos
- [ ] APU en proyecto + guardar APU como plantilla del catálogo
- [ ] Solicitud de pago (PWA) → aprobar → programar → pagar → gerencia → WhatsApp
- [ ] CxC (factura, cobro, aging), CxP, cajas + vista de caja independiente
- [ ] PWA: check‑in GPS, RDO, evidencias, SST, almacén, offline
- [ ] Push: activar, /diag, /test, flujo real, campana
- [ ] Dashboards, alertas automáticas de salud, reportes + CSV
- [ ] Usuarios, RLS por rol, perfil/avatar

---

## 🧹 Antes de producción
1. Quitar el bloque de **usuarios de prueba** del login (`src/lib/dev-users.ts` + `<DevUsers/>`).
2. Limpiar los **datos sembrados** (proyectos demo, cotización demo) y dejar los catálogos reales.
3. **Rotar todas las credenciales** (Supabase keys, access token, VAPID si aplica).
4. Configurar las **variables de entorno en Vercel** y conectar el repositorio.
