# -*- coding: utf-8 -*-
"""Manual detallado de pruebas AZUR ERP en Word (.docx), brandeado, español Perú."""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

AZUR = RGBColor(0xE2, 0x06, 0x27)
AZUR2 = RGBColor(0xBE, 0x17, 0x23)
GRIS = RGBColor(0x66, 0x66, 0x66)
VERDE = RGBColor(0x0A, 0x7D, 0x33)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)
LOGO = "logoazur.png"

doc = Document()
st = doc.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(10.5)

def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:fill"), hexcolor); tcPr.append(shd)

def cell_text(cell, text, bold=False, color=None, size=9.5, align=None, white=False):
    cell.text = ""; p = cell.paragraphs[0]
    if align: p.alignment = align
    r = p.add_run(text); r.bold = bold; r.font.size = Pt(size)
    if white: r.font.color.rgb = BLANCO
    elif color: r.font.color.rgb = color

def h1(text):
    p = doc.add_heading(text, level=1)
    for r in p.runs: r.font.color.rgb = AZUR; r.font.size = Pt(16)
    return p

def h2(text):
    p = doc.add_heading(text, level=2)
    for r in p.runs: r.font.color.rgb = AZUR2; r.font.size = Pt(13)
    return p

def h3(text):
    p = doc.add_heading(text, level=3)
    for r in p.runs: r.font.color.rgb = RGBColor(0x33,0x33,0x33); r.font.size = Pt(11.5)
    return p

def para(text, color=GRIS, size=10):
    p = doc.add_paragraph(); r = p.add_run(text); r.font.size = Pt(size)
    if color: r.font.color.rgb = color
    return p

def proposito(text):
    p = doc.add_paragraph(); r = p.add_run("Para qué sirve: "); r.bold = True; r.font.size = Pt(10); r.font.color.rgb = AZUR2
    r2 = p.add_run(text); r2.font.size = Pt(10)
    return p

def tabla(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers)); t.style = "Table Grid"
    for j, x in enumerate(headers):
        c = t.rows[0].cells[j]; shade(c, "BE1723"); cell_text(c, x, bold=True, white=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    for row in rows:
        rc = t.add_row()
        for j, val in enumerate(row):
            cell_text(rc.cells[j], val, size=9.5)
    if widths:
        for col, w in zip(t.columns, widths):
            for c in col.cells: c.width = w
    doc.add_paragraph()
    return t

def campos(rows):
    h3("Campos del formulario")
    tabla(["Campo", "Para qué sirve / qué escribir", "Formato · obligatorio"], rows,
          [Inches(1.5), Inches(3.3), Inches(1.6)])

def botones(rows):
    h3("Botones y acciones")
    tabla(["Botón / acción", "Qué hace al pulsarlo"], rows, [Inches(2.0), Inches(4.5)])

def pestanas(rows):
    h3("Pestañas / secciones")
    tabla(["Pestaña", "Qué contiene"], rows, [Inches(2.0), Inches(4.5)])

def pasos(items):
    h3("Paso a paso")
    for accion, esperado in items:
        p = doc.add_paragraph(style="List Number"); r = p.add_run(accion); r.font.size = Pt(10.5)
        if esperado:
            sp = doc.add_paragraph(); sp.paragraph_format.left_indent = Inches(0.5)
            rr = sp.add_run("✓ Debes ver: "); rr.bold = True; rr.font.size = Pt(9); rr.font.color.rgb = VERDE
            r2 = sp.add_run(esperado); r2.font.size = Pt(9); r2.font.color.rgb = GRIS

def obs(filas=3):
    p = doc.add_paragraph(); r = p.add_run("📝 Observaciones del cliente sobre esta sección:"); r.bold = True; r.font.size = Pt(9.5); r.font.color.rgb = AZUR2
    t = doc.add_table(rows=1, cols=4); t.style = "Table Grid"
    for j, x in enumerate(["Qué probaste", "¿Funcionó? Sí/No", "Severidad A/M/B", "Comentario"]):
        c = t.rows[0].cells[j]; shade(c, "E20627"); cell_text(c, x, bold=True, white=True, size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(filas):
        rc = t.add_row()
        for j in range(4): cell_text(rc.cells[j], "", size=10)
    for col, w in zip(t.columns, [Inches(1.9), Inches(1.1), Inches(1.2), Inches(2.3)]):
        for c in col.cells: c.width = w
    doc.add_paragraph()

def add_toc():
    p = doc.add_paragraph(); run = p.add_run()
    f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = 'TOC \\o "1-2" \\h \\z \\u'
    f2 = OxmlElement("w:fldChar"); f2.set(qn("w:fldCharType"), "separate")
    tt = OxmlElement("w:t"); tt.text = "Abre el documento en Word y presiona F9 (o clic derecho → Actualizar campos) para ver el índice con páginas."
    f3 = OxmlElement("w:fldChar"); f3.set(qn("w:fldCharType"), "end")
    for e in (f1, instr, f2, tt, f3): run._r.append(e)

def page_number_footer():
    footer = doc.sections[0].footer
    fp = footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("AZUR Constructora e Inmobiliaria · Manual de Pruebas del ERP · Pág. ")
    r.font.size = Pt(8); r.font.color.rgb = GRIS
    fld = OxmlElement("w:fldSimple"); fld.set(qn("w:instr"), "PAGE")
    fp._p.append(fld)

# ───────────────────────── PORTADA ─────────────────────────
if os.path.exists(LOGO):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(LOGO, width=Inches(2.2))
doc.add_paragraph()
t = doc.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = t.add_run("Manual de Pruebas — Plataforma ERP + App de Obra"); r.bold = True; r.font.size = Pt(23); r.font.color.rgb = AZUR
s = doc.add_paragraph(); s.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = s.add_run("AZUR Constructora e Inmobiliaria"); r.font.size = Pt(14); r.font.color.rgb = AZUR2
d = doc.add_paragraph(); d.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = d.add_run("Guía detallada, campo por campo y botón por botón, para probar TODOS los flujos\nde extremo a extremo y registrar observaciones en este mismo documento."); r.font.size = Pt(11); r.font.color.rgb = GRIS
doc.add_paragraph()
t = doc.add_table(rows=3, cols=2); t.style = "Table Grid"
for i, (k, v) in enumerate([("Empresa / cliente", ""), ("Persona que prueba", ""), ("Fecha de la prueba", "")]):
    cell_text(t.rows[i].cells[0], k, bold=True, size=10); cell_text(t.rows[i].cells[1], v, size=10)
doc.add_paragraph()
para("Contraseña de todos los usuarios de prueba: Azur2026!", color=AZUR2, size=10)
doc.add_page_break()
h1("Índice"); add_toc(); doc.add_page_break()

# ───────────────────── 1. CONCEPTOS ─────────────────────
h1("1. Conceptos básicos del sistema")
proposito("Entender cómo está organizado el negocio dentro del sistema antes de probar.")
para("La jerarquía del sistema es: Línea de negocio → Proyecto → Etapas/Partidas → (Solicitudes de pago · Valorizaciones · Partes diarios).")
h3("Líneas de negocio")
tabla(["Línea", "Para qué"], [
    ["Azur Construcción", "Obras con presupuesto por partidas, APU, curva S y valorización (proyecto Grande)."],
    ["Cocina Pro", "Línea propia con su catálogo e identidad."],
    ["Mantenimiento", "Servicios recurrentes con cronograma de visitas (proyecto Chico)."],
])
h3("Tipos de proyecto")
tabla(["Tipo", "Cómo se comporta"], [
    ["Grande (construcción)", "Usa metrados, APU, curva S, valorización formal, adicionales y liquidación."],
    ["Chico (mantenimiento/acondicionamiento)", "Lista de servicios, control de caja/gasto; activa la pestaña Mantenimiento."],
])
h3("Roles y qué hace cada uno")
tabla(["Rol", "Qué puede hacer"], [
    ["Gerencia General", "Ve todo, aprobación final de pagos, dashboards, márgenes."],
    ["Jefe de Proyectos", "Proyectos, valorizaciones, 1ª aprobación de pagos."],
    ["Jefe de Presupuestos", "Cotizaciones (APU) y catálogos."],
    ["Administrador (Pamela)", "Finanzas: programa y paga, cajas, CxC y CxP."],
    ["Comercial", "Cotizaciones y su estado."],
    ["Residente / Coordinador", "App de obra: check-in, RDO, evidencias, solicitudes, tareo."],
    ["Prevencionista (SOMA)", "Seguridad: charlas, observaciones, incidentes."],
    ["Logístico", "Almacén y compras."],
])
obs(2)

# ───────────────────── 2. ACCESO ─────────────────────
h1("2. Acceso y navegación")
proposito("Ingresar al sistema y reconocer el menú.")
pasos([
    ("Abre la dirección web de la plataforma en una computadora (y en el celular para la app de obra).", "Pantalla de inicio de sesión con el logo de AZUR sobre fondo blanco y, debajo, la lista de usuarios de prueba."),
    ("Toca un usuario de prueba (o escribe correo y contraseña Azur2026!) y pulsa Ingresar.", "Entras: los roles de oficina ven el menú lateral (sidebar); los de obra ven la app de campo con barra inferior."),
    ("Observa arriba a la derecha la campana de notificaciones y tu nombre/menú de usuario.", "La campana muestra un número si hay notificaciones sin leer; el menú permite ir a Mi perfil o Cerrar sesión."),
    ("Prueba Cerrar sesión desde el menú de usuario.", "Vuelves a la pantalla de inicio de sesión."),
])
botones([
    ["Menú lateral (Dashboard, Comercial, Proyectos, Finanzas, Almacén, Reportes, Alertas, Clientes, Catálogos, Usuarios)", "Cada opción abre su módulo. Solo aparecen las que tu rol puede usar."],
    ["Campana 🔔", "Abre el panel de notificaciones; al tocar una, se marca leída."],
    ["Menú de usuario (tu nombre)", "Mi perfil / Cerrar sesión."],
])
obs(2)

# ───────────────────── 3. DASHBOARD ─────────────────────
h1("3. Dashboard (inicio)")
proposito("Ver la película del negocio: ingresos/egresos del mes, salud de cada proyecto y alertas.")
para("Entra como Gerencia y abre Dashboard (primera opción del menú).")
h3("Qué muestra")
tabla(["Elemento", "Qué significa"], [
    ["Ingresos del mes", "Suma de abonos del cliente del mes en curso."],
    ["Egresos del mes", "Suma de pagos realizados en el mes."],
    ["Proyectos activos / total", "Cuántos están en ejecución."],
    ["Alertas abiertas", "Alertas críticas sin resolver."],
    ["Barra de 3 tramos (por proyecto)", "Proyectado (referencia) · Pagos/abonos · Gasto. El color indica salud (verde/ámbar/rojo)."],
    ["Panel de alertas críticas", "Las últimas alertas del sistema."],
])
para("Regla de salud #1: el gasto no debe superar lo cobrado, y lo cobrado debe avanzar hacia lo proyectado. Regla #2: el gasto real no debe superar lo valorizado. Si se rompen, la barra se pone roja y se genera alerta.")
pasos([
    ("Pulsa una barra de proyecto.", "Te lleva al detalle de ese proyecto."),
])
obs(2)

# ───────────────────── 4. CLIENTES ─────────────────────
h1("4. Maestros — Clientes")
proposito("Registrar y administrar la cartera de clientes (se usan al cotizar).")
para("Menú Clientes (grupo Maestros). Como Comercial, Gerencia, Presupuestos o Administrador.")
campos([
    ["Razón social", "Nombre o razón social del cliente.", "Texto · obligatorio"],
    ["Tipo doc", "RUC, DNI o CE.", "Lista"],
    ["RUC / DNI", "Número de documento.", "Solo números (RUC 11, DNI 8)"],
    ["Contacto", "Persona de contacto.", "Texto"],
    ["Teléfono", "Teléfono del contacto.", "Solo números"],
    ["Email", "Correo del contacto.", "Formato correo válido"],
    ["Origen", "Cómo llegó el cliente (directo, recomendación, oficina, llamada).", "Lista"],
    ["Ubicación (referencial)", "Dirección o referencia en texto libre.", "Texto"],
])
botones([
    ["Nuevo cliente", "Abre el formulario para crear un cliente."],
    ["Importar", "Pega varias filas (Razón social, RUC, contacto) para cargar la cartera en lote; detecta duplicados por RUC."],
    ["Buscar", "Filtra la lista por razón social, RUC o contacto."],
    ["Lápiz (editar)", "Abre el cliente para modificarlo."],
])
pasos([
    ("Pulsa Nuevo cliente, llena los campos y Guardar.", "El cliente aparece en la tabla; al escribir letras en RUC/teléfono no las acepta."),
    ("Usa el buscador con parte del nombre.", "La lista se filtra al instante."),
    ("Pulsa Importar, pega 2-3 líneas separadas por tabulación y Importar.", "Muestra cuántos importó y cuántos duplicados omitió."),
    ("Edita un cliente con el lápiz y guarda un cambio.", "El cambio queda guardado."),
])
obs(3)

# ───────────────────── 5. CATÁLOGOS ─────────────────────
h1("5. Maestros — Catálogos")
proposito("Mantener partidas, insumos, contratistas/proveedores, plantillas y medios de pago.")
para("Menú Catálogos (grupo Maestros). Tiene varias pestañas.")
pestanas([
    ["Clientes", "Misma cartera de clientes (también editable aquí)."],
    ["Contratistas/Proveedores", "Razón social, tipo, RUC/DNI, especialidad, contacto, teléfono, banco, cuenta, CCI."],
    ["Partidas", "Línea, código, descripción, unidad y costo referencial. Base para cotizar."],
    ["Insumos", "Código, nombre, unidad, precio y tipo (material/mano de obra/equipos)."],
    ["Plantillas", "Textos de condiciones, servicios incluidos/omitidos y garantía precargados."],
    ["Medios de pago", "Cuentas de la empresa (banco, titular, cuenta soles/dólares, CCI, detracción)."],
])
botones([
    ["Nuevo (en cada pestaña)", "Crea un registro en ese catálogo."],
    ["Lápiz / Tacho", "Editar o eliminar un registro."],
    ["Actualizar precios", "Ajusta en % (ej. +5%) los precios de insumos/partidas y avisa cuántas cotizaciones podrían quedar desactualizadas."],
])
pasos([
    ("En Partidas crea una partida nueva (línea, código, descripción, unidad, costo).", "Queda guardada y aparecerá al cotizar."),
    ("Pulsa Actualizar precios, elige Insumos, escribe 5 y Aplicar.", "Sube 5% los precios y muestra un aviso."),
])
obs(3)

# ───────────────────── 6. COMERCIAL ─────────────────────
h1("6. Comercial — Cotizaciones")
proposito("Crear y negociar cotizaciones; al aprobarse se convierten en proyecto.")

h2("6.1 Listado de cotizaciones")
botones([
    ["Nueva cotización", "Abre el asistente para crear una cotización."],
    ["Buscar", "Filtra por proyecto, código o asunto."],
    ["Menú ⋮ de fila", "Abrir/Editar o Eliminar (solo si no fue aceptada)."],
    ["Paginación", "Anterior/Siguiente cuando hay muchas cotizaciones."],
])
obs(2)

h2("6.2 Nueva cotización (datos generales)")
campos([
    ["Origen del lead", "Cómo llegó el contacto (directo, recomendación, oficina, llamada).", "Lista · obligatorio"],
    ["Cliente", "Cliente de la cotización; con el botón + creas uno al vuelo.", "Lista · obligatorio"],
    ["Línea de negocio", "Carga la plantilla y catálogo correspondientes.", "Lista · obligatorio"],
    ["Tipo de cotización", "Única de obra (Grande) / Programada de mantenimiento / Recurrencia (Chico).", "Lista"],
    ["Nombre del proyecto", "Nombre con el que se identificará.", "Texto · obligatorio"],
    ["Asunto", "Breve descripción del trabajo.", "Texto"],
    ["Ubicación + Mapa", "Busca la dirección o haz clic en el mapa para fijar el punto; rellena la ubicación.", "Texto + mapa"],
    ["Vigencia (días)", "Cuántos días es válida la cotización.", "Número"],
    ["Plantilla de condiciones", "Precarga condiciones/garantía editables (o página en blanco).", "Lista"],
])
pasos([
    ("Llena los datos, ubica en el mapa y pulsa Crear y armar presupuesto.", "Se crea con código COT-#### y abre el editor."),
    ("Si el cliente no existe, pulsa + junto al selector y créalo (razón social, RUC).", "Se agrega y queda seleccionado."),
])
obs(2)

h2("6.3 Editor de la cotización — Cuadro de costos y margen (árbol)")
proposito("Armar el presupuesto en árbol de hasta 4 niveles, con costo y margen por partida.")
h3("Columnas de la tabla")
tabla(["Columna", "Qué es"], [
    ["Ítem", "Numeración automática (1.0, 1.1, 1.1.1, 1.1.1.1)."],
    ["Título", "Nombre de la partida/sub-partida/actividad."],
    ["Und / Cant / C. Unit", "Unidad, cantidad y costo unitario (solo en el último nivel)."],
    ["Subtotal", "Cantidad × costo unitario de la fila."],
    ["% Marg", "Margen por partida (ej. 30%)."],
    ["P. Unit", "Precio unitario = costo / (1 − margen)."],
    ["Precio", "Subtotal con margen (lo que ve el cliente)."],
])
botones([
    ["Agregar partida", "Abre el selector de catálogo (buscar o crear en blanco) para una partida de nivel 1."],
    ["+ (en una fila)", "Agrega un hijo (sub-partida → actividad → sub-actividad), hasta 4 niveles."],
    ["Capas (Detallar APU)", "Abre el desglose del costo unitario por componentes."],
    ["Tacho", "Elimina la fila (y sus hijos)."],
    ["Selector de catálogo", "Lista las partidas del catálogo con código y precio; las que dicen APU traen su desglose."],
])
pasos([
    ("Pulsa Agregar partida y elige una del catálogo (o crea en blanco).", "Se agrega; si tiene APU, el costo unitario se calcula solo."),
    ("Con + crea sub-partidas y actividades; escribe unidad, cantidad, C. unitario y % de margen en las hojas.", "Subtotal, P. unitario y Precio se recalculan al instante; los niveles superiores suman a sus hijos."),
])
obs(2)

h2("6.4 Detallar APU (desglose del costo)")
campos([
    ["Tipo", "Mano de obra / Materiales / Equipos / Subcontratos / Gastos generales.", "Lista"],
    ["Descripción", "Insumo o recurso.", "Texto · obligatorio"],
    ["Unidad", "Unidad del componente.", "Texto"],
    ["Cantidad/und", "Cantidad por unidad de partida.", "Número"],
    ["Precio", "Precio unitario del insumo.", "Número"],
    ["Cuadrilla / Rendimiento", "Opcionales, para mano de obra.", "Número"],
])
botones([
    ["Agregar", "Añade el componente; el C. unitario de la partida se recalcula."],
    ["Guardar como plantilla", "Crea una partida en el catálogo con este APU para reutilizarla."],
    ["X (en un componente)", "Elimina ese componente."],
])
obs(2)

h2("6.5 Bloque de totales y descuento")
tabla(["Concepto", "Qué es"], [
    ["Subtotal", "Suma de precios con margen."],
    ["Gastos generales / administrativos / Utilidad", "Porcentajes configurables; se pueden ocultar al cliente."],
    ["Costo directo", "Subtotal + GG + GA + utilidad."],
    ["I.G.V. (18%)", "Impuesto; se puede ocultar."],
    ["Total / Total con descuento", "Total final; si activas descuento comercial aparece el total rebajado."],
    ["Vista interna", "Costo directo real y margen total (nunca lo ve el cliente)."],
])
botones([
    ["Interruptores Mostrar GG/GA/Utilidad/IGV", "Ocultan o muestran cada concepto en el PDF del cliente."],
    ["Agregar descuento comercial", "Activa un % de descuento sobre el total."],
])
obs(2)

h2("6.6 Condiciones y pago")
campos([
    ["Forma de pago (filas)", "Conceptos y % (ej. 20% adelanto + 80% valorizaciones).", "Texto + % · suma ≤ 100%"],
    ["Plazo de ejecución + tipo", "Número de días y si son calendario o útiles.", "Número + lista"],
    ["Condiciones / Servicios incluidos / omitidos / Garantía", "Textos editables precargados de la plantilla.", "Texto largo"],
    ["Medios de pago", "Cuentas de la empresa que se mostrarán al cliente.", "Solo lectura"],
])
pasos([
    ("Arma la forma de pago y verifica que la suma no pase de 100%.", "Si pasa, el sistema lo advierte y no deja guardar."),
    ("Edita las condiciones y activa/desactiva la garantía.", "Se guardan solas; la garantía solo sale en el PDF si está incluida."),
])
obs(2)

h2("6.7 Acciones, edición colaborativa e historial")
botones([
    ["Generar PDF (cliente)", "Descarga el PDF brandeado (sin costos ni margen)."],
    ["Descargar Excel (interno)", "Excel con costos y márgenes, con logo."],
    ["Enviar por WhatsApp", "Abre WhatsApp con un mensaje y enlace listos."],
    ["Guardar versión", "Guarda una versión de la negociación (v1, v2…)."],
    ["Marcar como enviada / Pasar a negociación", "Cambian el estado de la cotización."],
    ["Aprobar → crear proyecto", "Convierte la cotización en proyecto (sin margen) + cronograma + caja."],
    ["Rechazar / Eliminar", "Rechaza (con motivo) o elimina (si no fue aceptada)."],
])
pasos([
    ("Abre la misma cotización en otra ventana con otro usuario y edita una fila.", "Verás los avatares de quién está conectado y los cambios aparecen en segundos."),
    ("Entra a la pestaña Historial de modificaciones, filtra por usuario y prueba Revertir un cambio.", "Muestra quién cambió qué (colores por usuario); revertir restaura el valor anterior."),
])
obs(3)

# ───────────────────── 7. PROYECTOS ─────────────────────
h1("7. Proyectos")
proposito("Gobernar la ejecución de la obra: presupuesto, programación, valorización, finanzas y cierre.")
h2("7.1 Listado")
botones([["Buscar / Paginación", "Filtra por nombre o código; navega por páginas."], ["Clic en el código", "Abre el proyecto."]])

h2("7.2 Detalle — pestañas")
pestanas([
    ["Resumen", "KPIs (contrato, cobrado, gasto, caja), barra de 3 tramos, Curva S, hitos, informe de obra y configuración rápida."],
    ["Last Planner", "Itemizado + programación + valorizaciones + estado/prioridad automáticos."],
    ["Cronograma de cobros", "Armadas (% por avance o fecha) con su monto."],
    ["Adicionales", "Adicionales/deductivos con aprobación."],
    ["Equipo", "Personas asignadas con su rol de obra."],
    ["Mantenimiento", "(Solo proyectos chicos) cronograma de servicios recurrentes."],
    ["Campo", "Lo capturado desde la app: asistencia (GPS), partes diarios, evidencias y SST."],
    ["Liquidación", "Balance final del proyecto y saldo del adelanto."],
    ["Expediente", "Documentos por carpetas (contratos, planos, etc.)."],
])
obs(2)

h2("7.3 Resumen")
botones([
    ["Informe de obra (PDF)", "Abre un cuadro para elegir qué secciones incluir y genera el PDF para el cliente."],
    ["Agregar hito", "Registra un hito con fecha; se marca Próximo/Vencido/Cumplido."],
    ["Configuración rápida", "Cambia estado, contrato total, % de adelanto y tope de caja."],
])
obs(2)

h2("7.4 Last Planner (los 4 cuadrantes)")
tabla(["Columna", "Qué es"], [
    ["Ítem / Título / Und / Cant / C.Unit", "Itemizado del proyecto (a costo)."],
    ["Subtotal / Total", "Subtotal en sub-partidas; Total en las partidas generales."],
    ["Contratista", "Responsable de la partida (lista de contratistas)."],
    ["Inicio / Entrega / Dur", "Fechas y duración de la partida."],
    ["Estado", "Automático: Completado/En progreso/Detenido/En espera/Pendiente/Retrasado."],
    ["Prioridad", "Automática (Muy alta…Muy baja) comparando avance real vs. proyectado."],
    ["% Acum", "Avance acumulado (barra verde) y Saldo por valorizar."],
    ["Val N1, N2… (% sem)", "Valorización por semana; se ingresa el % de avance en la última."],
])
botones([
    ["Partida / + / Capas / Tacho", "Agregar partida (catálogo), hijo, detallar APU del proyecto, o eliminar."],
    ["Nueva valorización", "Crea la columna de la semana para registrar avance."],
    ["Guardar avances", "Guarda el % de la semana y recalcula estado/prioridad/saldo."],
    ["Resumen PDF", "PDF de la valorización para el cliente."],
    ["Registrar cobro", "Lleva el cobro neto (valorizado − amortización del adelanto) a la caja del proyecto."],
])
pasos([
    ("Asigna contratista y fechas a una partida.", "Estado/Prioridad se ajustan."),
    ("Pulsa Nueva valorización, pon el % de avance en las hojas y Guardar avances.", "Sube el % acumulado (barra verde) y baja el saldo; estado/prioridad se recalculan solos."),
    ("Revisa el panel de dilución del adelanto y pulsa Registrar cobro.", "El cobro neto entra a la caja; el saldo del adelanto disminuye."),
])
obs(3)

h2("7.5 Cronograma de cobros, Adicionales y Equipo")
botones([
    ["Agregar armada / Guardar cronograma", "Define cómo se cobrará (concepto, %, por avance o fecha)."],
    ["Registrar adicional/deductivo + Aprobar/Rechazar", "Gestiona cambios al contrato."],
    ["Asignar al equipo / Quitar", "Agrega personas con rol de obra (una persona puede tener varios roles)."],
])
obs(2)

h2("7.6 Mantenimiento (proyectos chicos)")
campos([
    ["Categoría", "Tipo de servicio (limpieza, luminarias…).", "Texto · obligatorio"],
    ["Descripción / Monto por visita", "Detalle y costo de cada visita.", "Texto / número"],
    ["Recurrencia", "Única/Semanal/Quincenal/Mensual/Trimestral/Semestral.", "Lista"],
    ["Inicio / N° de visitas", "Fecha de inicio y cuántas visitas generar.", "Fecha / número"],
    ["Avisar (días antes)", "7, 15 o 30 días antes de cada visita.", "Lista"],
])
botones([
    ["Generar cronograma", "Crea todas las visitas con sus fechas."],
    ["Ejecutado / Facturado", "Cambian el estado de cada servicio."],
])
para("El sistema genera una alerta automática cuando una visita se acerca o queda pendiente.")
obs(3)

h2("7.7 Campo (lo que llega del celular)")
pestanas([
    ["Asistencia", "Entradas/salidas con hora y enlace al mapa (GPS)."],
    ["Partes diarios", "RDO con actividades, avance, personal, observaciones."],
    ["Evidencias", "Galería de fotos por partida."],
    ["SST", "Charlas, observaciones e incidentes."],
])
obs(2)

h2("7.8 Liquidación")
tabla(["Línea", "Qué es"], [
    ["Contrato ajustado", "Contrato + adicionales − deductivos."],
    ["Valorizado / Cobrado / Por cobrar", "Avance facturado, cobrado y pendiente."],
    ["Costo presupuestado / Gastado real", "Presupuesto interno vs. egresos reales."],
    ["Margen vs. presupuesto / Utilidad real", "Resultado del proyecto y % de margen."],
    ["Saldo del adelanto", "Adelanto inicial − amortizado (baja hasta 0)."],
])
botones([
    ["PDF de liquidación", "Documento brandeado con el balance final."],
    ["Cerrar y liquidar obra", "Pone el proyecto en Liquidado, cierra la caja chica y devuelve el remanente a la caja central."],
])
obs(2)

# ───────────────────── 8. FINANZAS ─────────────────────
h1("8. Finanzas")
proposito("Trazabilidad total: solicitud → aprobación → pago → comprobante, además de CxC, CxP y cajas.")
h2("8.1 Solicitudes de pago — campos (desde la app o web)")
campos([
    ["Tipo", "Contratistas / Proveedores / Caja chica / Servicios / Honorarios.", "Lista · obligatorio"],
    ["Proyecto", "Proyecto al que se carga el gasto.", "Lista"],
    ["Partida presupuestal", "Partida del presupuesto.", "Texto/lista"],
    ["Beneficiario", "A quién se le paga.", "Texto"],
    ["Especialidad / Categoría-etapa", "Clasificación del gasto (ej. carpintería, MOD).", "Texto"],
    ["Monto (S/)", "Importe del gasto.", "Número · obligatorio"],
    ["Constancia", "Factura / Boleta / RHE.", "Lista"],
    ["Descripción", "Detalle del servicio/compra.", "Texto"],
    ["Cuenta bancaria", "Cuenta del beneficiario.", "Texto"],
    ["RUC / DNI · Razón social · N° comprobante", "Datos del beneficiario y del documento.", "Texto/números"],
])
para("La fecha de registro y el estado (Solicitada → Aprobada → Programada → Pagada → Conciliada) son automáticos.")
h2("8.2 Flujo de aprobación (3 niveles)")
botones([
    ["Aprobar (Jefe de Proyectos)", "Pasa a Aprobada y avisa al Administrador."],
    ["Rechazar / Devolver", "Devuelve con motivo al solicitante."],
    ["Programar (Administrador)", "Define banco de origen y fecha."],
    ["Pagar (Administrador)", "Registra método (transferencia/efectivo/Yape/Plin…), N° de operación y voucher adjunto."],
    ["Aprobar final (Gerencia)", "Solo si el monto supera el umbral configurado."],
    ["WhatsApp 📱 / Ojo 👁", "Envía el comprobante / muestra el detalle completo (17 campos)."],
])
pasos([
    ("Como Residente (en el celular) crea una solicitud y envíala.", "Queda Solicitada y avisa al Jefe."),
    ("Como Jefe de Proyectos, Aprobar.", "Pasa a Aprobada y avisa al Administrador."),
    ("Como Administrador, Programar y luego Pagar (método, N° operación, voucher).", "Pasa a Pagada; si supera el umbral, espera aprobación de Gerencia."),
    ("Como Gerencia, Aprobar final (si aplica).", "Queda Conciliada; si era caja chica, descuenta la caja; el solicitante recibe aviso."),
])
obs(3)
h2("8.3 Cuentas por cobrar (CxC)")
botones([
    ["Emitir factura (desde armada)", "Crea la factura de una armada pendiente."],
    ["Cobrar", "Registra un abono (parcial o total); actualiza el aging."],
    ["Factura manual", "Crea una factura suelta."],
])
para("Arriba ves el aging: Corriente / 1-30 / 31-60 / +60 días.")
obs(2)
h2("8.4 Cuentas por pagar (CxP) y Cajas")
botones([
    ["CxP", "Lista de obligaciones aprobadas/programadas pendientes de pago."],
    ["Abrir (caja)", "Abre la caja con su saldo e historial."],
    ["Registrar movimiento", "Reposición/abono/egreso/traslado/ajuste con método, N° operación y voucher."],
])
para("Cada caja avisa cuando se consume más del 80% de su tope.")
obs(2)

# ───────────────────── 9. ALMACÉN ─────────────────────
h1("9. Almacén (web)")
proposito("Controlar inventario y movimientos por proyecto.")
botones([
    ["Nuevo ítem", "Crea un ítem de inventario (código, nombre, unidad, stock, tipo)."],
    ["Registrar movimiento", "Ingreso (sin proyecto), Salida o Devolución (con proyecto). Actualiza el stock."],
])
para("Regla: el ingreso no lleva proyecto; las salidas y devoluciones sí.")
obs(2)

# ───────────────────── 10. REPORTES ─────────────────────
h1("10. Reportes")
proposito("Análisis financiero cruzado con filtros e indicadores.")
botones([
    ["Periodo (7/15/30 días, mes, histórico)", "Cambia el rango de análisis."],
    ["Filtro por línea / proyecto", "Acota los datos."],
    ["Exportar Excel", "Descarga el reporte brandeado según los filtros."],
])
para("Muestra ingresos vs egresos en el tiempo, resultados por línea, gasto por las 5 categorías y la tabla de proyectos con su salud.")
obs(2)

# ───────────────────── 11. ALERTAS ─────────────────────
h1("11. Alertas")
proposito("Centralizar los avisos del sistema (sobrecosto, hitos, cotizaciones, mantenimiento, etc.).")
botones([
    ["Filtro (todas/abiertas/resueltas)", "Cambia la vista."],
    ["Marcar resuelta", "Cierra la alerta."],
])
para("Muchas alertas se generan solas cada día (ver sección 13).")
obs(2)

# ───────────────────── 12. USUARIOS ─────────────────────
h1("12. Usuarios")
proposito("Administrar las cuentas y sus permisos.")
botones([
    ["Nuevo usuario", "Crea la cuenta (nombre, email, rol, teléfono, contraseña)."],
    ["Cambiar rol", "Modifica el rol desde la lista."],
    ["Activar / Desactivar", "Habilita o bloquea el acceso."],
    ["Contraseña", "Asigna una nueva contraseña al usuario."],
])
pasos([
    ("Crea un usuario y entra con él.", "Inicia sesión correctamente."),
    ("Entra como Residente y revisa que NO ve finanzas globales ni márgenes.", "Solo ve sus proyectos y su trabajo de campo."),
])
obs(2)

# ───────────────────── 13. APP DE OBRA (PWA) ─────────────────────
h1("13. App de obra (celular)")
proposito("Que el personal de obra registre todo desde el celular, incluso sin señal.")
para("Instala la app: abre la web en el celular y toca 'Instalar AZUR' (Android) o Compartir → Añadir a inicio (iPhone). Entra como Residente.")
h2("13.1 Inicio y asistencia")
botones([["Entrada / Salida (Check-in/out)", "Registra la asistencia con ubicación GPS y hora."]])
h2("13.2 Tareo de cuadrilla")
campos([["Proyecto / Fecha", "A qué obra y día.", "Lista/fecha"], ["Trabajador / horas / presente", "Cada miembro de la cuadrilla.", "Texto/número"]])
botones([["Agregar trabajador / Registrar tareo", "Añade filas y guarda la asistencia del personal."]])
h2("13.3 Parte diario (RDO)")
campos([
    ["Proyecto / Fecha", "Obra y día del parte.", "Lista/fecha"],
    ["Clima / Personal / Equipos / Materiales recibidos", "Condiciones del día.", "Texto/número"],
    ["Observaciones / Incidencias", "Notas del día.", "Texto"],
    ["Actividades (+ Actividad)", "Descripción, partida (opcional) y % de avance.", "Texto/número"],
])
botones([["Enviar parte del día", "Guarda el RDO y sus actividades; se consolida en el informe."]])
h2("13.4 Evidencias")
botones([["Tomar / elegir foto", "Abre la cámara o galería."], ["Subir evidencia", "Sube la foto con GPS y la vincula a la partida; aparece en la galería y en el proyecto."]])
h2("13.5 SST (seguridad)")
botones([["Charla 5 min / Observación / Incidente", "Registra cada uno (con foto opcional)."]])
h2("13.6 Almacén y modo sin conexión")
pasos([
    ("Registra una salida de material a un proyecto.", "Descuenta el stock."),
    ("Activa el modo avión, navega por pantallas ya vistas y llena un parte o solicitud.", "La app sigue funcionando; lo registrado se guarda y se sincroniza solo al volver la señal (aviso arriba)."),
])
h2("13.7 Notificaciones push")
pasos([
    ("Toca la campana y pulsa 'Activar notificaciones push'; acepta el permiso.", "Queda activado."),
    ("Haz que el Jefe apruebe una solicitud en otra ventana.", "Llega la notificación al celular y a la campana; al tocarla se marca leída."),
])
obs(3)

# ───────────────────── 14. AUTOMATIZACIÓN ─────────────────────
h1("14. Automatización diaria (alertas solas)")
proposito("Cada día (08:00 hora Perú) el sistema revisa y genera alertas/notificaciones sin que nadie las pida.")
tabla(["Revisa", "Qué hace"], [
    ["Cotizaciones", "Marca vencidas y avisa las por vencer."],
    ["Hitos", "Avisa los vencidos o próximos."],
    ["Armadas (cobros)", "Avisa las próximas a facturar."],
    ["Sobretiempo", "Proyectos con fecha de fin pasada y avance < 100%."],
    ["Salud financiera", "Gasto > cobrado / gasto > valorizado."],
    ["Cajas", "Cajas chicas sin movimiento por varios días."],
    ["Mantenimiento", "Servicios próximos según los días de aviso."],
    ["Jueves", "Recuerda emitir las valorizaciones de la semana."],
])
obs(2)

# ─────────────────── OBSERVACIONES GENERALES ───────────────────
doc.add_page_break()
h1("15. Observaciones generales y conclusiones")
para("Anota aquí comentarios globales, ideas de mejora o problemas que no entren en las secciones anteriores.")
t = doc.add_table(rows=1, cols=3); t.style = "Table Grid"
for j, x in enumerate(["Tema", "Prioridad (A/M/B)", "Detalle / sugerencia"]):
    c = t.rows[0].cells[j]; shade(c, "E20627"); cell_text(c, x, bold=True, white=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
for _ in range(12):
    rc = t.add_row()
    for j in range(3): cell_text(rc.cells[j], "", size=10)
doc.add_paragraph()
h2("Conformidad")
t = doc.add_table(rows=2, cols=2); t.style = "Table Grid"
cell_text(t.rows[0].cells[0], "Probado por (nombre y firma)", bold=True, size=10); cell_text(t.rows[0].cells[1], "", size=10)
cell_text(t.rows[1].cells[0], "Fecha", bold=True, size=10); cell_text(t.rows[1].cells[1], "", size=10)

page_number_footer()
# actualizar campos (TOC) al abrir en Word
upd = OxmlElement("w:updateFields"); upd.set(qn("w:val"), "true"); doc.settings.element.append(upd)

import shutil
repo_out = os.path.join("azur-erp", "GUIA_DE_PRUEBAS_AZUR.docx")
doc.save(repo_out)
print("Generado en repo:", os.path.abspath(repo_out))
try:
    shutil.copy(repo_out, "GUIA_DE_PRUEBAS_AZUR.docx")
    print("Copiado a la raíz.")
except PermissionError:
    alt = "GUIA_DE_PRUEBAS_AZUR_NUEVA.docx"
    shutil.copy(repo_out, alt)
    print("La raíz estaba bloqueada (¿Word abierto?). Guardé:", os.path.abspath(alt))
