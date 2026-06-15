# Especificación Técnica de Desarrollo
## ERP Integral + PWA · AZUR Constructora
**Referencia interna:** PRO-2026-AZUR-001 · Promptive (Luciérnaga & Asociados S.A.C.)
**Propósito:** Documento maestro de desarrollo (dev-facing). Narra todos los flujos, funciones, roles, formularios, botones y notificaciones del sistema. **No define el esquema de base de datos** — la estructura de tablas y relaciones la decide Claude Code durante la implementación.
**Fuentes fusionadas:** kick-off (parte 1 y 2), Anexo Técnico-Funcional cliente-facing PRO-2026-AZUR-001, formato real de solicitud de pagos (Excel), dashboard REPORTE, RDO de WhatsApp (caso GADDI), propuesta de edición colaborativa, Knowledge Base del primer proyecto (Anexo A) y la **especificación celda por celda de Cotización y Gestión de Proyecto** basada en `COTIZACIÓN_MODELO.xlsx` y `GESTIÓN_DE_PROYECTO_MODELO.xlsx` más tres reuniones (Anexo B).
**Decisiones de alcance aplicadas:** sin Telegram y sin API de WhatsApp (solo mensajes formateados vía `wa.me`); sin módulo de cuenta corriente ni conciliación bancaria; **dos** alertas de salud distintas (regla #1 gasto menor o igual a pagos menor o igual a proyectado, regla #2 gasto real menor o igual a valorizado).
**Stack objetivo:** Next.js 14 (App Router) · TypeScript · Supabase (PostgreSQL + Auth + Storage + Realtime) · Vercel · Tailwind CSS · shadcn/ui.

---

## 0. Principios rectores

1. **Una sola fuente de verdad.** Toda solicitud, aprobación, pago, valorización y reporte vive en la plataforma. WhatsApp, Drive y MS Project dejan de ser repositorios.
2. **El software se adapta al negocio.** Lo descrito es el comportamiento esperado; los matices finos se ajustan en el kick-off.
3. **Trazabilidad total.** Cada acción crítica (solicitud, aprobación, edición de cotización, pago, valorización) queda registrada con usuario, fecha, hora y valor anterior/nuevo.
4. **Baja fricción en campo.** La PWA debe ser usable por personal de obra de cualquier edad, con mínimos toques y operación parcial sin conexión.
5. **Comunicación por WhatsApp formateado, sin API.** Todas las funciones "Enviar por WhatsApp" generan un mensaje pre-formateado + enlace público (esquema `wa.me` / `https://wa.me/?text=`). No hay integración con WhatsApp Business API ni Telegram.

---

## 1. Modelo conceptual del negocio (sin esquema de BD)

La jerarquía operativa que el sistema debe respetar:

**Línea de negocio → Proyecto → Etapas/Categorías → Partidas → (Solicitudes de pago · Valorizaciones · Partes diarios)**

- **Línea de negocio (DIVISION):** AZUR opera **tres líneas internas confirmadas**, cada una con **plantilla de cotización propia, plan de cuentas independiente e identidad visual** (logo, color, tipografía). Todo proyecto pertenece a una línea. La línea es además dimensión de filtro y de estado de resultados en toda la reportería.
 - **Cocina Pro (CP):** plan de cuentas independiente, identidad propia. Ya existe formato (AZUR compartirá los archivos).
 - **Azur Construcción:** cuentas separadas, estructura por partidas con APU. Aún no tiene plantilla formal → se construye durante el desarrollo.
 - **Mantenimiento:** soporta cronograma de servicios futuros vinculado al presupuesto. Se diseña a medida en el kick-off técnico.
- **Tipo de proyecto — Grande vs. Chico** (deriva del tipo de cotización, ver Sección 3.6):
 - **Grande (Construcción):** obra con presupuesto por partidas con metrados, APU, curva S, valorización formal, adicionales/deductivos y liquidación.
 - **Chico (Mantenimiento / acondicionamiento de locales):** trabajos de servicio (ej. cambio de luminarias, faceplates, pintado, limpieza). No usa metrados contractuales; opera con lista de actividades, costos directos y control de caja/gasto. El parte diario funciona como bitácora de servicios.
 - El sistema soporta ambos: al crear el proyecto se elige el tipo, y eso determina qué módulos/campos se activan (metrados y curva S solo en Grande).
- **Caja del proyecto:** cada proyecto tiene su caja chica propia, que **se inicializa al crear el proyecto** según la modalidad de cobro (ver Sección 5.4 y Sección 7).
- **Las 5 categorías/tipos de gasto (confirmadas por el cliente):** **(1) Contratistas, (2) Proveedores, (3) Caja chica, (4) Servicios, (5) Honorarios.** Cada una con su dinámica de sustento (ver Sección 5.1). Adicionalmente, el costo se clasifica por **componentes de obra** (mano de obra, materiales, equipos, subcontratos, gastos generales) dentro del APU. Cada categoría puede tener un **tope** que dispara alerta de sobrecosto.

---

## 2. Roles, accesos y qué ve/hace cada uno

Acceso por rol; cada perfil ve únicamente lo necesario. La información sensible (costos, márgenes, finanzas) se protege. Configuración fina de permisos en kick-off.

### 2.1 Gerencia General — *ERP completo (web)*
- Ve todos los módulos, todas las líneas y todos los proyectos.
- **Aprobación final de pagos** (tercer nivel del flujo).
- Dashboards ejecutivos cruzados: financiero, avance físico, margen real por proyecto.
- **Receptor principal de alertas push críticas:** sobrecosto, sobretiempo, gasto > pagos, hito contractual en riesgo.
- Puede ver el margen comercial real (oculto a otros roles).

### 2.2 Jefe de Proyectos — *web: Proyectos + Finanzas*
- **Primer nivel de aprobación** de solicitudes de pago.
- Gestiona cronograma, valorización, curva S, adicionales/deductivos, informe al cliente.
- Ve sus proyectos asignados; no ve el margen comercial.

### 2.3 Jefe de Presupuestos y Costos — *web: Comercial + Proyectos*
- Arma cotizaciones (APU), mantiene catálogo de partidas e insumos.
- Control de presupuesto vs. ejecutado, registro/seguimiento de adicionales y deductivos, reportes de desvío.

### 2.4 Administrador — *web: Finanzas*
- **Segundo nivel:** recibe la aprobación del jefe de proyectos, valida y **programa el pago**.
- Registra cuenta bancaria de origen, datos del beneficiario, carga el voucher tras el desembolso.
- Registra detracciones cuando aplique. Maneja caja central y cajas chicas, **CxC y CxP** y la reportería financiera. *(En AZUR este rol lo cubre Pamela.)*

### 2.5 Comercial — *web: Comercial*
- Arma y envía cotizaciones, gestiona estados, edita en colaboración con Presupuestos.
- Gestiona catálogo de partidas/insumos de su línea.

### 2.6 Residente / Coordinador de obra — *PWA (campo)*
- Check-in/out GPS, parte diario (RDO), solicitudes de pago, captura de evidencias, tareo de cuadrilla, valorización semanal, consulta de almacén.
- Ve **solo sus proyectos asignados**. Inicia el flujo de pago. **No ve márgenes ni datos financieros globales.**

### 2.7 Prevencionista (SOMA) — *PWA (campo)*
- Rol exclusivo de Seguridad, Salud Ocupacional y Medio Ambiente, sobre sus proyectos.
- Charla de 5 minutos, observaciones de seguridad, incidentes, capacitaciones.

### 2.8 Logístico — *web/PWA: Almacén + compras*
- Inventario, salidas/devoluciones, gestión de proveedores y abastecimiento en obra (Sección 8bis).

> **Regla flexible de obra:** en proyectos chicos una sola persona puede asumir Residente + Prevencionista + Logístico; en grandes van separados. El sistema permite **asignar uno o varios roles a una misma persona dentro de un proyecto sin duplicar usuarios**.

> **Usuarios ilimitados** en el plan inicial. La segmentación se implementa con **Row-Level Security (RLS)** en Supabase: cada rol ve solo las filas que le corresponden, calculado dinámicamente en cada consulta. **Regla rectora del cliente:** el coordinador residente NO ve toda la información financiera del proyecto, solo lo necesario para su rol.

---

## 3. MÓDULO COMERCIAL — Cotizaciones, APU y edición colaborativa

Punto de entrada del sistema. Genera las cotizaciones que, al aprobarse, crean el proyecto.

> **Detalle celda por celda en el ANEXO B (Parte A).** La especificación exacta del cuadro de costos, el cuadro de margen, la fórmula del precio unitario, el bloqueo de niveles, el descuento comercial, las formas de pago dinámicas, las plantillas de condiciones y el nombre de archivo estandarizado está basada en el archivo real `COTIZACIÓN_MODELO.xlsx` y se desarrolla en el Anexo B, Parte A. Esta sección 3 es el resumen funcional; el Anexo B es la fuente de implementación.

### 3.1 Pantalla "Cotizaciones" (listado)
**Elementos:**
- Tabla/listado de cotizaciones con: número correlativo, cliente, línea de negocio, proyecto propuesto, monto total, estado (con color), fecha, responsable.
- **Filtros:** por línea de negocio, estado, cliente, rango de fechas.
- **Buscador** por número, cliente o nombre de proyecto.
- **Botón "Nueva cotización"** (arriba a la derecha) → abre el asistente de creación.
- En cada fila, menú de acciones (⋮): *Abrir / Editar*, *Duplicar*, *Descargar PDF*, *Enviar por WhatsApp*, *Enviar por correo*, *Cambiar estado*, *Ver historial*.

### 3.2 Flujo de creación de cotización (lineal)
**Paso 0 — Origen del lead (registro inicial):**
- Antes de armar la cotización, el sistema registra **cómo llegó el contacto** (alimenta la reportería comercial: tasa de conversión por canal, fuentes más rentables, ranking de referidos):
 - *Contacto directo* (cliente por iniciativa propia).
 - *Recomendación de tercero* (con registro del recomendador).
 - *Visita a oficina.*
 - *Llamada o reunión* (telefónica o presencial concertada).
- Selección/creación del **cliente**. Si no existe, se crea; los clientes pueden venir de la **importación masiva** (Sección 3.7).

**Paso 1 — Datos generales:**
- Selección de **línea de negocio** (carga la plantilla, el plan de cuentas, la identidad visual y el catálogo correspondientes).
- **Tipo de cotización** (Única de obra / Programada de mantenimiento / Recurrencia variable — ver Sección 3.6), que determina el **tipo de proyecto** (Grande / Chico).
- Cabecera: datos del cliente (razón social, RUC/DNI, contacto), nombre del proyecto, validez (días), plazo de entrega, **moneda y tipo de cambio** (si es USD, se fija el TC del día al enviar).
- El número de cotización se asigna **automático y correlativo** al guardar.

**Paso 2 — Armado del presupuesto (por categorías/partidas):**
- Estructura por **categoría → partida → subpartida**.
- **Botón "Agregar categoría"**, **"Agregar partida"**, **"Agregar subpartida"**.
- Cada partida: descripción, unidad, cantidad, **precio unitario (P.U.)**, subtotal automático. Subtotal por categoría automático. Total general automático.
- **Carga desde catálogo:** botón "Buscar en catálogo" abre selector de partidas/insumos con precio referencial; al elegir, **el precio y la descripción quedan editables** (el catálogo es referencial, no rígido).
- **APU (solo proyectos Grande):** botón "Detallar APU" en una partida → abre el desglose en componentes: mano de obra (con jornales y rendimientos por cuadrilla), materiales (cantidades y precios), equipos/herramientas, gastos generales. El P.U. de la partida se calcula desde el APU.
- **Gastos generales y utilidad** como porcentaje sobre el costo directo (estructura típica de obra).

**Paso 3 — Margen comercial (POR PARTIDA, no como bloque final):**
- **Regla crítica del cliente:** el margen se aplica **individualmente a cada partida sobre su P.U.**, no como un bloque agregado al final. Así el precio total se distribuye orgánicamente y el cliente no percibe un monto de utilidad concentrado.
- **Margen mínimo: 30% por partida (configurable).** Cada partida puede llevar un % distinto (mayor en partidas de riesgo, menor en commodity).
- El **margen NUNCA es un costo directo.** El sistema mantiene tres valores que conviven por partida:
 - **Costo directo** (materiales + MO + equipos + subcontratos + GG). Vista de Presupuestos/Gerencia. No cambia con descuentos.
 - **Margen aplicado** (% y monto absoluto), configurable por partida.
 - **Precio final visible al cliente** (costo + margen). Es lo único que sale en el PDF.
- Margen y costo solo los ven Gerencia / Presupuestos / Comercial, nunca el cliente ni los roles de obra.

**Paso 4 — Renegociación · dos modos de descuento:**
Durante la negociación es frecuente que el cliente pida ajuste de precio. El sistema soporta **dos modos**, y en ambos el **costo directo interno queda intacto** (el descuento se absorbe del margen):
- **Modo A — Descuento porcentual equitativo a todas las partidas:** se ingresa un % (ej. 5%, 10%) o un monto absoluto sobre el total; el sistema lo distribuye proporcionalmente entre todas las partidas, ajustando el margen de cada una, y recalcula subtotales por categoría y total general.
- **Modo B — Descuento a una partida específica:** se selecciona la partida puntual (ejemplo real: S/ 4,425 → S/ 4,225), se ingresa el nuevo precio o el monto del descuento; el sistema recalcula el subtotal de esa categoría y el total general; el resto de partidas no cambia.
- **Versionado de la negociación:** cada ajuste genera una **versión (v1, v2, v3…)** guardada con justificación, usuario y fecha. El equipo comercial puede **compararlas lado a lado**; la versión final aceptada es la que se convierte en proyecto. *(Esto es distinto de la edición colaborativa en vivo del Sección 3.3: el versionado es el historial de propuestas enviadas; la coedición es la escritura simultánea sobre el borrador.)*

**Paso 5 — Vista y entrega:**
- **Dos vistas:**
 - *Vista cliente:* limpia, con total, sin desglose de costo ni margen, con identidad visual de la línea de negocio.
 - *Vista interna:* desglose completo (costo directo, margen, utilidad).
- **Botón "Generar PDF"** → plantilla profesional con logo/identidad de la línea, datos del cliente, validez, plazos, términos.
- **Doble formato en un solo botón:** el sistema entrega **PDF (cliente) + Excel editable (interno)** simultáneamente, sin generar dos veces.
- **Tipo de cambio integrado:** si la cotización es en USD, fija el TC del día al momento del envío para que el cliente vea una cifra final consistente.
- **Botón "Enviar por WhatsApp"** (mensaje pre-formateado + enlace al PDF) y **"Enviar por correo"**.

### 3.3 Edición colaborativa en tiempo real (Google-Docs-style)
Requisito: varios miembros (Comercial + Presupuestos) editan la misma cotización a la vez, sabiendo quién edita qué.

**Comportamiento (vía Supabase Realtime):**
- **Presencia:** al abrir la cotización se muestran los **avatares de los usuarios conectados** en ese momento (esquina superior). Tooltip con nombre y rol.
- **Sincronización en vivo:** cuando un usuario agrega/edita/elimina una partida, el cambio aparece en las pantallas de los demás **en segundos**, sin recargar.
- **Bloqueo suave por fila:** mientras un usuario edita una partida, esa fila se marca como "fulano está editando…" para los demás (bloqueo optimista). Evita pisar cambios. Si dos editan a la vez el mismo campo, gana la última escritura y se notifica el conflicto.
- **Indicador de guardado:** "Guardando…" / "Todos los cambios guardados" (autosave).
- **Auditoría campo por campo (changelog):** **botón "Historial de cambios"** abre un panel con la lista cronológica: *usuario · fecha/hora · campo · valor anterior → valor nuevo*. Filtrable por usuario y por partida. Esto cubre "saber quién editó cada cosa".

### 3.4 Estados de la cotización
- Estados: **Borrador → Enviada → En negociación → Aceptada / Vencida / Rechazada.**
 - *Borrador:* edición libre, sin alertas.
 - *Enviada:* PDF enviado al cliente; alerta a bandeja de Comercial + cronómetro de validez activo.
 - *En negociación:* el cliente pide ajustes; cada versión queda registrada (Sección 3.2 Paso 4); recordatorio de seguimiento.
 - *Aceptada:* conversión automática a proyecto + carga del cronograma de cobros (Sección 4.1bis).
 - *Vencida:* pasó la validez sin respuesta; alerta a Comercial para gestionar reactivación.
 - *Rechazada:* el cliente declina; se registra motivo; queda en histórico para análisis de pérdidas.
- **Botón "Marcar como Aceptada":** genera automáticamente el proyecto en Proyectos con el presupuesto base **descontado el margen** (Proyectos trabaja con costo, no con precio de venta) y carga el **cronograma de cobros**.
- **Histórico de cotizaciones por cliente** con filtros y búsqueda.

### 3.5 Catálogos
- **Catálogo maestro de partidas/subpartidas** con costos referenciales, por línea de negocio.
- **Catálogo de insumos maestros** (cemento, fierro, agregados, MO calificada/no calificada, etc.) reutilizable, con **actualización masiva de precios** (botón "Actualizar precios"). Al actualizar, **recalcula los APU de cotizaciones en borrador** y **avisa qué cotizaciones enviadas quedan desactualizadas**.
- **Rendimientos por cuadrilla** configurables y aplicables a múltiples partidas.
- **Edición ad-hoc sin alterar el maestro:** los valores cargados a una cotización son editables al momento (precio, descripción, cantidad) y **no afectan el catálogo central**; para actualizar el maestro permanentemente se hace desde mantenimiento de maestros, con control de versiones.

### 3.6 Tipos de cotización (define obra Grande vs. mantenimiento Chico)
- **Única de obra:** proyecto puntual de construcción. Una entrega, un cronograma de cobros, un cronograma de ejecución. Aplica a la mayoría de Azur Construcción y a obras puntuales de Cocina Pro. → proyecto **Grande**.
- **Programada de mantenimiento:** contratos recurrentes (caso real: cliente *Mercer*). No es un servicio puntual sino un **cronograma de servicios futuros** con fechas, montos y categorías por visita.
 - El cronograma se envía al cliente junto con el presupuesto.
 - Cada servicio futuro queda registrado con su fecha planificada.
 - **Alertas automáticas antes de cada fecha** (configurable: 7, 15, 30 días antes), **diferenciadas por categoría + fecha** (no solo por categoría, como en obra).
 - Al ejecutarse un servicio, se actualiza el estado y se prepara la facturación. → proyecto **Chico**.
- **Recurrencias variables:** semanal, quincenal, mensual, trimestral, semestral o personalizada según contrato.

### 3.7 Importación masiva de clientes
- Carga de la **cartera histórica** vía Excel con plantilla provista: importa el listado completo (RUC, razón social, contacto), **detecta duplicados** y deja los clientes disponibles de inmediato para asociar a cotizaciones.

### 3.8 Notificaciones del módulo Comercial
- Cotización **enviada** → registro en histórico + alerta a bandeja de Comercial con resumen y fecha de validez.
- Cotización **por vencer** (configurable, ej. 3 días antes) → recordatorio a Comercial.
- Cotización **vencida** → cambio de estado sugerido + alerta de reactivación.
- Cotización **de mantenimiento** → alertas por **categoría + fecha** antes de cada servicio (ver Sección 3.6 y Sección 7).
- Cotización **aceptada** → notifica a Jefe de Proyectos y Presupuestos (se creó un proyecto nuevo).

---

## 4. MÓDULO GESTIÓN DE PROYECTOS — Presupuesto, cronograma y valorización

Capa de control. Recibe el presupuesto desde Comercial y gobierna ejecución, avance y valorización.

> **Detalle cuadrante por cuadrante en el ANEXO B (Parte B).** La estructura del Last Planner (4 cuadrantes), la relación presupuesto comercial vs. proyectos, las valorizaciones acumulables, la dilución del adelanto y la automatización de estado de tarea y prioridad está basada en el archivo real `GESTIÓN_DE_PROYECTO_MODELO.xlsx` y se desarrolla en el Anexo B, Parte B. Esta sección 4 es el resumen funcional; el Anexo B es la fuente de implementación.

### 4.1 Creación y estructura del proyecto
- Un proyecto se crea **automáticamente al aceptar una cotización** (hereda partidas con costo sin margen) o **manualmente** (botón "Nuevo proyecto").
- Hereda trazabilidad: desde el proyecto se consulta la **cotización origen, todas sus versiones y la versión final firmada**.
- Al crear se define: **línea de negocio**, **tipo (Grande/Chico)**, **modalidad de cobro** (contado / crédito con adelanto — Sección 5.4), **monto máximo de caja chica** (Sección 7.2), responsable (Jefe de Proyectos), equipo asignado, fechas de inicio/fin. Se genera **código de proyecto correlativo**.
- Estructura por **etapas → partidas → subpartidas**, con **porcentaje de avance editable** por partida.
- Al crearse, el sistema **inicializa la caja chica** del proyecto (Sección 7.2) y el **cronograma de cobros** (Sección 4.1bis).

### 4.1bis Cronograma de cobros del cliente ("armadas")
Al cerrarse la cotización se define cómo se cobrará al cliente. El sistema soporta cualquier distribución:
- **Ejemplo común:** 4 armadas iguales de 25%.
- **Ejemplo alternativo:** 20% adelanto + 30% al 50% de avance + 30% al 90% + 20% al cierre.
- **Personalizado:** cada armada con su %, monto, fecha esperada y **condición disparadora** (% de avance o fecha fija).
- Cada armada es un **hito de cobro**. Al cumplirse su condición, el sistema avisa a Comercial y Administración para **emitir la factura** correspondiente (CxC, Sección 5.6).

### 4.1ter Asignación del equipo del proyecto (roles de obra)
Al activarse el proyecto se asigna el equipo. Roles operativos:
- **Coordinador Residente / Jefe de Obra:** operativo en sitio; reporta avance, genera solicitudes de pago, llena el RDO, sube evidencias, valida materiales recibidos.
- **Prevencionista (SOMA):** Seguridad, Salud Ocupacional y Medio Ambiente; charlas de 5 min, observaciones, incidentes, capacitaciones.
- **Logístico:** compras, abastecimiento de materiales, proveedores en obra; vinculado a Almacén (Sección 8bis).
- **Regla flexible:** en obra chica una sola persona asume los tres; en obra grande van separados. El sistema permite **asignar uno o varios roles a una misma persona dentro de un proyecto sin duplicar usuarios**.

### 4.2 Cronograma
- **Cronograma planificado:** fechas inicio/fin por categoría y partida (botón "Definir cronograma").
- **Cronograma ejecutado:** lo actualiza el residente desde la PWA con avance real por partida.
- **Curva S (solo Grande):** gráfico de avance acumulado planificado vs. ejecutado en el tiempo. Es el estándar para reportar al cliente.
- **Hitos contractuales:** registro de hitos con fecha comprometida; alertas previas al vencimiento.

### 4.3 Valorización e informe semanal del residente
Punto crítico del módulo. Ordena la relación con el cliente (sustenta cobros), con gerencia (mide rentabilidad) y con obra (controla consumo). Se consolida **cada jueves**.
- **Flujo del informe semanal:** cada jueves el residente consolida desde PWA o web → recibe el **presupuesto vigente** (incluidos adicionales/deductivos aprobados) → **carga el % de avance** por actividad/categoría/partida → sube **evidencias fotográficas** (georreferencia + timestamp) → el sistema **arma el informe automáticamente**, listo para enviar al cliente.
- **Contenido del informe consolidado:** avance % por partida (semana), avance % acumulado, comparativo planificado vs. ejecutado (% y monetario), valorización del periodo, valorización acumulada, **por cobrar acumulado no valorizado**, adicionales/deductivos del periodo, galería de evidencias por partida, notas del residente.
- **Formato estándar del sector (Grande):** cuadro por partidas con metrado contractual, metrado anterior, metrado del periodo, metrado acumulado, P.U. y monto valorizado.
- Periodicidad **semanal o quincenal** (configurable; AZUR consolida los **jueves**).
- **Botón "Generar valorización"** → documento (PDF + Excel) con membrete configurable.
- **Control de adelantos del cliente y amortización por valorización:** si hubo adelanto, cada valorización amortiza la parte proporcional.
- **Dos alertas de salud distintas (criterio oficial):**
 1. **Salud financiera de caja (regla del Excel REPORTE):** **Gasto menor o igual a Pagos menor o igual a Proyectado.** Compara, por proyecto, lo *gastado* (egresos), lo *cobrado al cliente* (pagos/abonos) y el *costo total proyectado*. Si el gasto supera lo cobrado, o lo cobrado no avanza hacia lo proyectado → alerta. Alimenta el dashboard de tres tramos (Sección 6.1).
 2. **Salud de avance vs. consumo (regla del Anexo):** **Gasto real menor o igual a Valorizado.** Compara lo *gastado realmente* (solicitudes de pago + salidas de caja chica + compras imputadas) contra lo *valorizado al cliente*. Si gasto real < valorizado → buena salud; si gasto real > valorizado → **alerta de sobrecosto** (se está consumiendo más rápido que el avance). 
 - Ambas conviven: la primera vigila el **cobro vs. desembolso** (liquidez/financiero); la segunda vigila el **consumo vs. avance** (rentabilidad/ejecución). Las dos disparan alerta crítica con push a Gerencia (Sección 7.1).

### 4.4 Partes diarios y evidencias (consolidación)
- Los **partes diarios (RDO)** que envía el residente desde la PWA se **consolidan automáticamente** en informe semanal/quincenal/mensual (texto + fotos), exportable a PDF para el cliente.
- **Repositorio de evidencias fotográficas** por proyecto, etiquetadas por partida y fecha; disponibles para valorización e informe.

### 4.5 Adicionales y deductivos (Grande)
- **Botón "Registrar adicional/deductivo"** → descripción, sustento (adjunto/foto), monto, partida afectada.
- Flujo de aprobación → al aprobarse se **refleja automáticamente** en el presupuesto vigente y en la curva S.

### 4.6 Informe ejecutivo y liquidación
- **Informe ejecutivo gerencial:** cruza información financiera + avance físico; indica si el proyecto está **dentro de plazo y dentro de margen**.
- **Liquidación de obra al cierre:** balance final entre **presupuestado, valorizado, cobrado y gastado**, con **utilidad real** del proyecto.

### 4.7 Expediente digital del proyecto (carpetas)
Cada proyecto tiene su expediente, accesible desde web y PWA, organizado por carpetas:
- **Información del proyecto** (cliente, ubicación, fechas, equipo asignado).
- **Historia** (timeline de cambios de estado, aprobaciones, hitos).
- **Documentos contractuales** (contratos, anexos, planos, especificaciones, cotización firmada).
- **Material utilizado** (registro con vínculo al APU).
- **Productos por categoría** (catalogación para reportería técnica).
- **Evidencias fotográficas** (etiquetadas por partida y fecha, desde PWA).
- **Documentos SST** (charlas, capacitaciones, incidentes, observaciones del prevencionista).

### 4.8 Control físico vs. financiero (alimenta alertas)
- **Avance físico vs. avance financiero:** detecta cuando se ha gastado más de lo ejecutado (sobrecosto temprano) → alerta (Sección 7), según la regla de salud #2 del Sección 4.3.

---

## 5. MÓDULO FINANZAS Y ADMINISTRACIÓN — Eje del sistema

Trazabilidad total del flujo **solicitud → aprobación → pago → comprobante**.

### 5.0 Los cinco tipos de solicitud de pago (confirmados por el cliente)
Cada tipo tiene su dinámica de sustento y lógica de aprobación propia:
1. **Contratistas** — pagos a empresas subcontratadas. Factura electrónica + **detracción** si aplica.
2. **Proveedores** — compras de materiales, equipos, servicios. Factura electrónica.
3. **Caja chica** — reposiciones de la caja chica del proyecto. Boleta/ticket.
4. **Servicios** — agua, luz, alquiler de equipos, fletes, gastos recurrentes.
5. **Honorarios** — personas naturales con **recibo por honorarios electrónico (RHE)**.

### 5.1 Formulario "Solicitud de pago" (réplica del formato real del cliente)
Origen: lo inicia el residente desde la PWA (Sección 8) o el administrador desde web. Campos **exactos** del formato actual de AZUR:

1. **TIPO** (los 5 del Sección 5.0: Contratistas / Proveedores / Caja chica / Servicios / Honorarios).
2. **PROYECTO** (selector; filtra por los proyectos del usuario).
3. **PARTIDA PPTO** (selector de la partida del presupuesto).
4. **FECHA DE REGISTRO** (automática).
5. **CONTRATISTA / PROVEEDOR / TRABAJADOR / COLABORADOR** (beneficiario).
6. **ESPECIALIDAD / ETAPA** (ej. carpintería, piedra, eléctrico).
7. **CATEGORÍA / ETAPA** (ej. MOD — Mano de Obra Directa).
8. **DIVISION** (línea de negocio; autocompletada desde el proyecto).
9. **MONTO (S/)** del gasto.
10. **CONSTANCIA** (tipo de comprobante: Factura / Boleta / RHE).
11. **GESTOR / PAGADOR** (responsable del pago).
12. **DESCRIPCIÓN** (detalle del servicio/compra).
13. **CTA BANCARIA O INTERBANCARIA** del beneficiario.
14. **R.U.C. / D.N.I.** del beneficiario.
15. **RAZÓN SOCIAL / NOMBRE** del beneficiario.
16. **N.º FACTURA / BOLETA / RHE.**
17. **STATUS** (automático según el flujo: Solicitada → Aprobada → Programada → Pagada → Conciliada).
- **Adjunto opcional:** cotización o comprobante previo (foto/PDF).
- **Botón "Enviar solicitud"** → entra al flujo de aprobación.

### 5.2 Flujo de aprobación (paso a paso, con trazabilidad)
1. **Coordinador Residente** crea la solicitud (web o PWA); solo ve sus proyectos; selecciona tipo (1-5), proyecto, categoría/partida, monto, beneficiario; sube sustento (factura/boleta/RHE) y cotización previa opcional → estado **Solicitada**.
2. **Jefe de Proyectos** la recibe en su bandeja; revisa pertinencia (¿partida presupuestada?, ¿dentro del consumo esperado?) → **Aprobar / Rechazar / Devolver con observaciones** → estado **Aprobada** y notifica a la Administradora.
3. **Administradora (Pamela)** ve todas las aprobadas en su bandeja consolidada (todos los proyectos); prioriza por urgencia/monto/proyecto/proveedor; valida sustentos y datos bancarios.
4. **Programación y ejecución:** elige la **cuenta bancaria de origen** (caja central / cuenta del proyecto), programa la fecha, ejecuta el pago en el banco (acción externa), vuelve al sistema y marca **Pagada**, subiendo el **voucher** (PDF/foto).
5. **Aprobación final de Gerencia** cuando corresponde (montos altos / política — umbral configurable, Sección 12).
6. **Confirmación y cierre:** el gasto se **imputa automáticamente** a proyecto + categoría + partida + tipo; se actualiza el dashboard de gasto acumulado; si afecta caja chica, se descuenta del saldo; la solicitud queda **Conciliada** con **audit log completo** (quién, cuándo, qué, por qué).
- **Cada paso registra usuario, fecha y hora.** Bandeja por rol, con **priorización por urgencia**.

### 5.3 Comprobante y envío por WhatsApp (sin Telegram ni API)
- Al cargar el voucher, el sistema genera una **URL pública del comprobante**.
- **Botón "Enviar por WhatsApp"** → abre WhatsApp con un **mensaje pre-formateado** (detalle del pago + enlace al comprobante). **Sin API y sin Telegram:** solo enlace `wa.me`. El residente o admin lo reenvía al proveedor/jornalero.
- **Notificación push** al solicitante (en la PWA/web) cuando el pago se marca como Pagado, con enlace al voucher.
- Reemplaza el reenvío manual de vouchers por el grupo de WhatsApp (ahorra a Pamela entre 30 min y 1 h diaria).

### 5.4 Cuentas por Cobrar (CxC) · facturación al cliente
La emisión se dispara desde el **cronograma de cobros / armadas** (Sección 4.1bis). Al cumplirse la condición de una armada (% de avance o fecha), el sistema avisa a Administración para emitir la factura.
- **Emisión de factura electrónica** cuando corresponde una armada; Pamela recibe la notificación.
- **Registro automático en CxC** → entra al estado de cuenta del cliente.
- **Seguimiento de cobranza:** estado por factura (emitida / vencida / parcialmente cobrada / totalmente cobrada).
- **Aging:** antigüedad de saldos por cliente y proyecto (corriente / 1-30 / 31-60 / +60 días).
- **Carga masiva mensual** (Excel) para facturas históricas o emitidas fuera del sistema, más **carga manual** para casos puntuales.

### 5.5 Cuentas por Pagar (CxP) · estado de obligaciones
- **Listado consolidado de CxP:** facturas recibidas + solicitudes aprobadas pendientes de ejecutar.
- **Programación de pagos:** Pamela arma el calendario semanal/quincenal optimizando flujo de caja.
- **Trazabilidad completa:** cuándo se recibió, aprobó y pagó, con qué voucher.

### 5.6 Reportería financiera (tres ejes cruzados)
- **Por línea de negocio:** estado de resultados independiente para Cocina Pro, Azur Construcción y Mantenimiento (cada una con su plan de cuentas).
- **Por proyecto:** P&L por proyecto (ingresos cobrados, gastos imputados, utilidad real, comparativo con la cotización inicial).
- **Por periodo:** semana / mes / tiempo real; acumulados y comparativos.
- **Por las 5 categorías de gasto:** distribución entre contratistas, proveedores, caja chica, servicios y honorarios (dashboard visual).
- **Cruce de las tres áreas del negocio (Comercial + Operativa + Financiera):** permite ver, por ejemplo, cuánto se cotizó en el trimestre, cuánto se ejecutó como proyecto y cuánto se cobró/pagó. Se rompe el silo.

### 5.7 Caja del proyecto (SIN cuenta corriente — solo los datos clave)
**No se implementa un módulo de cuenta corriente ni conciliación bancaria.** La caja conserva los datos financieros esenciales por proyecto:
- **La caja chica se crea e inicializa al crear el proyecto**, según la **modalidad de cobro**:
 - **Al contado:** arranca financiada con el monto cobrado (total o lo pactado) como abono inicial.
 - **Al crédito con adelanto:** arranca con el **adelanto** como primer abono; el resto se cobra según valorizaciones. El adelanto se amortiza por valorización (Sección 4.3).
- **La caja registra y muestra siempre:** saldo inicial, **abonos/pagos del cliente** (ingresos), **egresos** (desembolsos aprobados) y **saldo actual** (= inicial + abonos − egresos).
- Detalle operativo de cajas (central, chica, topes, reposición, cierre) en **Sección 7**.

### 5.8 Notificaciones del módulo Finanzas
- Nueva solicitud → push/bandeja al **Jefe de Proyectos**.
- Aprobada → bandeja a la **Administradora**.
- Programada y pendiente de aprobación final → al **Gerente**.
- Pagada → notifica al solicitante con enlace al voucher.
- Rechazada/devuelta → notifica al solicitante con el motivo.
- Armada por vencer → a Comercial y Administración para emitir factura.

---

## 6. DASHBOARDS Y REPORTERÍA

### 6.1 Dashboard estrella — barra de tres tramos por proyecto
Réplica del requerimiento literal del cliente (hoja REPORTE del Excel):
- Por cada proyecto, **una sola barra** con tres datos superpuestos:
 - **PROYECTADO** = costo total del proyecto (la barra más larga, referencia).
 - **PAGOS / ABONOS** = lo que el cliente ha pagado a AZUR (ingresos acumulados).
 - **GASTO** = lo gastado en el proyecto (egresos acumulados).
- **Lectura de salud:** desempeño normal = *gasto no supera a los pagos, y los pagos llegan a igualar lo proyectado* (**regla #1**). El dashboard resalta visualmente (color) cuando se rompe. Complementa con la **regla #2** (gasto real vs. valorizado) del Sección 4.3.
- **Filtros:** por línea de negocio (DIVISION), por proyecto, por periodo.

### 6.2 Otros gráficos y vistas del dashboard gerencial
- **Vista consolidada multi-proyecto** con **semáforo** (verde/ámbar/rojo) según avance vs. presupuesto.
- **Indicadores top:** ingresos del mes, egresos del mes, utilidad del mes, proyectos activos, alertas pendientes, cotizaciones en negociación.
- **Consumo por categoría** vs. tope, con marca de exceso.
- **Gasto acumulado por proyecto / partida / categoría**, comparativo vs. presupuesto.
- **Avance físico vs. financiero**; **Curva S** (Grande); **ingresos por proyecto**; **n.º de contratistas por proyecto**.
- **Filtros transversales:** línea de negocio, periodo (semana/mes/tiempo real), tipo de gasto, proyecto.
- **Drill-down:** desde cualquier cifra se baja al detalle (ej. "egresos del mes: S/ 120k" → las solicitudes que lo componen).

### 6.3 Reportes automáticos
- **Semanal** de avance (consolida informes de residentes), **quincenal** de valorizaciones (para clientes), **mensual** de cobranzas y de gastos por las 5 categorías, **mantenimientos próximos** (4 semanas adelante), **estado de resultados por línea/mes**, **liquidación** al cierre (utilidad real vs. cotizada).
- Exportables a **Excel y PDF**. Cruce por proyecto, periodo, proveedor y línea de negocio.

### 6.4 Reporte ejecutivo gerencial automático por correo
- **Para:** Gerencia General (Juan). **Frecuencia:** cada **lunes 8:00 am**, automático.
- **Contenido:** resumen semanal — ingresos cobrados, egresos pagados, top 5 proyectos con alertas, cotizaciones por cerrar, valorizaciones pendientes de envío al cliente.
- **Beneficio:** ve la película de la semana sin abrir el sistema; entra solo cuando hay algo que actuar.

### 6.5 Vistas que la gerencia debe poder responder
- *¿Cuánto vamos a facturar este mes?* → pipeline cerrado + armadas por vencer.
- *¿Qué proyectos están en rojo?* → semáforo avance vs. cronograma y gasto vs. valorizado.
- *¿Cuánto debo pagar esta semana?* → calendario de pagos + solicitudes aprobadas pendientes.
- *¿Qué clientes me deben?* → CxC con aging.
- *¿Cuál es la línea más rentable?* → estado de resultados comparativo por línea.
- *¿Cuánto gastamos en jornales el mes pasado?* → gasto por categoría/mes con drill-down a proyecto.

---

## 7. SISTEMA DE ALERTAS Y NOTIFICACIONES

Centralizado: cada alerta tiene **disparador**, **destinatario(s)**, **canal** (bandeja in-app / push PWA / badge en dashboard) y **severidad**.

### 7.1 Alertas críticas → PUSH a Gerencia
Estas, por pedido expreso, generan **notificación push al rol Gerencia** además de aparecer en el dashboard:
- **Sobrecosto del proyecto:** gasto acumulado supera el presupuesto del proyecto.
- **Sobrecosto por categoría:** consumo de una categoría supera su **tope** configurado.
- **Salud financiera de caja (regla #1):** se rompe **Gasto menor o igual a Pagos menor o igual a Proyectado** (gasto > cobrado, o cobro estancado frente a lo proyectado).
- **Sobrecosto por avance (regla #2):** **Gasto real > Valorizado** (se consume más rápido que el avance).
- **Sobretiempo:** cronograma ejecutado atrasado respecto al planificado (partida o proyecto fuera de plazo).
- **Hito contractual en riesgo:** se acerca o vence un hito comprometido.
- **Margen en riesgo:** la utilidad proyectada cae por debajo de un umbral.
- **Movimiento de caja inusual:** monto atípico o categoría inusual (Sección 7bis.3).

### 7.2 Alertas operativas (bandeja / push según rol)
- **Aprobación pendiente** (solicitud de pago) → Jefe de Proyectos / Administrador / Gerente según nivel.
- **Solicitud rechazada / pagada** → solicitante.
- **Cotización por vencer / sin respuesta / vencida** → Comercial.
- **Valorización por emitir** (llegó la fecha de corte, ej. jueves) → Jefe de Proyectos.
- **Adelanto por amortizar** en la siguiente valorización.
- **Servicio recurrente / mantenimiento (categoría + fecha):** alerta programable que combina **categoría y fecha** (ej. 2.º servicio de mantenimiento en julio) → salta en el dashboard del responsable en la fecha definida. Se configura desde la creación de la cotización/servicio.
- **Charla SST no registrada** en el día → Prevencionista / Jefe de Proyectos.

### 7.3 Centro de notificaciones
- **Bandeja de notificaciones** consultable por usuario (campana con badge de no leídas).
- **Push** en la PWA (notificaciones del navegador/celular) cuando una solicitud cambia de estado o salta una alerta crítica.
- Historial de notificaciones por usuario.

---

## 8. APLICATIVO PWA — Personal de obra

Se instala como app desde URL (sin tiendas). Pensado para residentes, coordinadores, prevencionistas y logística. Operación parcial sin conexión.

### 8.1 Asistencia con GPS
- **Botón "Check-in"** al iniciar jornada con **validación GPS** de ubicación en obra.
- **Botón "Check-out"** al finalizar.
- **Tareo de cuadrilla:** registro de asistencia diaria del personal de obra.
- Historial de asistencia consultable por el Jefe de Proyectos.

### 8.2 Parte Diario de Obra (RDO) — baja fricción, sirve a Grande y Chico
Reemplaza el mensaje de texto que hoy mandan por WhatsApp (ej. "PROYECTO GADDI: se colocó faceplate…, se cambió luminarias…, limpieza…").
- **Formulario rápido:** lista de **actividades del día** (texto rápido, se pueden agregar varias con botón "+ Actividad").
- **Opcional por actividad:** vincular a **partida** (alimenta valorización en Grande) y **adjuntar foto**.
- Campos del RDO: avance del día por partida, observaciones, incidencias, **condiciones climáticas**, personal trabajando, equipos en uso, materiales recibidos.
- **Botón "Enviar parte del día"** → se guarda y **se consolida automáticamente** en el informe semanal.
- En obra **Chica**, el RDO funciona como **bitácora de servicios** (no exige partida ni metrado).

### 8.3 Captura de evidencia
- **Fotos desde la cámara** con geolocalización, fecha y hora.
- Etiquetado por partida/actividad; **vinculación automática al proyecto**.
- Quedan disponibles para valorización e informe semanal.

### 8.4 Solicitudes de pago (desde campo)
- Formulario rápido con los 17 campos del Sección 5.1 (los de beneficiario y proyecto autocompletan donde se pueda); adjuntar sustento desde la cámara.
- **Estados en tiempo real:** Solicitada → Aprobada → Programada → Pagada → Conciliada (con notificación push en cada cambio).

### 8.5 Seguridad y Salud (SST) — sub-rol Prevencionista
- **Charla de 5 minutos** diaria con registro de asistencia.
- **Reporte de observaciones de seguridad** (actos y condiciones inseguras).
- **Reporte de incidentes** con foto y descripción.
- Histórico consultable por jefatura.

### 8.6 Almacén y materiales (logística)
- Registro de **salidas** de herramientas/materiales hacia obra.
- **Devoluciones** al almacén al cierre del proyecto.
- Consulta del **inventario disponible** antes de solicitar compras.
- Etapa básica, ampliable.

### 8.7 Repositorio de documentos
- Acceso al expediente del proyecto desde el celular: planos, fichas técnicas, contratos, cotizaciones aprobadas.
- Carga rápida de documentos; organización por carpetas/etiquetas.

### 8.8 Notificaciones en la PWA
- **Push** cuando una solicitud cambia de estado, cuando hay aprobaciones pendientes o se acerca una fecha clave del proyecto.
- Bandeja de notificaciones y aprobaciones pendientes para quien corresponda.

### 8.9 Operación parcial sin conexión
- La PWA usa **almacenamiento local** para registrar RDO, evidencias y solicitudes **sin señal** en obra.
- Al recuperar conexión, **sincroniza automáticamente** todo lo capturado **en orden cronológico**.

---

## 7bis. CAJAS Y TESORERÍA (sin cuenta corriente)

Separa el dinero de la empresa del asignado a cada proyecto, conectándolos por trazabilidad de traslados. **No incluye conciliación bancaria ni módulo de cuenta corriente** (decisión de alcance).

### 7bis.1 Caja Central
- Refleja, a nivel informativo, los fondos centrales de la empresa.
- Registra los **traslados (asignaciones)** a cada caja chica de proyecto.
- Registra ingresos por cobranzas y egresos por pagos a proveedores/contratistas grandes.
- **Saldo en tiempo real** (vía vista de saldos, ver Anexo A.2). 

### 7bis.2 Caja Chica por Proyecto
Cada proyecto tiene su caja chica independiente, con monto máximo asignado.
- **Monto máximo** definido al crear el proyecto (parte del presupuesto operativo), configurable.
- **Modalidades:** crédito o contado, según la naturaleza del proyecto (alimenta la inicialización del Sección 5.7).
- **Saldo en tiempo real:** cada gasto descuenta, cada reposición aumenta.
- **Reposición:** cuando el saldo está bajo, el residente solicita reposición (es el **tipo 3** de solicitud de pago, Sección 5.0).
- **Cierre del proyecto:** la caja chica se liquida y cierra; el saldo remanente vuelve a caja central.

### 7bis.3 Alertas de caja
- Al consumirse el **80% del monto máximo** → alerta al residente (anticipar reposición).
- Caja chica **sin movimientos por más de X días** → alerta a la Administradora (revisar si el proyecto sigue activo).
- **Movimientos inusuales** (montos atípicos, categorías inusuales) → alerta a Gerencia (push, Sección 7.1).

---

## 8bis. ALMACÉN BÁSICO (stock por proyecto)

Versión básica en esta etapa, escalable a inventario completo después.

### 8bis.1 Incluido
- **Salidas hacia obra:** registro de herramientas y materiales que salen a cada proyecto.
- **Devoluciones al cierre:** herramientas regresan al almacén; consumibles se descuentan.
- **Consulta de inventario disponible** desde la PWA antes de solicitar compras.
- **Vínculo a partidas del APU:** cada salida se imputa a la partida que la consume.
- **Vínculo a órdenes de compra:** una compra que llega se registra como ingreso al almacén o entrega directa a obra.
- Nota de modelo: en movimientos de almacén, `proyecto_id` es **nullable** (ingresos al central sin proyecto) con **check constraint por tipo** (ingreso ⇒ sin proyecto; salida/devolución ⇒ con proyecto) — ver Anexo A.2.

### 8bis.2 Etapas posteriores
- Multi-almacén, stock mínimo y reabastecimiento automático, lotes/vencimientos, reservas anticipadas, códigos QR/barras.

---

## 9. FLUJOS TRANSVERSALES (end-to-end)

### 9.1 Del lead al proyecto
Origen del lead → cotización (Comercial, edición colaborativa, margen por partida) → estados → **Aceptada** → creación automática del proyecto (presupuesto sin margen) + carga del **cronograma de cobros (armadas)** → inicialización de la caja chica según modalidad (contado/adelanto).

### 9.2 De la necesidad de campo al pago
Residente crea **solicitud de pago** (PWA, uno de los 5 tipos) → Jefe de Proyectos **aprueba** → Administradora (Pamela) **programa y paga, carga voucher** → Gerencia **aprueba final** si supera el umbral → **envío por WhatsApp** del comprobante (sin Telegram/API) → solicitud **Conciliada**; el egreso se imputa a proyecto/categoría/partida e impacta la **caja**.

### 9.3 De la ejecución a la valorización y el cobro
Residente reporta **RDO + avance + fotos** (PWA) → consolidación automática → **valorización** (Jefe de Proyectos) → entrega al cliente (PDF) → cliente **paga/abona** → el abono impacta la **caja** (ingresos) → amortización de adelanto si corresponde → al cierre, **liquidación** con utilidad real.

### 9.4 Del control a la alerta
Caja + cronograma + presupuesto + valorización alimentan dashboards → si se rompe una regla (sobrecosto, sobretiempo, **gasto > pagos** [regla #1], **gasto real > valorizado** [regla #2], hito en riesgo, margen en riesgo) → **alerta en dashboard + push a Gerencia**.

---

## 10. OPTIMIZACIONES PROPUESTAS POR PROMPTIVE (dentro del alcance original)
Profesionalización del flujo conversado, sin alterar inversión, plazo ni stack. Cada una resuelve un dolor real:
1. **URL pública del comprobante** en vez del reenvío manual por WhatsApp (ahorra 30 min–1 h diaria a la Administradora).
2. **Margen por partida** (no bloque final): evita fricción comercial y permite márgenes diferenciados.
3. **Conversión automática cotización → proyecto:** cero error de transcripción Excel→Excel, trazabilidad lead→liquidación.
4. **Alertas tempranas de sobrecosto** (las dos reglas de salud): corregir desvíos durante la ejecución, no al final.
5. **Mantenimientos con cronograma autogenerado** y alertas categoría+fecha: cero servicios perdidos, ingreso recurrente.
6. **Curva S automática** en cada valorización: profesionaliza la entrega a clientes corporativos.
7. **Audit log completo** en cada acción crítica: trazabilidad legal y operativa (reemplaza las aprobaciones por chat).
8. **Recordatorios automáticos** (cotización por vencer, armada por facturar, servicio por atender): nada se pierde de vista.
9. **Reporte ejecutivo por correo los lunes 8am** a Gerencia (Sección 6.4).

---

## 11. COMUNICACIÓN (WhatsApp formateado, sin API ni Telegram)

- Todas las funciones "Enviar por WhatsApp" generan un **mensaje pre-formateado** + enlace público (`wa.me`). No hay envío automático ni API.
- Aplica a: comprobantes de pago, cotizaciones (enlace al PDF), informes/valorizaciones (enlace).
- El objetivo: que la **información viva en la plataforma** y WhatsApp sea solo el canal de reenvío puntual, no el repositorio.

---

## 12. CONSIDERACIONES TÉCNICAS (alto nivel; el modelo de datos lo define Claude Code)

- **Arquitectura:** monorepo Next.js 14 App Router con route groups `(auth)`, `(erp)` (sidebar — gerencia/admin/comercial) y `(pwa)` (bottom-nav — campo). Una sola base de código. *(Ver Anexo A.3 Bug #3: las route groups no afectan la URL; usar paths distintos.)*
- **Realtime:** Supabase Realtime para presencia, edición colaborativa en vivo de cotizaciones y actualización de estados/alertas.
- **Auth y permisos:** Supabase Auth + **RLS por rol** (segmentación del Sección 2 y Sección 11-Anexo). *(Ver Anexo A.3 Bug #1: usar admin client para lookups internos post-validación.)*
- **Storage:** 4 buckets (avatars, documentos, evidencias, vouchers), cada uno con su RLS (Anexo A.2). Borrado vía API REST de Storage, no SQL.
- **PWA:** instalable, push (Web-Push/VAPID), cámara, GPS, almacenamiento local para offline parcial con sincronización cronológica.
- **Exportables:** PDF (cotización, valorización, informe, comprobante) con `@react-pdf/renderer` (Helvetica, no Google Fonts — Anexo A.3 Bug #7) y Excel (presupuesto, reportes).
- **Fechas:** siempre `timeZone: 'America/Lima'` (Anexo A.3 Bug #2).

> **Pendiente para Claude Code:** definición del esquema de base de datos (tablas, relaciones, índices, políticas RLS) a partir del modelo conceptual del Sección 1, los flujos descritos y las pautas del Anexo A.2.

---

## 13. CONFIRMACIONES / SUPUESTOS A VALIDAR EN KICK-OFF
1. **Origen de los abonos del cliente:** registro manual en caja vs. cruce con valorizaciones/armadas cumplidas. *(definir el disparador exacto del ingreso)*
2. **Topes por categoría** y umbrales de las alertas de salud (#1 y #2).
3. **Umbral de monto** que obliga aprobación final de Gerencia.
4. **Plantillas y planes de cuentas** por línea (Cocina Pro existe; Azur Construcción y Mantenimiento se construyen).
5. **Frecuencias de recurrencia** estándar para mantenimiento (quincenal, mensual, etc.).
6. **Fórmula de valorización, % acumulado, saldo y amortización del adelanto** ya derivada y verificada con el archivo real (ver Anexo B, B.3 y B.9). Pendiente solo **confirmar con Juan** que el reparto del proyectado seguirá siendo proporcional por semana, ya que él mencionó que ese cálculo no lo había cerrado del todo.

---

# ANEXO B — Especificación celda por celda: Cotización y Gestión de Proyecto

> **Fuente:** archivos reales del cliente `COTIZACIÓN_MODELO.xlsx` y `GESTIÓN_DE_PROYECTO_MODELO.xlsx`, más las tres reuniones cronológicas (Reunión 1 = Gestión de Proyecto; Reunión 2 = automatización de estado/prioridad; Reunión 3 = ambos archivos). Este anexo es la **fuente de implementación** de los módulos Comercial (sección 3) y Gestión de Proyectos (sección 4). Las plantillas Excel son la **base obligatoria**; sobre ellas Promptive propone mejoras. Regla rectora del cliente (Juan): *"tiene que ser dinámico"*. Prioridad de Juan: **Proyectos y Finanzas primero**, pero Cotización + Gestión de Proyecto se cierran juntos porque el flujo está cableado desde la cotización.

## PARTE A — MÓDULO COTIZACIÓN

Base real: hoja `COTIZACIÓN - PROYECTO MODELO`. Ejemplo del cliente: proyecto "ADECCO_INSTALACIÓN DE VINILES Y LAMINADOS", razón social ADECCO PERU S.A., emitido por AZUR CONSTRUYE S.A.C.

### A.1 Cabecera de la cotización
Campos tal como en el Excel (filas 3-11), divididos en dos bloques visuales:
- **Datos del cliente:** PROYECTO (nombre + breve descripción), RAZÓN SOCIAL, RUC, UBICACIÓN, ASUNTO (ej. "construcción", "acondicionamiento de oficina", "instalación de viniles").
- **Datos de la empresa:** RAZÓN SOCIAL DE EMPRESA (AZUR CONSTRUYE S.A.C.), R.U.C. DE EMPRESA, FECHA, VIGENCIA (ej. "7 días calendarios").
- Los datos de empresa pueden vivir en una sección y los del cliente en otra (Juan lo deja a criterio de diseño).
- **Código de cotización autogenerado** (ver A.9): la celda dice "COTIZACIÓN - ####" → el correlativo lo pone el sistema.

### A.2 Estructura del presupuesto — árbol de hasta 4 niveles
El cuerpo es un **árbol jerárquico** (confirmado en reunión 1: "vamos a armar un árbol"):
- **Nivel 1 — Partida General** (ej. "1.0 PARTIDA GENERAL 1").
- **Nivel 2 — Sub Partida** (ej. "1.1 SUB PARTIDA 1").
- **Nivel 3 — Actividad** (ej. "1.1.1 Actividad 1").
- **Nivel 4 — Sub Actividad** (ej. "1.1.2.1 Sub Actividad 1").
- Máximo **4 niveles** (la experiencia del cliente no ha pasado de ahí). La numeración (1.0 / 1.1 / 1.1.1 / 1.1.2.1) se autogenera según el nivel.
- **Botones:** "Agregar partida", "Agregar sub-partida", "Agregar actividad", "Agregar sub-actividad", "Eliminar", "Mover/Reordenar".

### A.3 CUADRO DE COSTOS (lado izquierdo, columnas ITEM → TOTAL)
Columnas exactas: **ITEM · TÍTULO DE LA TAREA · UNIDAD · CANTIDAD · COSTO UNITARIO · SUBTOTAL · TOTAL.**

**Regla de cálculo por hojas (clave, reunión 3):** solo el **nivel más bajo de cada rama** captura UNIDAD, CANTIDAD y COSTO UNITARIO. Los niveles superiores se calculan por suma de sus hijos.
- Si una **actividad tiene sub-actividades**, esa actividad **NO** captura unidad/cantidad/C.U. → esos campos se **bloquean** (no editables) y su valor = suma de sus sub-actividades. Ej.: "Actividad 2" (1.1.2) = Sub Actividad 1 (70,000) + Sub Actividad 2 (35,000) = 105,000.
- Si una **actividad NO tiene hijos**, sí captura unidad/cantidad/C.U. → SUBTOTAL = cantidad × C.U. Ej.: "Actividad 1" (1.1.1): 30 m³ × 4,500 = 135,000.
- Si una **sub-partida no tiene actividades**, ella misma captura unidad/cantidad/C.U.
- **SUBTOTAL** = monto de la fila; **TOTAL** = rollup en la fila de Partida General (ej. PARTIDA GENERAL 1 = 940,000).
- **Comportamiento de software requerido:** *"limitar los cuadrantes que no se deben llenar para que no haya confusiones"* — los campos que no aplican se ven bloqueados/deshabilitados, no en blanco editable.

### A.4 CUADRO DE MARGEN (lado derecho, columnas paralelas)
Columnas exactas: **% MARGEN · COSTO UNITARIO CON MARGEN (PRECIO UNITARIO) · MARGEN · SUBTOTAL · TOTAL.**

- El usuario **solo llena la columna `% MARGEN`** (por fila del nivel más bajo). Todo lo demás se calcula automáticamente.
- **Fórmula confirmada por Juan:** `Precio Unitario = Costo Unitario / (1 − %margen)`. Ej.: C.U. 4,500 con margen 10% → 4,500 / 0.9 = 5,000.
- **MARGEN (monto)** = (Precio Unitario − Costo Unitario) × Cantidad. Ej.: (5,000 − 4,500) × 30 = 15,000.
- **SUBTOTAL con margen** = Precio Unitario × Cantidad (ej. 5,000 × 30 = 150,000).
- **El margen es por partida/celda**, distinto por fila (en el ejemplo real van 10%, 12%, 14%, 15%, 16%, 21%, 22%, 23%, 24%, 32%, 34%). No es un bloque global.
- **Regla de no-edición en niveles superiores:** igual que en costos, a las partidas/sub-partidas que se calculan por suma de hijos **no se les pone margen manual**; el margen sube por agregación. Solo el último nivel del ítem lleva % margen.
- **MARGEN SUBTOTAL** (fila 42): suma de todos los márgenes (ej. 610,799.30). Da a AZUR, internamente, *"cuánto se está marginando"* sin impuestos.

### A.5 Bloque de totales (parte inferior del cuadro de margen)
Secuencia exacta (filas 42-51), todos calculados:
- **SUBTOTAL** (con margen) = 3,354,299.30.
- **GASTOS GENERALES** (% configurable, ej. 5%) = 167,714.96.
- **GASTOS ADMINISTRATIVOS** (% configurable, ej. 5%).
- **UTILIDAD** (% configurable, ej. 5%).
- **COSTO DIRECTO** (subtotal + GG + GA + utilidad) = 3,857,444.19.
- **I.G.V.** (18%) = 694,339.95.
- **TOTAL** = 4,551,784.15.
- **DESCUENTO COMERCIAL** (% activable, ver A.6) = 227,589.21.
- **TOTAL CON DESCUENTO** = 4,324,194.94.

**Campos dinámicos opcionales (reunión 3):** GASTOS GENERALES, GASTOS ADMINISTRATIVOS y UTILIDAD **deben poder ocultarse** por cliente (algunos no quieren ver utilidad ni gastos generales, aunque se cobren igual dentro del precio). El IGV también es dinámico: hay clientes corporativos que lo quieren "por fuera" (mostrar **COSTO DIRECTO** sin IGV) y personas naturales que lo quieren con todo impuesto. → toggles de visibilidad por concepto.

### A.6 Descuento comercial (activable y estratégico)
- **NO** aparece por defecto en la cotización enviada. *"Estratégicamente no conviene que el cliente vea que hay opción de descuento."*
- Se activa **solo cuando el cliente pide descuento**, vía botón ("Agregar descuento comercial").
- Se define como **porcentaje** sobre el total; genera **TOTAL CON DESCUENTO**.
- **Al cerrar el trato, el área comercial actualiza la propuesta antes de aprobarla para que el descuento se diluya dentro de las partidas anteriores** (no quede como línea suelta). Esto mantiene la proporción para las valorizaciones posteriores.

### A.7 Plazo, forma de pago y adelanto (dinámicos)
- **Plazo de ejecución:** un campo numérico ("20", "30") + **lista desplegable "días calendario / días útiles"** (retail suele ser calendario con fines de semana; construcción suele ser días útiles).
- **Forma de pago (filas 56-58):** por defecto "Pago de adelanto" (ej. 20%) + "Valorizaciones semanales" (ej. 80%). Debe ser **dinámico**: botón para **agregar filas de pago** (4 pagos, 3 pagos, pago único contra entrega, etc.) y **modificar los porcentajes**, con **validación de que la suma no supere el 100%** del presupuesto aprobado.

### A.8 Condiciones, plantillas, garantía y medios de pago
- **CONDICIONES** (filas 60-78): bloques de texto — "Condiciones de plantilla", "Servicios incluidos", "Servicios omitidos", "Garantía".
- **Plantillas de cotización (flujo confirmado, reunión 3):**
  - Al iniciar una cotización, el usuario **primero elige una plantilla** (o "página en blanco").
  - Al elegir plantilla, las condiciones aparecen **ya escritas por defecto** (no como lista desplegable que haya que seleccionar una por una), pero **editables** en el momento sin alterar la plantilla maestra.
  - Las plantillas las arma AZUR con el tiempo; **para el primer avance existe un solo modelo** y los campos de condiciones van **en blanco** (AZUR los llena).
  - **Garantía:** cuadrante **opcional** (se incluye o no).
- **Medios de pago:** múltiples cuentas con logo del banco (Interbank, BBVA, Banco de la Nación). Incluye **cuenta en soles, cuenta en dólares** (falta en el modelo, se agrega) y **cuenta de detracción** (Banco de la Nación). Mostrar logos de bancos para presentación profesional.

### A.9 Emisión: qué se extrae para el cliente y nombre de archivo
- **Extracción para el cliente:** al "Emitir cotización", el PDF jala **solo**: ITEM, TÍTULO, UNIDAD, CANTIDAD, **PRECIO UNITARIO (costo con margen)**, SUBTOTAL y TOTAL del cuadro de margen, más el bloque de totales (subtotal, GG/GA/utilidad si no están ocultos, IGV si aplica, total / total con descuento). **Nunca** se muestran el cuadro de costos, el % de margen ni el margen bruto. En la matriz interna todo se ve limpio; la extracción es automática.
- **Numeración correlativa automática** de la cotización.
- **Nombre de archivo estandarizado al descargar** (PDF o Excel): estructura fija tipo **`COTIZACIÓN - [Nombre del proyecto] - [Código correlativo] - [Marca/razón social, ej. AZUR]`**, para que todo el equipo descargue con el mismo formato y el cliente identifique de quién viene. El sistema arma el nombre jalando esos datos; el comercial no lo renombra a mano.

### A.10 Estados de la cotización
Cuadro de control de estados (reunión 3): **Borrador → Enviada → En negociación / En proceso → Aprobada → Rechazada.** El descuento comercial solo se activa en la etapa de negociación. Al **Aprobar**, el presupuesto pasa a Gestión de Proyecto **sin margen** (ver Parte B).

---

## PARTE B — MÓDULO GESTIÓN DE PROYECTO (Last Planner)

Base real: hoja `LAST PLANNER - PROYECTO MODELO` + hoja `LÓGICA ESTADO DE TAREA Y PRIORIDAD`. La pantalla se organiza en **cuatro cuadrantes** que la jefa de proyectos (Pamela) llena/opera de izquierda a derecha y luego de derecha a izquierda.

### B.0 Cabecera del proyecto
Campos (filas 3-9): NOMBRE DEL PROYECTO, DIRECCIÓN DEL PROYECTO, JEFE DE PROYECTO, **RESIDENTE/COORDINADOR 1 y 2** (puede haber varios), NOMBRE DEL CLIENTE, FECHA. Se agregarán más (RUC/razón social de la empresa o de la persona, etc.).

### B.1 Cuadrante 1 — Presupuesto / itemizado (ITEM → TOTAL)
Mismo árbol de 4 niveles y mismas columnas que el cuadro de costos de la cotización (ITEM, TÍTULO, UNIDAD, CANTIDAD, COSTO UNITARIO, SUBTOTAL, TOTAL).

**Relación con Comercial (el punto más debatido, reunión 1) — debe ser DINÁMICO:**
- Al aprobarse la cotización, el presupuesto llega a Proyectos **sin margen** (solo costo).
- **Caso A — el itemizado comercial sirve tal cual** (típico en remodelación/acondicionamiento de oficinas: partidas como pintura, luminarias, pisos por m²). Proyectos lo recibe y **no lo mueve** (a lo sumo ajustes menores).
- **Caso B — el itemizado comercial NO calza con la obra** (típico en construcción): Proyectos debe poder **cargar su propia estructura/itemizado independiente**, con partidas distintas a las comerciales.
- **En ambos casos el sistema compara contra el presupuesto comercial:**
  - **Mejor caso:** comparación por **categorías** (obras preliminares, estructuras, arquitectura, etc.).
  - **Peor caso:** comparación al menos por **total** (presupuesto comercial proyectado = **tope**; presupuesto real de proyectos = lo que se va armando).
- **Edición dinámica (antes y durante la ejecución):**
  - **En planeación:** Proyectos revisa el presupuesto base; puede **agregar, quitar o cambiar descripción** de ítems. Caso real: presupuestos olvidó una partida → como ya se cerró con el cliente, se agrega con **presupuesto cero pero con costo real** (queda en desfase, se sustenta comercialmente aparte).
  - **Durante la ejecución:** si aparece una actividad no contemplada, Proyectos **agrega una fila** para mapearla y darle seguimiento.
  - En **construcción** estos cambios son **mayores** (cambio de itemizado obligatorio); en **remodelación** son **menores**. El sistema permite ambos.
- **Recepción del presupuesto resumido (reunión 1):** a veces presupuestos entrega solo un total por categoría (ej. obras preliminares = 1,360,000, "cantidad 1 / global"); Proyectos lo **desagrega** y decide cómo partirlo. → soportar entrada tanto detallada como por monto global por categoría.

### B.2 Cuadrante 2 — Programación (contratista, fechas, duración)
Columnas: **CONTRATISTA RESPONSABLE · FECHA DE INICIO · FECHA DE ENTREGA · DURACIÓN.**
- **Contratista por categoría/partida:** asignación del responsable. Debe ser **lista desplegable de proveedores/contratistas pre-registrados** (y opción de registrar si no existe). Apartado editable y **centralizado** (relación categoría↔contratista) para que no se manipule el documento directamente: si cambia el responsable, se edita en el apartado y recarga.
- **Razón de ser del contratista registrado:** se **cruza con Finanzas** — *cuánto se le ha pagado al proveedor (Finanzas) vs. cuánto ha avanzado en campo (Proyectos)*. Match proveedor ↔ avance ↔ pago.
- **UNIDAD** y otras columnas con valores estándar → **listas desplegables** (unidades de medida: m², m³, toneladas, unidad, etc.).
- **DURACIÓN:** se calcula o ingresa; combinada con FECHA DE INICIO define el proyectado por semana (ver B.5).

### B.3 Cuadrante 3 — Valorizaciones semanales acumulables (de derecha a izquierda)
Estructura real: columnas **VALORIZACIÓN N1 (SEMANA 1) · VALORIZACIÓN N2 (SEMANA 2) · VALORIZACIÓN N3 (SEMANA 3)…**, cada una con sub-columnas **`% avance`** y **`Total`**.
- **Botón "Iniciar/Agregar valorización":** crea **dos columnas nuevas** (% avance + Total) para la siguiente semana. Las valorizaciones se **acumulan** semana a semana.
- El usuario solo ingresa el **`% avance` de la semana** en el **nivel más bajo** del ítem; el sistema **arrastra hacia arriba** la valorización de actividad → sub-partida → partida general (igual que el cálculo de la cotización). No se llenan los niveles agregados.

**Fórmulas exactas (verificadas contra el archivo real `GESTIÓN_DE_PROYECTO_MODELO.xlsx`).** Para una partida de nivel hoja con monto `TOTAL_PARTIDA` y semanas `s = 1..n`, donde `pct_s` = % de avance ingresado esa semana:
- **Total de la valorización de la semana s** = `pct_s × TOTAL_PARTIDA`.
  - Verificación: SUB PARTIDA 1, TOTAL_PARTIDA = 240,000; semanas 0.25 / 0.25 / 0.50 → totales 60,000 / 60,000 / 120,000. ✔ Coincide con el Excel.
- **% ACUMULADO DE TAREA** = `Σ pct_s` (suma de los % de todas las semanas valorizadas de esa fila).
  - Verificación: Sub Actividad 2 → 0.25 + 0.10 + 0.20 = 0.55. ✔ Coincide con el Excel.
- **Valorización acumulada (monto)** = `% acumulado × TOTAL_PARTIDA` = `Σ (Total de cada semana)`.
- **SALDO de la partida** = `TOTAL_PARTIDA × (1 − % acumulado)` = lo que falta por valorizar.
  - Verificación: SUB PARTIDA 1 al 100% → saldo 0. Sub Actividad 2 al 55% (35,000) → saldo 15,750. ✔
- **Rollup hacia arriba:** el `% avance`, el `% acumulado` y el `Total` de cada nivel agregado (actividad → sub-partida → partida general) se calculan **ponderados por monto** de sus hijos, no como promedio simple:
  - `% acumulado(padre) = Σ (TOTAL_hijo × %acum_hijo) / Σ TOTAL_hijo`.
  - `Total_valorizado(padre, semana s) = Σ Total_valorizado(hijo, s)`.
- Al inicio (semana 0), antes de empezar la obra: `% acumulado = 0`, `SALDO = TOTAL_PARTIDA` (100% pendiente), sin criticidad.
- **Validación:** el `% acumulado` de una fila nunca debe exceder `1.0` (100%); si la suma de semanas lo supera, se bloquea el ingreso y se alerta. El saldo nunca es negativo.

> Nota de calidad de datos: en el archivo modelo, la columna `SALDO` y algunos ITEM aparecen con valores incoherentes (celdas escritas a mano, ítems mostrados como fechas tipo "1900-01-02"). Eso es **ruido del Excel manual**, no una lógica alternativa. La lógica válida es la de las fórmulas de arriba, ya verificadas con las filas correctas del propio archivo.

### B.4 Cuadrante 4 — Estado de tarea y prioridad (AUTOMÁTICOS)
Columnas: **ESTADO DE TAREA · PRIORIDAD.** En la reunión 2 el equipo de Proyectos decidió que **NO sean de ingreso manual** (insostenible operativamente) sino **automáticos por lógica condicional**, comparando lo **proyectado** vs. lo **real** (ver B.5).

**Valores de ESTADO DE TAREA:**
- **Completado** — % acumulado = 100%.
- **En progreso** — avanzó algún % entre una valorización y la siguiente.
- **Detenido** — el % no avanzó de una valorización a la siguiente.
- **En espera** — la actividad aún no llega a su fecha de inicio (fecha futura).
- **Pendiente** — no tiene fecha de inicio asignada.
- **Retrasado** — venció el plazo y no se completó.
- **Cancelado** — estado manual disponible.

**Valores de PRIORIDAD:** Muy Baja · Baja · Media · Alta · Muy Alta.

### B.5 LÓGICA DE AUTOMATIZACIÓN (hoja "LÓGICA ESTADO DE TAREA Y PRIORIDAD")
Ejemplo del cliente: inicio 15/06, entrega 20/07, duración 30 días = **5 semanas**.

**1) Proyectado (reparto proporcional):** el avance esperado se reparte **proporcionalmente** entre las semanas de duración. Para 5 semanas: Semana1=20%, Semana2=40%, Semana3=60%, Semana4=80%, Semana5=100% (acumulado). Confirmado: por ahora **siempre proporcional** (no hay lógica de reparto por curva más compleja todavía).

**2) Real:** el % acumulado que efectivamente registra la valorización cada semana (ej. 0.3, 0.4, 0.4, 0.4, 0.9, 1.0).

**3) Cálculo de PRIORIDAD (alerta), comparando real vs. proyectado de la semana:**
- Se evalúa qué tan lejos está el avance real del proyectado de esa semana.
- Regla base de Juan: **si está por debajo del 50% de lo proyectado → prioridad muy alta**; **por encima del 50% por debajo del objetivo → alta**; cuando se cumple/supera lo proyectado → **baja o muy baja** (muy baja si supera con holgura); **al 100% según lo planeado → media**.
- Tabla del ejemplo (real vs proyectado por semana): MUY BAJA, MUY BAJA, MEDIA, ALTA, MUY ALTA, ALTA, MEDIA.
- **Mejora propuesta por Promptive (aceptada para afinarse en avances):** no usar un solo umbral del 50%, sino **umbrales configurables** (ej. si proyectado=20% y real=5%, que un umbral del 60% por debajo dispare un nivel distinto). Se parametriza por rangos.

**4) Cálculo de ESTADO DE TAREA (condicional, "como un Excel"):**
- 100% acumulado → **Completado**.
- % no varió entre valorizaciones → **Detenido**.
- % varió (aunque sea mínimo) → **En progreso**.
- Fecha de inicio aún no llega → **En espera**.
- Sin fecha de inicio → **Pendiente**.
- Plazo vencido sin completar → **Retrasado**.

> Implementación: estado y prioridad se recalculan automáticamente en cada valorización y en cada cambio de fecha. **Cancelado** y un override manual quedan disponibles para casos especiales (lista desplegable que puede forzar el estado).

### B.6 Dashboard y alertas de Proyectos
De los cuadrantes 3 y 4 (registro semanal) el sistema alimenta un **dashboard compartido** por varias personas:
- **Alerta por plazo + avance:** si la fecha de entrega ya pasó y el % acumulado < 100% → *"estás retrasado, has volado en tiempos"*. Ejemplo de Juan: vence 31/05, hoy es posterior y está al 70% → alerta.
- **Alerta por avance vs. proyectado semanal:** partidas que no llegan al % acumulado que les corresponde por semana.
- **Bandeja / lista priorizada:** al usuario (Pamela) le llega a su bandeja o al dashboard la **lista de actividades con prioridad muy alta/alta** y la **lista de las que ya vencieron** (fuera de fecha).
- El reporte cruza **% de avance vs. fecha de entrega** (ej. superaron el 100% del plazo pero están a avance medio).

### B.7 Reporte al cliente (selección de columnas)
- El reporte para el cliente toma **solo ciertas columnas**, no todas: **oculta** prioridad, estado, duración, fecha de inicio y nombre del contratista. Muestra avance por categoría de forma simple.
- Sale con **resumen por categoría** (obras preliminares, estructuras, arquitectura, etc.).

### B.8 Dos dashboards: cliente vs. interno (viabilidad y alcance)
Juan pidió un **dashboard para el cliente** (link/acceso para ver avance en tiempo real + descargar valorizaciones e informe fotográfico) y otro **interno** (equipo/gerencia).
- **Decisión técnica (Promptive):** un **link abierto NO** — abre un hueco de seguridad al ERP. Lo profesional es un **apartado para el cliente con usuario y autenticación**, mostrando **solo Data puntual de su proyecto** (resumen gráfico de avance por categoría + descarga de valorizaciones e informe fotográfico, con tiempo de carencia para descargar al cierre).
- **Alcance:** este apartado-cliente **NO está dentro del alcance actual**; queda **mapeado para una etapa posterior** (primero debe funcionar el del equipo). Suma como marca (transparencia, fidelización, espacio para promociones) y técnicamente solo jala Data existente + diseño aparte. **Considerar el consumo de usuarios** (capa gratuita): solo se daría acceso a proyectos largos (≥6 meses); los proyectos cortos (retail/oficinas de 1–2 meses) no usan acceso-cliente.
- **Lo que SÍ entra ahora:** descarga del informe y de las valorizaciones desde el dashboard interno (módulo de reportería incluido).

### B.9 Valorización con dilución del adelanto (cobro al cliente)
Mecánica confirmada (reunión 1 y 3) y **fórmula verificada con el ejemplo del cliente**:
- El presupuesto aprobado tiene un **CONTRATO_TOTAL** (en el modelo 2,743,500 + GG/GA/utilidad/IGV).
- AZUR recibe un **adelanto** = `%adelanto × CONTRATO_TOTAL` (ej. 20%).
- En cada valorización semanal, el adelanto **se amortiza con el mismo %adelanto aplicado sobre el monto valorizado de esa semana**:
  - **Amortización de la semana** = `%adelanto × Valorización_de_la_semana`.
  - **Cobro neto al cliente (semana)** = `Valorización_de_la_semana − Amortización_de_la_semana` = `Valorización_de_la_semana × (1 − %adelanto)`.
  - **Saldo del adelanto** = `Adelanto_inicial − Σ Amortizaciones`. Se agota cuando se ha valorizado el 100% del contrato.
- **Verificación con el ejemplo de Juan:** valorización de la semana = 821,250; %adelanto = 20% → amortización = `0.20 × 821,250 = 164,250`; cobro neto = `821,250 − 164,250 = 657,000`. ✔ Coincide con lo que indicó Juan (657,000).
- **Confirmado por Promptive:** los pagos de valorizaciones van directo a la **caja del proyecto**; el adelanto registrado se va restando con cada valorización pagada (se diluye), exactamente como lo describe Juan. El sistema lleva el **saldo del adelanto** visible hasta que llega a cero.

### B.10 Resumen ejecutivo de valorización (entregable al cliente)
Cada valorización genera, además del detalle, un **resumen ejecutivo** que el cliente recibe, con: **monto del contrato, valorización del periodo, adelanto (y su dilución) y saldo**. Puede ir por categorías o solo el total valorizado. Se extrae del reporte (PDF/Excel) jalando los cuadrantes de partidas + el resumen, listo para enviar.

---

## PARTE C — CONSIDERACIONES TRANSVERSALES Y MEJORAS PROPUESTAS

### C.1 Modularización (cliente vs. una sola vista)
- El Excel del cliente mezcla todo en una sola matriz horizontal (porque vienen de Excel). Para el **primer avance se respeta esa vista integrada** (como la ven hoy → menor fricción, exportación integrada).
- **Mejora propuesta (Promptive):** dividir en **módulos/secciones** para mejor seguimiento y experiencia; se evalúa tras el primer avance. La división solo cambia márgenes/layout, no la lógica.

### C.2 Edición dinámica sin romper el flujo (deuda técnica a cuidar)
- El flujo está **"cableado" desde la cotización hasta el proyecto** (los encabezados conectan ambos). Cada cambio estructural en cotización puede romper proyecto. → **se consolidan ambos núcleos juntos** antes de avanzar con lo demás (Finanzas/Almacén/Comercial pleno).
- Hacer el documento editable en varias etapas del proceso es riesgoso (al reescribir Data se reescribe todo). **Mitigación propuesta:** Proyectos maneja una **propuesta separada editable** que luego se **contrasta** con la de Presupuestos/Cotización, en vez de editar la misma fuente.
- Una vez presentado el primer avance, **las ediciones futuras se hacen sobre la plataforma**, no sobre el Excel.

### C.3 Datos sembrados y catálogos (arranque)
- Para el primer avance se trabaja con **Data sembrada/ficticia** (la plataforma "viva") y luego se limpia; AZUR llenará sus datos reales una vez.
- **Catálogo de servicios/ítems con código correlativo:** módulo agregable; cada servicio con código, descripción y unidad de medida; el correlativo corre conforme AZUR agrega servicios. (AZUR lo irá poblando; no es prioridad inmediata.)
- **Lista de proveedores/contratistas:** se siembra; es dinámica y crece en el tiempo; debe estar bien registrada porque Finanzas se cruza con ella.
- **Almacén:** no es prioridad ahora (Juan: primero Proyectos y Finanzas).

### C.4 Prioridad del cliente y plan de entrega
- Orden de prioridad de Juan: **Proyectos y Finanzas primero**; Comercial puede esperar un poco (aunque lógicamente Comercial alimenta a Proyectos).
- Hay **gestión del cambio** de por medio (vienen de años de Excel); se asume curva de aprendizaje y capacitación al equipo técnico en paralelo.

---

## PARTE D — CHECKLIST DE FUNCIONES (resumen accionable para Claude Code)

**Cotización**
- [ ] Cabecera dual (cliente / empresa) con código autogenerado.
- [ ] Árbol de 4 niveles con numeración automática y botones agregar/eliminar/reordenar.
- [ ] Cuadro de costos con bloqueo de niveles superiores (solo el nivel hoja captura unidad/cantidad/C.U.).
- [ ] Cuadro de margen: solo `% margen` editable por hoja; P.U. = C.U./(1−margen); rollup de margen hacia arriba.
- [ ] Bloque de totales con GG/GA/utilidad/IGV ocultables; costo directo; total; total con descuento.
- [ ] Descuento comercial activable por botón, no visible por defecto, diluible en partidas al aprobar.
- [ ] Plazo con dropdown días útiles/calendario; formas de pago dinámicas con validación ≤100%.
- [ ] Plantillas de condiciones (precargan texto editable); garantía opcional; medios de pago multi-banco (soles/dólares/detracción) con logos.
- [ ] Emisión: extrae solo columnas-cliente; numeración correlativa; nombre de archivo estandarizado.
- [ ] Estados: borrador/enviada/negociación/aprobada/rechazada; al aprobar pasa a Proyecto sin margen.

**Gestión de Proyecto**
- [ ] Cabecera con jefe, residentes (varios), cliente.
- [ ] Cuadrante 1: itemizado heredado o estructura propia; comparación por categoría/total vs. tope comercial; edición en planeación y ejecución; partida con presupuesto cero / costo real.
- [ ] Cuadrante 2: contratista por categoría (dropdown pre-registrado + centralizado); fechas y duración; cruce proveedor↔pago (Finanzas).
- [ ] Cuadrante 3: valorizaciones acumulables (botón agrega 2 columnas/semana); ingreso solo en hoja; arrastre hacia arriba; % acumulado y saldo.
- [ ] Cuadrante 4: estado y prioridad AUTOMÁTICOS por lógica condicional proyectado vs. real (umbrales configurables); override manual + Cancelado.
- [ ] Dashboard interno con alertas de plazo vencido y avance bajo; bandeja priorizada.
- [ ] Reporte al cliente con selección de columnas y resumen por categoría.
- [ ] Valorización con dilución de adelanto → caja del proyecto.
- [ ] Resumen ejecutivo de valorización (contrato/valorización/adelanto/saldo).
- [ ] (Posterior) Dashboard-cliente con autenticación, solo lectura de su proyecto.

---

# ANEXO A — Knowledge Base del primer proyecto (lecciones, bugs y patrones verificados en producción)

> **Para Claude Code:** este anexo recoge decisiones, bugs y patrones ya validados en producción en un ERP+PWA equivalente. **Léelo antes de implementar.** No son recomendaciones teóricas: cada punto costó horas de debugging real. Reutilizar estos patrones ahorra esos errores.

## A.1 Stack probado en producción

```
Next.js 14 (App Router) + Route Groups
├── (auth) → login, recovery
├── (erp) → sidebar layout — gerencia/admin/comercial
└── (pwa) → bottom-nav layout — residente/campo

Supabase
├── PostgreSQL + RLS por rol
├── Auth (email + password)
├── Storage (buckets por tipo)
└── Realtime (disponible)

Vercel deploy con CI/CD desde GitHub
Tailwind + shadcn/ui + framer-motion
React-PDF para documentos (NO Google Fonts en serverless — usa Helvetica built-in)
Web-Push (VAPID) para notificaciones
```

## A.2 Decisiones de modelo que funcionaron (guía, no esquema cerrado)

Estas decisiones de modelo ya demostraron pagar; conviene reusarlas. El esquema final lo define Claude Code, pero con estas pautas:

- **Auditoría con `audit_log` (`old_data` / `new_data` en JSONB):** permite reconstruir cambios sin joins. Es la base del "historial de cambios" de cotizaciones (Sección 3.3) y de la auditoría de pagos (Sección 5.2).
- **Trigger de auditoría genérico** (una función tipo `fn_audit_trigger()` aplicada por tabla) en lugar de un trigger por tabla: DRY, no se duplica lógica.
- **Cajas separadas (central + chicas) con una vista de saldos** (p. ej. `v_cajas_saldos`): da saldo en tiempo real sin tablas materializadas. Encaja con la caja del Sección 5.4.
- **`proyecto_id` NULLABLE en movimientos de almacén:** para ingresos al almacén central que no van a un proyecto.
- **Check constraint por tipo de movimiento:** `ingreso ⇒ proyecto_id null`; `salida/devolución ⇒ proyecto_id requerido`.
- **Storage en 4 buckets** (avatars, documentos, evidencias, vouchers), **cada uno con su RLS de acceso**.
- **Visibilidad de documentos en 3 niveles** (`publica` / `mando` / `gerencia`) con RLS estricto.
- **Workflow de estados como enum SQL** (`borrador` / `enviada` / `aprobada` / …) con transiciones validadas — aplica a estados de cotización (Sección 3.4) y de solicitud de pago (Sección 5.1).
- **Sembrar ~6 usuarios dev** (uno por rol) para QA rápido sin crear cuentas a mano.

## A.3 Bugs críticos resueltos (NO repetir)

### Bug #1 — Push no llegaba: RLS bloqueaba el SELECT post-UPDATE silenciosamente
**Síntoma:** suscripciones guardadas, `/api/push/test` OK, pero las aprobaciones reales no disparaban push.
**Causa raíz:** entre un `update()` y un `select()` separados con el cliente del usuario, PostgREST aplica RLS dos veces; por interacción con el connection pool de Supabase algunos contextos pierden `auth.uid()` justo después del UPDATE → el SELECT devuelve cero filas → `data = null` **sin error** (PostgREST devuelve "row not found", no error). El `if (sol?.solicitado_por)` se saltaba y `notifyUser` nunca corría.
**Solución:** para lookups internos dentro de un server action **donde ya validaste el rol**, usa `createAdminClient()` (service_role) → bypass RLS, sin sorpresas.

```ts
// ❌ MAL — RLS puede devolver null silenciosamente
const { data: sol } = await supabase
 .from('solicitudes_pago').select('solicitado_por').eq('id', id).single();

// ✅ BIEN — admin client para lookups post-validación
const admin = createAdminClient();
const { data: sol } = await admin
 .from('solicitudes_pago').select('solicitado_por').eq('id', id).single();
```

### Bug #2 — Timezone Vercel UTC vs. Lima (desfase de 5 horas)
**Síntoma:** check-ins de la mañana aparecían como tarde.
**Causa:** Vercel corre en UTC; `toLocaleString('es-PE')` sin `timeZone` usa el TZ del sistema → UTC.
**Solución:** SIEMPRE pasar `timeZone: 'America/Lima'` en los formatters de fecha. Centralizar en un helper.

```ts
// lib/format.ts
export const TZ = 'America/Lima';
export const fmtDateTime = (d: Date | string) =>
 new Date(d).toLocaleString('es-PE', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' });
// ⚠️ NumberFormatOptions NO acepta timeZone — al formatear Number, omítelo (rompe TS).
```

### Bug #3 — Route Groups con paths duplicados
**Síntoma:** build error con `(erp)/almacen` y `(pwa)/almacen` (ambos mapean a `/almacen`).
**Causa:** los Route Groups de Next.js **no afectan la URL**.
**Solución:** URLs distintas por layout (ej. `/inventario` en ERP y `/almacen` en PWA); el label del menú puede decir lo mismo.

### Bug #4 — Server Actions con FormData y null
**Síntoma:** Zod fallaba en campos opcionales porque `formData.get('campo')` devuelve `null` si no existe.
**Solución:** helpers Zod con `preprocess` en `lib/zod-helpers.ts`.

```ts
export const optionalString = () =>
 z.preprocess(v => (v === '' || v == null ? undefined : v), z.string().optional());
export const optionalUuid = () =>
 z.preprocess(v => (v === '' || v == null ? undefined : v), z.string().uuid().optional());
export const optionalNumber = () =>
 z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().optional());
```

### Bug #5 — Event handlers en Server Components
**Síntoma:** "Event handlers cannot be passed to Client Component props".
**Solución:** todo `<select onChange>`, `<input onClick>`, etc. va en un Client Component con `'use client'` (patrón `rol-select.tsx`, `metrado-input.tsx`).

### Bug #6 — `CREATE OR REPLACE VIEW`
**Síntoma:** "cannot change name of view column" al modificar una vista.
**Solución:** `DROP VIEW IF EXISTS X CASCADE; CREATE VIEW X AS …` cuando cambian orden o nombres de columnas.

### Bug #7 — PDF con `@react-pdf/renderer`
- ❌ Google Fonts en serverless (fallan random) → ✅ usar **Helvetica built-in**.
- ❌ `[style1, condition && style2]` rompe TS (`false` no es Style) → ✅ `[style1, ...(condition ? [style2] : [])]`.
- ❌ Logo de color sobre fondo del mismo color en portada (no se ve) → ✅ logo sobre fondo blanco; el branding va en las zonas de color.

## A.4 Push Notifications — receta completa (setup que funciona al primer intento)

Orden exacto para que push funcione sin perder horas:

**1) Generar VAPID keys (una sola vez):** `npx web-push generate-vapid-keys`

**2) Env vars (Vercel + `.env.local`):**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." # pública, va al cliente
VAPID_PRIVATE_KEY="..." # PRIVADA, solo server
VAPID_SUBJECT="mailto:tu@empresa.com"
```
> ⚠️ Pegar las keys **sin espacios en blanco** en Vercel; un espacio causa "VAPID keys no configuradas" silencioso.

**3) Tabla `push_subscriptions`** con `endpoint` **UNIQUE** (evita duplicados), RLS `user_id = auth.uid()`, índice por `user_id`, columnas `p256dh`, `auth`, `user_agent`, `last_used_at`.

**4) Tabla `push_log` (NO opcional):** `source`, `target_user_id`, `title`, `status` (`attempt`/`ok`/`error`), `detail`, `created_at`. Sin este log, debuggear push es imposible.

**5) Service Worker `public/sw-push.js`:** handler `push` (muestra notificación con `title`, `body`, `icon`, `tag`, `data.url`) y handler `notificationclick` (enfoca ventana existente o abre `openWindow(url)`).

**6) `next-pwa`** carga `sw-push.js` automáticamente si está en `public/`.

**7) Endpoint `/api/push/subscribe`** (`runtime = 'nodejs'`): valida sesión, valida con Zod, `upsert` con **`onConflict: 'endpoint'`**. `DELETE` para desuscribir por endpoint.

**8) Helper `sendPushToUser` (`lib/push/server.ts`):** lee subs con **admin client**, envía con `web-push`, **actualiza `last_used_at` al éxito** (sirve de diagnóstico) y **elimina suscripciones que devuelven 404/410** (FCM las caduca).

```ts
await Promise.all(subs.map(async (s) => {
 try {
 await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
 await admin.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', s.id);
 } catch (err) {
 const e = err as { statusCode?: number };
 if (e.statusCode === 404 || e.statusCode === 410)
 await admin.from('push_subscriptions').delete().eq('id', s.id);
 }
}));
```

**9) Wrappers `lib/push/notify.ts`:** `notifyUser(userId, payload)` y `notifyRoles(roles, payload)`. **Fire-and-forget pero nunca lanzan** (envuelven todo en try/catch y loguean a `push_log` en cada `attempt`/`ok`/`error`).

**10) Endpoints de diagnóstico desde el día 1:** `/api/push/test` (push de prueba al usuario logueado) y `/api/push/diag` (reporta VAPID env, n.º de suscripciones, prueba de envío con error detallado).

## A.5 Patrón ganador para server actions con notificación

Para CUALQUIER server action que cambie estado y deba notificar:

```ts
// 1) Validar permisos
const session = await requireSession();
if (!ROLES_PERMITIDOS.includes(session.rol)) return { ok: false, error: 'Sin permisos' };

// 2) Validar input
const parsed = schema.safeParse(input);
if (!parsed.success) return { ok: false, error: '...' };

// 3) Mutación con cliente normal (respeta RLS)
const supabase = createClient();
const { error } = await supabase.from('tabla').update(patch).eq('id', parsed.data.id);
if (error) throw new Error(error.message);

// 4) 🔑 Lookup para notificación con ADMIN client (bypass RLS — Bug #1)
const admin = createAdminClient();
const { data: target } = await admin
 .from('tabla').select('user_id_a_notificar, datos_payload').eq('id', parsed.data.id).single();

// 5) Push: await (no fire-and-forget puro) ANTES de cualquier redirect()
if (target?.user_id_a_notificar) {
 await notifyUser(target.user_id_a_notificar, {
 title: '...', body: '...', url: `/ruta/${parsed.data.id}`, tag: `tabla-${parsed.data.id}`,
 });
}

// 6) Revalidar
revalidatePath('/...');
```

## A.6 Reglas para NO romper push otra vez (checklist)

- **Siempre `createAdminClient()`** para lookups internos en server actions → evita el bug RLS post-UPDATE silencioso.
- **Notificar ANTES de `redirect()`** → `redirect()` lanza `NEXT_REDIRECT`; el código posterior no corre.
- **`await notifyUser`**, no fire-and-forget puro → Vercel mata el contenedor al enviar la response; si no esperas, la push se pierde.
- **Log a `push_log` en cada `attempt`** → sin esto, debuggear push es imposible.
- **Marcar `last_used_at` al éxito** → permite verificar desde fuera si la push salió, sin leer logs.
- **Limpiar suscripciones inválidas (404/410)** → FCM caduca suscripciones; sin limpieza intentas enviar a endpoints muertos.
- **`upsert` con `onConflict: 'endpoint'`** → evita duplicados si el usuario activa 2 veces.
- **Roles aprobadores en una constante compartida** → `lib/push/notify.ts` y los `actions.ts` deben referenciar la MISMA lista.
- **Endpoints `/api/push/test` y `/api/push/diag` desde el día 1** → diagnóstico inmediato sin entrar a la BD.
- **PWA instalada en el celular**, no solo abierta en navegador → iOS exige instalación obligatoria; en Android funciona de ambas formas, pero instalada es más confiable.
- **VAPID keys sin espacios en blanco** al pegarlas en Vercel.

## A.7 Errores recurrentes a evitar (checklist)

- Mezclar Server/Client Components con event handlers → extraer a archivo con `'use client'`.
- `redirect()` antes de `await notify*()` → el redirect lanza y el código posterior no corre.
- `formData.get()` directo en Zod sin `preprocess` → usar helpers `optionalString()`, etc.
- Olvidar `revalidatePath()` tras una mutación → la UI no se actualiza hasta refresh manual.
- `notifyRoles` cuando hay un solo destinatario → usar `notifyUser` directo (ahorra una query).
- Borrar Storage solo con SQL → no funciona; usar la **API REST de Storage**.
- `toLocaleString` sin `timeZone` → Vercel = UTC, siempre desfasado.
- SELECT con user client después de UPDATE → puede devolver null silencioso; usar admin.
- `CREATE OR REPLACE VIEW` cambiando columnas → DROP + CREATE.
- Asumir que `last_used_at` se actualiza solo → lo actualiza `sendPushToUser` al éxito; úsalo como diagnóstico.

## A.8 Protocolo de verificación de push (ejecutar en orden)

- **TEST 1 — Estado del setup:** abrir `/api/push/diag` desde el celular logueado. Verificar `vapid.*` todos `true`, `suscripciones.count >= 1`, y que `testPush.ok = true` **y** llegue la push → setup completo.
- **TEST 2 — `sendPushToUser` end-to-end:** abrir `/api/push/test`. El JSON debe decir `enviadas: 1`, la push debe llegar al celular, y `last_used_at` (último registro) debe ser de hace **< 5 segundos**.
- **TEST 3 — Server action real (flujo completo):** crear una solicitud desde la PWA, aprobar desde la web (otra ventana), la push debe llegar, y `push_log` debe tener un `attempt` + un `ok` con `sent >= 1`.
- **Diagnóstico:** si **TEST 1 OK pero TEST 3 falla** → el server action no está llamando a `notifyUser`, o tiene el bug de RLS (ver A.3 Bug #1).
