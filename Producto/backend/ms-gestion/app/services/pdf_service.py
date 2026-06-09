"""
Servicio de generación de PDF para proyectos.

Dos generadores independientes:
  - generar_pdf_proyecto()  →  PDF interno (empresa)
  - generar_pdf_cliente()   →  PDF externo (cliente, sin precios ni margen)

Extensibilidad:
  - Campos detalle empresa : agrega una línea a CAMPOS_DETALLE_EMPRESA.
  - Campos detalle cliente  : agrega una línea a CAMPOS_DETALLE_CLIENTE.
  - Conceptos de costo      : agrega un dict a la lista `conceptos_costo`
                              dentro de _construir_empresa().
"""

from io import BytesIO
from datetime import datetime
from decimal import Decimal

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Flowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas as pdf_canvas
from sqlalchemy.orm import Session

from app.services.proyecto_service import obtener_proyecto, obtener_materiales_planeados


# ═══════════════════════════════════════════════════════════════════════════════
# PALETA Y CONSTANTES
# ═══════════════════════════════════════════════════════════════════════════════
AZUL       = colors.HexColor("#0072CE")
GRIS       = colors.HexColor("#888888")
GRIS_CLARO = colors.HexColor("#CCCCCC")
AZUL_CLARO = colors.HexColor("#E6F3FF")
FILA_IMPAR = colors.HexColor("#F5F5F5")   # filas impares de tablas

COLORES_ESTADO = {
    "pendiente":  colors.HexColor("#FF9800"),
    "en_curso":   colors.HexColor("#2196F3"),
    "finalizado": colors.HexColor("#4CAF50"),
    "cancelado":  colors.HexColor("#F44336"),
}

ETIQUETAS_ESTADO = {
    "pendiente":  "Pendiente",
    "en_curso":   "En curso",
    "finalizado": "Finalizado",
    "cancelado":  "Cancelado",
}


# ═══════════════════════════════════════════════════════════════════════════════
# FORMATTERS COMPARTIDOS
# ═══════════════════════════════════════════════════════════════════════════════
def _fmt_precio(valor):
    if valor is None:
        return None
    try:
        return f"${round(Decimal(str(valor))):,}".replace(",", ".")
    except Exception:
        return str(valor)


def _fmt_fecha(valor):
    if not valor:
        return None
    try:
        return valor.strftime("%d/%m/%Y")
    except Exception:
        return str(valor)


def _fmt_estado(valor):
    if not valor:
        return None
    return ETIQUETAS_ESTADO.get(valor, valor)


def _color_hex(c) -> str:
    """Convierte color ReportLab → string #RRGGBB para markup XML de Paragraph."""
    return f"#{int(c.red * 255):02X}{int(c.green * 255):02X}{int(c.blue * 255):02X}"


def _estado_markup(estado: str) -> str:
    """Markup XML con color y negrita para mostrar el estado en un Paragraph."""
    c = COLORES_ESTADO.get(estado, colors.black)
    etiqueta = ETIQUETAS_ESTADO.get(estado, estado)
    return f'<font color="{_color_hex(c)}"><b>{etiqueta}</b></font>'


# ═══════════════════════════════════════════════════════════════════════════════
# CAMPOS DINÁMICOS
# ═══════════════════════════════════════════════════════════════════════════════
# estado y observaciones se renderizan fuera del loop (con lógica especial).
# Agrega una tupla (campo, etiqueta, formatter) para que aparezca automáticamente.

CAMPOS_DETALLE_EMPRESA = [
    ("tipo_proyecto",        "Tipo de servicio",      str),
    ("nombre_cliente",       "Cliente",               str),
    ("telefono_cliente",     "Teléfono",              str),
    ("direccion_cliente",    "Dirección",             str),
    ("fecha_inicio",         "Fecha de inicio",       _fmt_fecha),
    ("fecha_termino_maximo", "Fecha de término máx.", _fmt_fecha),
    ("presupuesto_estimado", "Presupuesto estimado",  _fmt_precio),
    ("presupuesto_final",    "Presupuesto final",     _fmt_precio),
]

CAMPOS_DETALLE_CLIENTE = [
    ("nombre_cliente",       "Cliente",               str),
    ("telefono_cliente",     "Teléfono",              str),
    ("direccion_cliente",    "Dirección",             str),
    ("fecha_inicio",         "Fecha de inicio",       _fmt_fecha),
    ("fecha_termino_maximo", "Fecha de término máx.", _fmt_fecha),
]


# ═══════════════════════════════════════════════════════════════════════════════
# FLOWABLE: CÓDIGO ESTILO TICKET
# ═══════════════════════════════════════════════════════════════════════════════
class _CodigoTicket(Flowable):
    """Caja con borde redondeado y fuente monoespaciada para el código del proyecto."""

    def __init__(self, texto: str):
        super().__init__()
        self.texto = texto
        self.width = 6.5 * cm
        self.height = 0.9 * cm

    def draw(self):
        self.canv.setFillColor(colors.HexColor("#F0F0F0"))
        self.canv.setStrokeColor(colors.HexColor("#BBBBBB"))
        self.canv.setLineWidth(0.75)
        self.canv.roundRect(0, 0, self.width, self.height, 5, stroke=1, fill=1)
        self.canv.setFillColor(colors.black)
        self.canv.setFont("Courier-Bold", 11)
        self.canv.drawCentredString(self.width / 2, 0.27 * cm, self.texto)


# ═══════════════════════════════════════════════════════════════════════════════
# CANVAS CON FOOTER "PÁGINA X DE Y" Y DECORACIÓN DE HEADER
# ═══════════════════════════════════════════════════════════════════════════════
class _FooterCanvas(pdf_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self._timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        self._saved_page_states = []
        pdf_canvas.Canvas.__init__(self, *args, **kwargs)

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for i, state in enumerate(self._saved_page_states, start=1):
            self.__dict__.update(state)
            self._dibujar_footer(i, total)
            pdf_canvas.Canvas.showPage(self)
        pdf_canvas.Canvas.save(self)

    def _dibujar_footer(self, pagina: int, total: int):
        ancho, _ = A4
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(GRIS)
        self.drawString(2 * cm, 1.2 * cm, "Proporcionado por: Servi Elec Manager")
        self.drawCentredString(ancho / 2, 1.2 * cm, f"Página {pagina} de {total}")
        self.drawRightString(ancho - 2 * cm, 1.2 * cm, f"Generado el {self._timestamp}")
        self.restoreState()


def _dibujar_fondo(canv, doc):
    """Patrón decorativo de líneas diagonales tenues en el área del header.
    Se llama ANTES de colocar el contenido de cada página (onFirstPage/onLaterPages),
    por lo que queda detrás del texto."""
    canv.saveState()
    ancho, alto = A4
    zona = 5.5 * cm
    # Clip al rectángulo del header para no salir de esa zona
    p = canv.beginPath()
    p.rect(0, alto - zona, ancho, zona)
    canv.clipPath(p, stroke=0, fill=0)
    canv.setStrokeColor(colors.HexColor("#CCE5FF"))
    canv.setLineWidth(0.5)
    paso = 1.0 * cm
    for i in range(26):
        x0 = i * paso - zona
        canv.line(x0, alto, x0 + zona, alto - zona)
    canv.restoreState()


# ═══════════════════════════════════════════════════════════════════════════════
# ESTILOS COMPARTIDOS
# ═══════════════════════════════════════════════════════════════════════════════
def _estilos() -> dict:
    return {
        "logo":     ParagraphStyle("logo",     fontName="Helvetica-Bold", fontSize=28,
                                   textColor=AZUL, spaceAfter=2),
        "tagline":  ParagraphStyle("tagline",  fontName="Helvetica",      fontSize=10,
                                   textColor=GRIS, spaceAfter=8),
        "titulo":   ParagraphStyle("titulo",   fontName="Helvetica-Bold", fontSize=14,
                                   spaceAfter=12),
        "info":     ParagraphStyle("info",     fontName="Helvetica",      fontSize=10,
                                   spaceAfter=3),
        "seccion":  ParagraphStyle("seccion",  fontName="Helvetica-Bold", fontSize=12,
                                   textColor=AZUL, spaceBefore=16, spaceAfter=6),
        "bullet":   ParagraphStyle("bullet",   fontName="Helvetica",      fontSize=11,
                                   spaceAfter=5, leftIndent=8),
        "obs":      ParagraphStyle("obs",      fontName="Helvetica",      fontSize=11,
                                   spaceAfter=4, leftIndent=12, leading=16),
        "sin_dat":  ParagraphStyle("sin_dat",  fontName="Helvetica",      fontSize=11,
                                   textColor=GRIS, spaceAfter=4, leftIndent=8),
        "firma_lbl":ParagraphStyle("firma_lbl",fontName="Helvetica",      fontSize=9,
                                   textColor=GRIS, alignment=TA_CENTER),
    }


def _hr(color=GRIS_CLARO, grosor: float = 0.5):
    return HRFlowable(width="100%", thickness=grosor, color=color, spaceAfter=6, spaceBefore=2)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS COMPARTIDOS: HEADER Y RESUMEN
# ═══════════════════════════════════════════════════════════════════════════════
def _header(st: dict, subtitulo: str) -> list:
    return [
        Paragraph("ServiElec", st["logo"]),
        Paragraph("Servicios Eléctricos Profesionales", st["tagline"]),
        Paragraph(subtitulo, st["titulo"]),
        _hr(AZUL, 1),
        Spacer(1, 0.3 * cm),
    ]


def _bloque_resumen(proyecto, st: dict) -> list:
    codigo = f"PRY-{proyecto.id_proyecto[:8].upper()}"
    e = [
        _CodigoTicket(codigo),
        Spacer(1, 0.25 * cm),
        Paragraph(f"<b>Nombre:</b>  {proyecto.nombre_proyecto}", st["info"]),
        Paragraph(f"<b>Cliente:</b>  {proyecto.nombre_cliente}", st["info"]),
    ]
    if proyecto.fecha_inicio:
        e.append(Paragraph(
            f"<b>Fecha de inicio:</b>  {_fmt_fecha(proyecto.fecha_inicio)}", st["info"]
        ))
    e += [Spacer(1, 0.4 * cm), _hr()]
    return e


def _bullets_campos(proyecto, lista_campos: list, st: dict) -> list:
    """Genera bullets para los campos de la lista, omitiendo los nulos."""
    e = []
    for campo, etiqueta, formatter in lista_campos:
        valor = getattr(proyecto, campo, None)
        if valor is None or valor == "":
            continue
        texto = formatter(valor)
        if not texto:
            continue
        e.append(Paragraph(f"•  <b>{etiqueta}:</b>  {texto}", st["bullet"]))
    return e


def _seccion_observaciones(proyecto, st: dict) -> list:
    """Sección propia para observaciones; vacío → lista vacía."""
    if not proyecto.observaciones or not proyecto.observaciones.strip():
        return []
    return [
        Paragraph("Observaciones del proyecto", st["seccion"]),
        _hr(),
        Paragraph(proyecto.observaciones.strip(), st["obs"]),
        Spacer(1, 0.3 * cm),
    ]


def _seccion_whatsapp(proyecto, st: dict) -> list:
    """Sección con datos del cliente vía bot; solo si tipo_proyecto == 'Chatbot'."""
    if proyecto.tipo_proyecto != "Chatbot":
        return []
    e = [
        Paragraph("Datos recibidos del cliente vía WhatsApp", st["seccion"]),
        _hr(),
    ]
    if proyecto.direccion_cliente:
        e.append(Paragraph(
            f"•  <b>Dirección indicada:</b>  {proyecto.direccion_cliente}", st["bullet"]
        ))
    if proyecto.fecha_inicio:
        e.append(Paragraph(
            f"•  <b>Fecha preferida de servicio:</b>  {_fmt_fecha(proyecto.fecha_inicio)}",
            st["bullet"],
        ))
    e.append(Spacer(1, 0.3 * cm))
    return e


def _bullet_cotizacion_wsp(proyecto, st: dict) -> Paragraph:
    es_chatbot = proyecto.tipo_proyecto == "Chatbot"
    if es_chatbot and proyecto.presupuesto_estimado is not None:
        txt = _fmt_precio(proyecto.presupuesto_estimado)
    else:
        txt = "No califica"
    return Paragraph(f"•  <b>Cotización inicial WhatsApp:</b>  {txt}", st["bullet"])


# ═══════════════════════════════════════════════════════════════════════════════
# PDF EMPRESA: TABLAS Y CAJAS ESPECÍFICAS
# ═══════════════════════════════════════════════════════════════════════════════
def _tabla_materiales_empresa(materiales: list) -> Table:
    col_widths = [8 * cm, 2 * cm, 3.5 * cm, 3.5 * cm]
    data = [["Nombre", "Cant.", "Precio unit.", "Subtotal"]]
    for m in materiales:
        precio_u = Decimal(str(m["precio_unitario"] or 0))
        cantidad = Decimal(str(m["cantidad_planeada"] or 0))
        precio_txt = _fmt_precio(precio_u) if precio_u > 0 else "—"
        subtotal_txt = _fmt_precio(precio_u * cantidad) if precio_u > 0 else "—"
        nombre = m["nombre_material"] or "—"
        if m.get("es_externo_nuevo"):
            nombre += " ⬩"   # indicador visual en PDF de material externo nuevo
        data.append([nombre, str(int(cantidad)), precio_txt, subtotal_txt])

    estilos = [
        ("BACKGROUND",    (0, 0), (-1, 0),  AZUL),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
        ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
        ("GRID",          (0, 0), (-1, -1), 0.25, GRIS_CLARO),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]
    # Filas impares con fondo #F5F5F5 (índice 1 = primera fila de datos)
    for i in range(1, len(data)):
        if i % 2 != 0:
            estilos.append(("BACKGROUND", (0, i), (-1, i), FILA_IMPAR))

    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle(estilos))
    return t


def _tabla_conceptos(conceptos: list) -> Table:
    data = [["Concepto", "Monto"]]
    for c in conceptos:
        data.append([c["label"], _fmt_precio(c["monto"]) or "—"])

    estilos = [
        ("BACKGROUND",    (0, 0), (-1, 0),  AZUL),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 11),
        ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
        ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
        ("GRID",          (0, 0), (-1, -1), 0.25, GRIS_CLARO),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
    ]
    for i in range(1, len(data)):
        if i % 2 != 0:
            estilos.append(("BACKGROUND", (0, i), (-1, i), FILA_IMPAR))

    t = Table(data, colWidths=[13 * cm, 4 * cm], hAlign="LEFT")
    t.setStyle(TableStyle(estilos))
    return t


def _caja_total_empresa(monto_str: str) -> Table:
    """Caja destacada azul con el total en grande (PDF empresa)."""
    st_txt = ParagraphStyle(
        "total_box", fontName="Helvetica-Bold", fontSize=16,
        textColor=colors.white, alignment=TA_CENTER,
    )
    t = Table(
        [[Paragraph(f"TOTAL ESTIMADO:  {monto_str}", st_txt)]],
        colWidths=[17 * cm],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), AZUL),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
    ]))
    return t


# ═══════════════════════════════════════════════════════════════════════════════
# PDF CLIENTE: TABLAS Y SECCIÓN FIRMAS
# ═══════════════════════════════════════════════════════════════════════════════
def _tabla_materiales_cliente(materiales: list) -> Table:
    """Tabla simplificada sin precio ni subtotal para el cliente."""
    col_widths = [13 * cm, 4 * cm]
    data = [["Nombre del material", "Cantidad"]]
    for m in materiales:
        cantidad = int(Decimal(str(m["cantidad_planeada"] or 0)))
        data.append([m["nombre_material"] or "—", str(cantidad)])

    estilos = [
        ("BACKGROUND",    (0, 0), (-1, 0),  AZUL),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
        ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
        ("GRID",          (0, 0), (-1, -1), 0.25, GRIS_CLARO),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        if i % 2 != 0:
            estilos.append(("BACKGROUND", (0, i), (-1, i), FILA_IMPAR))

    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle(estilos))
    return t


def _seccion_firmas(st: dict) -> list:
    """Dos líneas de firma al final del PDF cliente."""
    t = Table(
        [
            ["_" * 38, "_" * 38],
            [
                Paragraph("Firma del cliente", st["firma_lbl"]),
                Paragraph("Firma ServiElec", st["firma_lbl"]),
            ],
        ],
        colWidths=[8.5 * cm, 8.5 * cm],
        hAlign="LEFT",
    )
    t.setStyle(TableStyle([
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [Spacer(1, 2 * cm), t]


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRUCTOR PDF EMPRESA
# ═══════════════════════════════════════════════════════════════════════════════
def _construir_empresa(proyecto, materiales: list, st: dict) -> list:
    e = []

    # 1. Header
    e += _header(st, "Reporte de Proyecto")

    # 2. Resumen
    e += _bloque_resumen(proyecto, st)

    # 3. Detalle del proyecto (campos dinámicos)
    e.append(Paragraph("Detalle del proyecto", st["seccion"]))
    e.append(_hr())
    e += _bullets_campos(proyecto, CAMPOS_DETALLE_EMPRESA, st)

    # Estado con color
    if proyecto.estado:
        e.append(Paragraph(
            f"•  <b>Estado:</b>  {_estado_markup(proyecto.estado)}", st["bullet"]
        ))

    # Duración estimada (calculada)
    if proyecto.fecha_inicio and proyecto.fecha_termino_maximo:
        dias = (proyecto.fecha_termino_maximo - proyecto.fecha_inicio).days
        if dias > 0:
            plural = "día" if dias == 1 else "días"
            e.append(Paragraph(
                f"•  <b>Duración estimada:</b>  {dias} {plural}", st["bullet"]
            ))

    # Cotización WhatsApp
    e.append(_bullet_cotizacion_wsp(proyecto, st))
    e.append(Spacer(1, 0.4 * cm))

    # 4. Observaciones (sección propia)
    e += _seccion_observaciones(proyecto, st)

    # 5. Datos WhatsApp (solo si es proyecto de chatbot)
    e += _seccion_whatsapp(proyecto, st)

    # 6. Materiales
    e.append(Paragraph("Materiales asignados", st["seccion"]))
    e.append(_hr())
    if not materiales:
        e.append(Paragraph("No hay materiales registrados.", st["sin_dat"]))
    else:
        e.append(_tabla_materiales_empresa(materiales))
    e.append(Spacer(1, 0.6 * cm))

    # 7. Costo estimado (extensible)
    e.append(Paragraph("Costo estimado", st["seccion"]))
    e.append(_hr())

    total_materiales = sum(
        Decimal(str(m["precio_unitario"] or 0)) * Decimal(str(m["cantidad_planeada"] or 0))
        for m in materiales
    )

    # Para agregar bencina, mano de obra, beneficio empresa, etc. en el futuro:
    # agrega un dict {"label": "...", "monto": Decimal(...)} aquí.
    conceptos_costo = [
        {"label": "Materiales", "monto": total_materiales},
    ]

    total_general = sum(c["monto"] for c in conceptos_costo)

    e.append(_tabla_conceptos(conceptos_costo))

    # Margen estimado (si hay presupuesto_final)
    if proyecto.presupuesto_final and Decimal(str(proyecto.presupuesto_final)) > 0:
        pf = Decimal(str(proyecto.presupuesto_final))
        if total_materiales > 0:
            margen = ((pf - total_materiales) / pf) * 100
            e.append(Spacer(1, 0.2 * cm))
            e.append(Paragraph(
                f"•  <b>Margen estimado:</b>  {float(margen):.1f}%", st["bullet"]
            ))

    # Caja destacada TOTAL
    e.append(Spacer(1, 0.4 * cm))
    e.append(_caja_total_empresa(_fmt_precio(total_general) or "$0"))

    return e


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRUCTOR PDF CLIENTE
# ═══════════════════════════════════════════════════════════════════════════════
def _construir_cliente(proyecto, materiales: list, st: dict) -> list:
    e = []

    # 1. Header
    e += _header(st, "Resumen de Servicio")

    # 2. Resumen
    e += _bloque_resumen(proyecto, st)

    # 3. Detalle (campos visibles para cliente)
    e.append(Paragraph("Detalle del servicio", st["seccion"]))
    e.append(_hr())
    e += _bullets_campos(proyecto, CAMPOS_DETALLE_CLIENTE, st)

    # Estado solo si está finalizado
    if proyecto.estado == "finalizado":
        e.append(Paragraph(
            f"•  <b>Estado:</b>  {_estado_markup('finalizado')}", st["bullet"]
        ))

    # Cotización WhatsApp
    e.append(_bullet_cotizacion_wsp(proyecto, st))
    e.append(Spacer(1, 0.4 * cm))

    # 4. Observaciones (sección propia)
    e += _seccion_observaciones(proyecto, st)

    # 5. Materiales (sin precios)
    e.append(Paragraph("Materiales del servicio", st["seccion"]))
    e.append(_hr())
    if not materiales:
        e.append(Paragraph("No hay materiales registrados.", st["sin_dat"]))
    else:
        e.append(_tabla_materiales_cliente(materiales))
    e.append(Spacer(1, 0.6 * cm))

    # 6. Total (sobrio, sin caja azul)
    monto_total = proyecto.presupuesto_final or proyecto.presupuesto_estimado
    if monto_total:
        e.append(Paragraph("Total del servicio", st["seccion"]))
        e.append(_hr())
        st_total = ParagraphStyle(
            "cli_total", fontName="Helvetica-Bold", fontSize=13,
            spaceAfter=6, leftIndent=8,
        )
        e.append(Paragraph(f"Total: {_fmt_precio(monto_total)}", st_total))
        e.append(Spacer(1, 0.3 * cm))

    # 7. Firmas
    e += _seccion_firmas(st)

    return e


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES PÚBLICAS
# ═══════════════════════════════════════════════════════════════════════════════
def _build_pdf(contenido: list) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
    )
    doc.build(
        contenido,
        canvasmaker=_FooterCanvas,
        onFirstPage=_dibujar_fondo,
        onLaterPages=_dibujar_fondo,
    )
    buffer.seek(0)
    return buffer.read()


def generar_pdf_proyecto(proyecto_id: str, db: Session) -> bytes:
    """PDF interno (empresa) con todos los campos, costos y margen."""
    proyecto = obtener_proyecto(db, proyecto_id)
    materiales = obtener_materiales_planeados(db, proyecto_id)
    st = _estilos()
    return _build_pdf(_construir_empresa(proyecto, materiales, st))


def generar_pdf_cliente(proyecto_id: str, db: Session) -> bytes:
    """PDF externo (cliente) sin precios unitarios ni margen."""
    proyecto = obtener_proyecto(db, proyecto_id)
    materiales = obtener_materiales_planeados(db, proyecto_id)
    st = _estilos()
    return _build_pdf(_construir_cliente(proyecto, materiales, st))
