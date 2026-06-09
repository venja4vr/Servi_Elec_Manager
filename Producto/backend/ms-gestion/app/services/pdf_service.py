"""
Servicio de generación de PDF para proyectos.

Extensibilidad:
- Campos del proyecto: agrega una línea a CAMPOS_DETALLE para que aparezca
  automáticamente en el PDF sin tocar el template.
- Conceptos de costo: agrega un dict a la lista `conceptos_costo` dentro de
  _construir_contenido() para que aparezca en la tabla de costos.
"""

from io import BytesIO
from datetime import datetime
from decimal import Decimal

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas as pdf_canvas
from sqlalchemy.orm import Session

from app.services.proyecto_service import obtener_proyecto, obtener_materiales_planeados


# ─── Paleta ───────────────────────────────────────────────────────────────────
AZUL = colors.HexColor("#0072CE")
GRIS = colors.HexColor("#888888")
GRIS_CLARO = colors.HexColor("#CCCCCC")
AZUL_CLARO = colors.HexColor("#E6F3FF")
FILA_PAR = colors.HexColor("#F2F8FF")


# ─── Formatters ───────────────────────────────────────────────────────────────
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
    return {
        "pendiente": "Pendiente",
        "en_curso": "En curso",
        "finalizado": "Finalizado",
        "cancelado": "Cancelado",
    }.get(valor, valor)


# ─── Campos dinámicos del proyecto ───────────────────────────────────────────
# Agrega una línea aquí (campo, etiqueta, formatter) para que el campo aparezca
# automáticamente en el PDF. Los campos con valor None/vacío se omiten solos.
CAMPOS_DETALLE = [
    ("tipo_proyecto",        "Tipo de servicio",      str),
    ("nombre_cliente",       "Cliente",               str),
    ("telefono_cliente",     "Teléfono",              str),
    ("direccion_cliente",    "Dirección",             str),
    ("estado",               "Estado",                _fmt_estado),
    ("fecha_inicio",         "Fecha de inicio",       _fmt_fecha),
    ("fecha_termino_maximo", "Fecha de término máx.", _fmt_fecha),
    ("presupuesto_estimado", "Presupuesto estimado",  _fmt_precio),
    ("presupuesto_final",    "Presupuesto final",     _fmt_precio),
    ("observaciones",        "Observaciones",         str),
]


# ─── Footer con "Página X de Y" ──────────────────────────────────────────────
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


# ─── Estilos ──────────────────────────────────────────────────────────────────
def _estilos() -> dict:
    return {
        "logo":    ParagraphStyle("logo",    fontName="Helvetica-Bold", fontSize=28,
                                  textColor=AZUL, spaceAfter=2),
        "tagline": ParagraphStyle("tagline", fontName="Helvetica",      fontSize=10,
                                  textColor=GRIS, spaceAfter=8),
        "titulo":  ParagraphStyle("titulo",  fontName="Helvetica-Bold", fontSize=14,
                                  spaceAfter=12),
        "info":    ParagraphStyle("info",    fontName="Helvetica",      fontSize=10,
                                  spaceAfter=3),
        "seccion": ParagraphStyle("seccion", fontName="Helvetica-Bold", fontSize=12,
                                  textColor=AZUL, spaceBefore=16, spaceAfter=6),
        "bullet":  ParagraphStyle("bullet",  fontName="Helvetica",      fontSize=11,
                                  spaceAfter=5, leftIndent=8),
        "sin_mat": ParagraphStyle("sin_mat", fontName="Helvetica",      fontSize=11,
                                  textColor=GRIS, spaceAfter=4, leftIndent=8),
    }


def _hr(color=GRIS_CLARO, grosor=0.5):
    return HRFlowable(width="100%", thickness=grosor, color=color, spaceAfter=6, spaceBefore=2)


# ─── Construcción del documento ───────────────────────────────────────────────
def _construir_contenido(proyecto, materiales: list, st: dict) -> list:
    e = []

    # ── 1. Header ─────────────────────────────────────────────────────────────
    e.append(Paragraph("ServiElec", st["logo"]))
    e.append(Paragraph("Servicios Eléctricos Profesionales", st["tagline"]))
    e.append(Paragraph("Reporte de Proyecto", st["titulo"]))
    e.append(_hr(AZUL, 1))
    e.append(Spacer(1, 0.3 * cm))

    # ── 2. Bloque resumen ─────────────────────────────────────────────────────
    codigo = f"PRY-{proyecto.id_proyecto[:8].upper()}"
    e.append(Paragraph(f"<b>Código:</b>  {codigo}", st["info"]))
    e.append(Paragraph(f"<b>Nombre:</b>  {proyecto.nombre_proyecto}", st["info"]))
    e.append(Paragraph(f"<b>Cliente:</b>  {proyecto.nombre_cliente}", st["info"]))
    if proyecto.fecha_inicio:
        e.append(Paragraph(f"<b>Fecha de inicio:</b>  {_fmt_fecha(proyecto.fecha_inicio)}", st["info"]))
    e.append(Spacer(1, 0.4 * cm))
    e.append(_hr())

    # ── 3. Detalle del proyecto (campos dinámicos) ────────────────────────────
    e.append(Paragraph("Detalle del proyecto", st["seccion"]))
    e.append(_hr())

    for campo, etiqueta, formatter in CAMPOS_DETALLE:
        valor = getattr(proyecto, campo, None)
        if valor is None or valor == "":
            continue
        texto = formatter(valor)
        if not texto:
            continue
        e.append(Paragraph(f"•  <b>{etiqueta}:</b>  {texto}", st["bullet"]))

    # Cotización WhatsApp
    es_chatbot = proyecto.tipo_proyecto == "Chatbot"
    if es_chatbot and proyecto.presupuesto_estimado is not None:
        cotizacion_txt = _fmt_precio(proyecto.presupuesto_estimado)
    else:
        cotizacion_txt = "No califica"
    e.append(Paragraph(f"•  <b>Cotización inicial WhatsApp:</b>  {cotizacion_txt}", st["bullet"]))

    e.append(Spacer(1, 0.5 * cm))

    # ── 4. Materiales asignados ───────────────────────────────────────────────
    e.append(Paragraph("Materiales asignados", st["seccion"]))
    e.append(_hr())

    if not materiales:
        e.append(Paragraph("No hay materiales registrados para este proyecto.", st["sin_mat"]))
    else:
        ancho_tabla = 17 * cm
        col_widths = [8 * cm, 2 * cm, 3.5 * cm, 3.5 * cm]

        data = [["Nombre", "Cant.", "Precio unit.", "Subtotal"]]
        for m in materiales:
            precio_u = Decimal(str(m["precio_unitario"] or 0))
            cantidad = Decimal(str(m["cantidad_planeada"] or 0))
            subtotal = precio_u * cantidad
            data.append([
                m["nombre_material"] or "—",
                str(int(cantidad)),
                _fmt_precio(precio_u),
                _fmt_precio(subtotal),
            ])

        tabla = Table(data, colWidths=col_widths, hAlign="LEFT")
        tabla.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0),  AZUL),
            ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
            ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 10),
            ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
            ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, FILA_PAR]),
            ("GRID",          (0, 0), (-1, -1), 0.25, GRIS_CLARO),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ]))
        e.append(tabla)

    e.append(Spacer(1, 0.6 * cm))

    # ── 5. Costo estimado (extensible) ───────────────────────────────────────
    e.append(Paragraph("Costo estimado", st["seccion"]))
    e.append(_hr())

    total_materiales = sum(
        Decimal(str(m["precio_unitario"] or 0)) * Decimal(str(m["cantidad_planeada"] or 0))
        for m in materiales
    )

    # Para agregar bencina, mano de obra, etc. en el futuro: agrega un dict aquí.
    conceptos_costo = [
        {"label": "Materiales", "monto": total_materiales},
    ]

    total_general = sum(c["monto"] for c in conceptos_costo)

    data_costos = [["Concepto", "Monto"]]
    for concepto in conceptos_costo:
        data_costos.append([concepto["label"], _fmt_precio(concepto["monto"])])
    data_costos.append(["TOTAL", _fmt_precio(total_general)])

    tabla_costos = Table(data_costos, colWidths=[13 * cm, 4 * cm], hAlign="LEFT")
    tabla_costos.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  AZUL),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 11),
        ("ALIGN",         (0, 0), (0, -1),  "LEFT"),
        ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -2), [colors.white, FILA_PAR]),
        # Fila TOTAL
        ("BACKGROUND",    (0, -1), (-1, -1), AZUL_CLARO),
        ("FONTNAME",      (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, -1), (-1, -1), AZUL),
        ("GRID",          (0, 0), (-1, -1), 0.25, GRIS_CLARO),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
    ]))
    e.append(tabla_costos)

    return e


# ─── Función pública ──────────────────────────────────────────────────────────
def generar_pdf_proyecto(proyecto_id: str, db: Session) -> bytes:
    """Genera el PDF de un proyecto y devuelve los bytes resultantes."""
    proyecto = obtener_proyecto(db, proyecto_id)
    materiales = obtener_materiales_planeados(db, proyecto_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
    )

    st = _estilos()
    contenido = _construir_contenido(proyecto, materiales, st)
    doc.build(contenido, canvasmaker=_FooterCanvas)

    buffer.seek(0)
    return buffer.read()
