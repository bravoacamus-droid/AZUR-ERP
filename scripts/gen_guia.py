# -*- coding: utf-8 -*-
"""Genera la Guía de Pruebas AZUR ERP en Word (.docx), brandeada, español Perú."""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

AZUR = RGBColor(0xE2, 0x06, 0x27)
AZUR2 = RGBColor(0xBE, 0x17, 0x23)
GRIS = RGBColor(0x66, 0x66, 0x66)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)
LOGO = "logoazur.png"

doc = Document()

# Estilo base
st = doc.styles["Normal"]
st.font.name = "Calibri"
st.font.size = Pt(11)

def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)

def set_cell_text(cell, text, bold=False, color=None, size=10, align=None, white=False):
    cell.text = ""
    p = cell.paragraphs[0]
    if align:
        p.alignment = align
    r = p.add_run(text)
    r.bold = bold
    r.font.size = Pt(size)
    if white:
        r.font.color.rgb = BLANCO
    elif color:
        r.font.color.rgb = color

def h1(text):
    p = doc.add_paragraph()
    p.space_before = Pt(10)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = AZUR
    # línea inferior
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single"); bottom.set(qn("w:sz"), "12"); bottom.set(qn("w:space"), "4"); bottom.set(qn("w:color"), "E20627")
    pbdr.append(bottom); pPr.append(pbdr)
    return p

def h2(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(12.5)
    r.font.color.rgb = AZUR2
    return p

def intro(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(10.5)
    r.font.color.rgb = GRIS
    return p

def pasos(items):
    for i, (accion, esperado) in enumerate(items, 1):
        p = doc.add_paragraph(style="List Number")
        r = p.add_run(accion)
        r.font.size = Pt(11)
        if esperado:
            sp = doc.add_paragraph()
            sp.paragraph_format.left_indent = Inches(0.5)
            rr = sp.add_run("✓ Qué debes ver: ")
            rr.bold = True; rr.font.size = Pt(9.5); rr.font.color.rgb = RGBColor(0x0A,0x7D,0x33)
            r2 = sp.add_run(esperado)
            r2.font.size = Pt(9.5); r2.font.color.rgb = GRIS

def tabla_obs(filas=4):
    intro("📝 Observaciones del cliente:")
    t = doc.add_table(rows=1, cols=4)
    t.style = "Table Grid"
    hdr = ["Sección / paso", "¿Funcionó? (Sí/No)", "Severidad (Alta/Media/Baja)", "Comentarios"]
    widths = [Inches(1.6), Inches(1.2), Inches(1.5), Inches(2.2)]
    for j, txt in enumerate(hdr):
        c = t.rows[0].cells[j]
        shade(c, "E20627")
        set_cell_text(c, txt, bold=True, white=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    for _ in range(filas):
        row = t.add_row()
        for j in range(4):
            set_cell_text(row.cells[j], "", size=10)
    for col, w in zip(t.columns, widths):
        for c in col.cells:
            c.width = w
    doc.add_paragraph()

# ───────────────────────── PORTADA ─────────────────────────
if os.path.exists(LOGO):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(LOGO, width=Inches(2.2))
for _ in range(1):
    doc.add_paragraph()
t = doc.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = t.add_run("Guía de Pruebas — Plataforma ERP + App de Obra"); r.bold = True; r.font.size = Pt(24); r.font.color.rgb = AZUR
s = doc.add_paragraph(); s.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = s.add_run("AZUR Constructora e Inmobiliaria"); r.font.size = Pt(14); r.font.color.rgb = AZUR2
d = doc.add_paragraph(); d.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = d.add_run("Documento para que el equipo de AZUR pruebe, paso a paso, todos los flujos\nde la plataforma y registre sus observaciones en este mismo archivo."); r.font.size = Pt(11); r.font.color.rgb = GRIS
doc.add_paragraph(); doc.add_paragraph()

# datos de prueba en portada
t = doc.add_table(rows=3, cols=2); t.style = "Table Grid"
datos = [("Empresa / cliente", ""), ("Persona que prueba", ""), ("Fecha de la prueba", "")]
for i, (k, v) in enumerate(datos):
    set_cell_text(t.rows[i].cells[0], k, bold=True, size=10)
    set_cell_text(t.rows[i].cells[1], v, size=10)
doc.add_page_break()

# ───────────────────── ANTES DE EMPEZAR ─────────────────────
h1("0. Antes de empezar")
intro("Esta guía recorre la plataforma de inicio a fin. Hazla con calma; en cada sección, al final, hay un cuadro para que anotes si funcionó y tus comentarios. Recomendación: ten abiertas dos ventanas del navegador (una normal y otra de incógnito) para probar acciones entre dos usuarios distintos a la vez.")
h2("¿Cómo ingreso?")
pasos([
    ("Abre la dirección web de la plataforma (la que te compartió el equipo, termina en .vercel.app) en una computadora; y en el celular para la app de obra.", "Verás la pantalla de inicio de sesión con el logo de AZUR sobre fondo blanco."),
    ("Debajo del formulario hay una lista de usuarios de prueba. Toca cualquiera para ingresar al instante (la contraseña de todos es Azur2026!).", "Entras directamente. Según el usuario, verás el panel de oficina (computadora) o la app de campo (celular)."),
])
h2("Usuarios de prueba")
t = doc.add_table(rows=1, cols=3); t.style = "Table Grid"
for j, x in enumerate(["Rol", "Correo", "Para qué sirve"]):
    c = t.rows[0].cells[j]; shade(c, "E20627"); set_cell_text(c, x, bold=True, white=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)
usuarios = [
    ("Gerencia General", "gerencia@azur.pe", "Ve todo, aprobación final de pagos, dashboards"),
    ("Jefe de Proyectos", "proyectos@azur.pe", "Proyectos y 1ª aprobación de pagos"),
    ("Jefe de Presupuestos", "presupuestos@azur.pe", "Comercial y proyectos"),
    ("Administrador (Pamela)", "admin@azur.pe", "Finanzas: programa y paga, cajas, CxC/CxP"),
    ("Comercial", "comercial@azur.pe", "Cotizaciones"),
    ("Residente", "residente@azur.pe", "App de obra (celular)"),
    ("Prevencionista (SOMA)", "soma@azur.pe", "Seguridad en la app de obra"),
    ("Logístico", "logistica@azur.pe", "Almacén"),
]
for rol, mail, uso in usuarios:
    row = t.add_row()
    set_cell_text(row.cells[0], rol, bold=True, size=10)
    set_cell_text(row.cells[1], mail, size=10)
    set_cell_text(row.cells[2], uso, size=10)
intro("Contraseña de todos los usuarios de prueba: Azur2026!")
doc.add_paragraph()

# ───────────────────────── SECCIONES ─────────────────────────
secciones = [
    ("1. Maestros: registrar clientes y catálogo",
     "Empezamos cargando datos base. Ingresa en la computadora como Comercial o Gerencia.",
     [("En el menú izquierdo entra a Maestros → Clientes y pulsa “Nuevo cliente”. Llena razón social, RUC (solo números) y contacto. Guarda.", "El cliente aparece en la lista. Si escribes letras en el RUC o teléfono, no las aceptará."),
      ("Prueba el buscador escribiendo parte del nombre del cliente.", "La lista se filtra al instante."),
      ("Entra a Maestros → Catálogos → Partidas. Revisa que ya hay partidas con su código y precio. Crea una nueva si quieres.", "La partida nueva queda guardada y luego aparecerá al armar cotizaciones."),
      ("En Catálogos, pulsa “Actualizar precios”, elige Insumos y pon 5, Aplicar.", "Sube 5% los precios y te avisa cuántas cotizaciones podrían quedar desactualizadas.")]),

    ("2. Comercial: armar una cotización completa",
     "Aquí nace todo. Como Comercial, menú Comercial → “Nueva cotización”.",
     [("Elige el origen del contacto, el cliente (o créalo con el botón +), la línea de negocio, el tipo (Única de obra = proyecto Grande) y el nombre del proyecto. En el mapa busca la dirección o haz clic para ubicarla. Pulsa “Crear y armar presupuesto”.", "Se abre el editor de la cotización con su código (COT-####)."),
      ("Pulsa “Agregar partida”. Se abre el catálogo: busca y elige una (las que dicen “APU” traen su desglose). También puedes crear en blanco.", "La partida se agrega con su precio. Si tiene APU, el costo unitario se calcula solo."),
      ("Con el botón + de una fila, crea sub‑partidas, actividades y sub‑actividades (hasta 4 niveles: 1.0, 1.1, 1.1.1, 1.1.1.1).", "La numeración se arma automáticamente."),
      ("En una partida sin APU, escribe unidad, cantidad, costo unitario y % de margen.", "El subtotal, el precio unitario y el precio con margen se recalculan al instante."),
      ("Pulsa el icono de capas (Detallar APU) de una partida y agrega componentes (mano de obra, materiales, equipos). Puedes “Guardar como plantilla” para reutilizarlo.", "El costo unitario pasa a calcularse desde el APU."),
      ("Baja a “Bloque de totales”: ajusta GG/GA/utilidad/IGV y usa los interruptores para ocultar lo que el cliente no debe ver. Activa un descuento comercial.", "Aparece el TOTAL CON DESCUENTO. La “vista interna” muestra el margen real (que el cliente nunca ve)."),
      ("Pestaña “Condiciones y pago”: arma la forma de pago (ej. 20% adelanto + 80% valorizaciones), define el plazo y edita las condiciones/servicios/garantía (vienen precargadas).", "El sistema valida que la suma de pagos no pase de 100%."),
      ("En “Acciones” prueba: Generar PDF (cliente), Descargar Excel (interno), Enviar por WhatsApp, Guardar versión.", "El PDF y el Excel salen con el logo de AZUR. El WhatsApp abre con un mensaje listo."),
      ("Abre la misma cotización en otra ventana como Presupuestos y edita una fila.", "Verás los avatares de quién está conectado y los cambios aparecen en segundos en la otra ventana."),
      ("Entra a la pestaña “Historial de modificaciones”.", "Aparece quién cambió qué (con colores por usuario) y puedes revertir un cambio.")]),

    ("3. Aprobar la cotización → crear el proyecto",
     "Cuando el cliente acepta, la cotización se convierte en proyecto.",
     [("En el editor de la cotización: Acciones → “Aprobar → crear proyecto”. Confirma.", "Te lleva al proyecto nuevo. El presupuesto llegó sin margen (a costo), se creó el cronograma de cobros y la caja chica."),
      ("Revisa que llegó una notificación (campana) al Jefe de Proyectos y Presupuestos.", "Aparece la notificación de “cotización aceptada”.")]),

    ("4. Proyectos: Last Planner y valorización",
     "Como Jefe de Proyectos, menú Proyectos → abre el proyecto.",
     [("En “Resumen” revisa la barra de tres tramos (Proyectado/Pagos/Gasto), la Curva S y agrega un hito con fecha.", "El hito se marca como Próximo o Vencido según la fecha."),
      ("Entra a “Last Planner”. Asigna contratista y fechas a una partida; revisa Estado y Prioridad (son automáticos).", "Estado y Prioridad cambian solos comparando lo planeado con lo real."),
      ("Pulsa “Nueva valorización”, ingresa el % de avance de la semana en las partidas hoja y “Guardar avances”.", "Sube el % acumulado (barra verde) y el saldo; Estado/Prioridad se recalculan."),
      ("Mira el panel de dilución del adelanto y pulsa “Resumen PDF”. Luego “Registrar cobro”.", "El cobro neto entra a la caja del proyecto; el saldo del adelanto baja."),
      ("Revisa las pestañas Cronograma de cobros, Adicionales, Equipo y Campo (verás el check‑in con GPS, partes y evidencias que se envíen desde el celular).", "Cada sección muestra su información.")]),

    ("5. Informe al cliente y liquidación",
     "Documentos que se entregan al cliente.",
     [("En el proyecto, “Resumen” → “Informe de obra (PDF)”. Marca o desmarca las secciones que quieres incluir y genera.", "Sale un PDF profesional con logo, avance y galería de fotos, solo con lo que elegiste."),
      ("Entra a la pestaña “Liquidación”.", "Ves el balance: contrato ajustado, cobrado, gastado, margen y utilidad real, más el saldo del adelanto."),
      ("Pulsa “PDF de liquidación”. (Opcional) “Cerrar y liquidar obra”.", "El PDF sale brandeado. Al liquidar, el proyecto se cierra y el remanente de la caja vuelve a la caja central.")]),

    ("6. Finanzas: del pedido al pago (3 niveles)",
     "Necesitas 3 usuarios: Residente, Jefe de Proyectos y Administrador. Usa varias ventanas.",
     [("En el CELULAR, como Residente: Pagos → llena una solicitud (tipo, proyecto, beneficiario, monto, etc.) y envía.", "Queda en estado “Solicitada” y llega aviso al Jefe."),
      ("En la computadora, como Jefe de Proyectos: Finanzas → Solicitudes de pago → Aprobar (o Rechazar con motivo).", "Pasa a “Aprobada” y avisa al Administrador."),
      ("Como Administrador: en la solicitud, “Programar” (banco y fecha), luego “Pagar”: elige método (transferencia, efectivo, Yape, Plin…), N° de operación y adjunta el voucher.", "Si el monto pasa el umbral, queda pendiente de aprobación final de Gerencia."),
      ("Como Gerencia (si corresponde): “Aprobar final”.", "La solicitud queda Conciliada; si es caja chica, descuenta la caja. El Residente recibe aviso de “pago realizado”."),
      ("Pulsa el icono de WhatsApp para enviar el comprobante, y el ojo 👁 para ver el detalle completo (17 campos).", "WhatsApp abre con el detalle del pago.")]),

    ("7. Cuentas por cobrar, por pagar y cajas",
     "Como Administrador, menú Finanzas.",
     [("Pestaña “Cuentas por cobrar”: en una armada pendiente pulsa “Emitir factura”, luego en la factura “Cobrar”.", "El cobro se registra; revisa el aging (corriente / 1‑30 / 31‑60 / +60 días)."),
      ("Pestaña “Cuentas por pagar”: revisa las obligaciones pendientes.", "Lista de solicitudes aprobadas/programadas."),
      ("Pestaña “Cajas”: abre una caja y registra un movimiento (reposición, egreso, traslado) con método y voucher.", "El movimiento aparece en el historial y el saldo se actualiza; avisa si pasa el 80% del tope.")]),

    ("8. App de obra (celular)",
     "Instala la app en el celular: abre la web y toca “Instalar AZUR” (Android) o Compartir → Añadir a inicio (iPhone). Entra como Residente.",
     [("Inicio: pulsa Entrada (Check‑in). Acepta el permiso de ubicación.", "Dice “Entrada registrada con ubicación GPS”."),
      ("Tareo de cuadrilla: elige proyecto y agrega trabajadores con sus horas. Registra.", "Quedan guardados en el tareo del día."),
      ("Parte diario (RDO): llena clima, personal, observaciones y agrega actividades. Envía.", "El parte se guarda y aparece en la lista."),
      ("Evidencias: pulsa “Tomar / elegir foto”, toma la foto, agrega descripción y “Subir evidencia”.", "La foto se sube con GPS y aparece en la galería (y en el proyecto, pestaña Campo)."),
      ("SST: registra una charla de 5 minutos, una observación y un incidente.", "Cada uno queda registrado."),
      ("Almacén: registra una salida de material a un proyecto.", "Descuenta el stock."),
      ("Activa el modo avión y navega por pantallas ya vistas; llena un parte o solicitud.", "La app sigue funcionando; lo que registres se guarda y se sincroniza solo al recuperar señal (verás el aviso arriba).")]),

    ("9. Notificaciones",
     "Para que lleguen al celular, la app debe estar instalada (sobre todo en iPhone).",
     [("Toca la campana arriba y pulsa “Activar notificaciones push”. Acepta el permiso.", "Queda activado."),
      ("Haz que el Residente cree una solicitud y el Jefe la apruebe (en otra ventana).", "Llega la notificación al celular y aparece en la campana."),
      ("Abre la campana y toca una notificación.", "Se marca como leída y el contador baja.")]),

    ("10. Dashboards, alertas y reportes",
     "Como Gerencia.",
     [("Entra a Dashboard (primera opción del menú izquierdo).", "Ves indicadores del mes, las barras de salud por proyecto y las alertas críticas."),
      ("Entra a Alertas y marca una como resuelta.", "Desaparece de las abiertas."),
      ("Entra a Reportes. Cambia el periodo (7/15/30 días, mes, histórico), filtra por proyecto/línea y pulsa “Exportar Excel”.", "Los gráficos cambian con el filtro y se descarga un Excel con el logo de AZUR.")]),

    ("11. Mantenimiento programado",
     "Para proyectos de tipo Chico (mantenimiento). Abre un proyecto de mantenimiento.",
     [("Entra a la pestaña “Mantenimiento”. Define categoría, monto, recurrencia (ej. Mensual) y N° de visitas, y “Generar cronograma”.", "Se crean automáticamente las visitas con sus fechas."),
      ("Marca un servicio como Ejecutado y luego Facturado.", "Cambia su estado. Cuando una visita se acerca, el sistema genera una alerta automática.")]),

    ("12. Usuarios",
     "Como Gerencia o Administrador, menú Usuarios.",
     [("Pulsa “Nuevo usuario” y créalo con un rol.", "Puede iniciar sesión con esos datos."),
      ("Cambia el rol de alguien, actívalo/desactívalo y usa “Contraseña” para asignarle una nueva.", "Los cambios se aplican de inmediato."),
      ("Entra como Residente y verifica que NO ve finanzas globales ni márgenes.", "Solo ve sus proyectos y su trabajo de campo.")]),
]

for titulo, desc, items in secciones:
    h1(titulo)
    intro(desc)
    pasos(items)
    tabla_obs(4)

# ─────────────────── OBSERVACIONES GENERALES ───────────────────
doc.add_page_break()
h1("Observaciones generales y conclusiones")
intro("Anota aquí cualquier comentario global, idea de mejora o problema que no entre en las secciones anteriores.")
t = doc.add_table(rows=1, cols=3); t.style = "Table Grid"
for j, x in enumerate(["Tema", "Prioridad (Alta/Media/Baja)", "Detalle / sugerencia"]):
    c = t.rows[0].cells[j]; shade(c, "E20627"); set_cell_text(c, x, bold=True, white=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
for _ in range(10):
    row = t.add_row()
    for j in range(3):
        set_cell_text(row.cells[j], "", size=10)

doc.add_paragraph(); doc.add_paragraph()
h2("Conformidad")
t = doc.add_table(rows=2, cols=2); t.style = "Table Grid"
set_cell_text(t.rows[0].cells[0], "Probado por (nombre y firma)", bold=True, size=10)
set_cell_text(t.rows[0].cells[1], "", size=10)
set_cell_text(t.rows[1].cells[0], "Fecha", bold=True, size=10)
set_cell_text(t.rows[1].cells[1], "", size=10)

# Pie con marca
section = doc.sections[0]
footer = section.footer
fp = footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = fp.add_run("AZUR Constructora e Inmobiliaria · Guía de Pruebas del ERP")
fr.font.size = Pt(8); fr.font.color.rgb = GRIS

out = "GUIA_DE_PRUEBAS_AZUR.docx"
doc.save(out)
print("Generado:", os.path.abspath(out))
