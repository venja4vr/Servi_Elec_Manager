import re
from datetime import date, timedelta
from typing import Optional, Tuple, List
from app.models.sesion import SesionChat, EstadoChat
from app.services import sesion_service, gestion_client, whatsapp_service, groq_service


# Caché de categorías dinámicas (se carga desde ms-gestion al primer uso)
_categorias_cache: dict | None = None
_categorias_ts: float = 0
_CATEGORIAS_TTL = 300  # 5 minutos


def _obtener_categorias() -> dict:
    """Devuelve {str_num: nombre} cargado desde la API con TTL de 5 min."""
    import time
    global _categorias_cache, _categorias_ts
    ahora = time.time()
    if _categorias_cache is None or (ahora - _categorias_ts) > _CATEGORIAS_TTL:
        data = gestion_client.obtener_categorias_con_plantillas()
        if data:
            _categorias_cache = {str(i + 1): c["nombre"] for i, c in enumerate(data)}
            _categorias_ts = ahora
    return _categorias_cache or {}


# Palabras que reinician la conversación desde cualquier estado
PALABRAS_REINICIO = {"menu", "menú", "inicio", "cancelar", "salir", "home", "exit", "fin"}

# Palabras para retroceder una pregunta (solo en RECOPILANDO_DATOS)
PALABRAS_VOLVER = {
    "volver", "atras", "atrás", "anterior", "regresar",
    "corregir", "error", "equivoque", "equivoqué", "me equivoque",
}

# Respuestas para la pregunta de precio
PALABRAS_PRECIO_CARO = {"si", "sí", "claro", "mucho", "caro", "demasiado"}
PALABRAS_PRECIO_OK   = {"no", "esta bien", "está bien", "ok", "perfecto", "dale"}


# Las 38 comunas de la Quinta Región válidas
COMUNAS_QUINTA_REGION = {
    "valparaíso", "valparaiso", "viña del mar", "vina del mar",
    "quilpué", "quilpue", "villa alemana", "concón", "concon",
    "quintero", "puchuncaví", "puchuncavi", "casablanca",
    "san antonio", "santo domingo", "cartagena", "el tabo",
    "el quisco", "algarrobo", "san pedro", "el quisco",
    "quillota", "la calera", "la cruz", "nogales", "hijuelas",
    "limache", "olmué", "olmue", "los andes", "san esteban",
    "calle larga", "rinconada", "san felipe", "putaendo",
    "santa maría", "santa maria", "panquehue", "llaillay",
    "catemu", "isla de pascua", "juan fernández", "juan fernandez",
}

# Meses del año en español
MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

# Días de la semana para ignorarlos en expresiones como "el martes 5 de julio"
DIAS_SEMANA = {
    "lunes", "martes", "miercoles", "miércoles",
    "jueves", "viernes", "sabado", "sábado", "domingo",
}

# Error de formato para fecha_preferida
_FECHA_ERROR_MSG = (
    "No reconozco esa fecha. Ejemplos válidos: 15/01/2027, 15-01-27, "
    "mañana, en 5 días, 10 de julio, el martes 5 de diciembre.\n\n"
    "---\n"
    "Escribe *volver* para la pregunta anterior\n"
    "Escribe *menú* para cancelar y volver al inicio"
)

# Las preguntas de la ficha, en orden
PREGUNTAS_FICHA: List[Tuple[str, str]] = [
    ("nombre_cliente",  "¿Cuál es tu nombre completo?"),
    ("direccion",       "¿Cuál es la calle y número donde se realizará el trabajo?"),
    ("comuna",          "¿En qué comuna? (debe ser de la Quinta Región)"),
    ("fecha_preferida", "¿Tienes alguna fecha preferida para el inicio? (o escribe sin preferencia)"),
    ("dias_estimados",  "¿Cuántos días estimas que tomará el trabajo? (escribe un número del 1 al 30)"),
    ("horas_diarias",   "¿Cuántas horas al día se trabajará? Para servicios puntuales (ej: cambiar interruptores) suele ser 1-2h. Para trabajos completos 8h. Si dudas, escribe 8."),
    ("observaciones",   "¿Alguna observación adicional? (o escribe ninguna)"),
]


# ── Parser de fechas ─────────────────────────────────────────

def _parsear_fecha(texto: str) -> tuple:
    """
    Interpreta texto como fecha y devuelve (resultado, error).
    resultado: "sin preferencia" | "YYYY-MM-DD" | None
    error:     None si ok, string con mensaje de error si falla.
    """
    t = texto.strip().lower()

    # Sin preferencia (pass-through)
    _sin_pref = {"sin preferencia", "sin fecha", "no tengo preferencia",
                 "cuando puedan", "cuando sea", "sin preferencia."}
    if t in _sin_pref or t.startswith("sin preferencia"):
        return ("sin preferencia", None)

    hoy = date.today()
    max_futuro = hoy + timedelta(days=180)

    def _validar(d: date):
        if d < hoy:
            return (None, "No puedo agendar para fechas pasadas. " + _FECHA_ERROR_MSG.split("\n")[0])
        if d > max_futuro:
            return (None, "La fecha no puede ser a más de 6 meses en el futuro. " + _FECHA_ERROR_MSG.split("\n")[0])
        return (d.strftime("%Y-%m-%d"), None)

    # ── Palabras clave relativas ─────────────────────────────
    if t == "hoy":
        return _validar(hoy)
    if t in ("mañana", "manana"):
        return _validar(hoy + timedelta(days=1))
    if t in ("pasado mañana", "pasado manana"):
        return _validar(hoy + timedelta(days=2))
    if t in ("próxima semana", "proxima semana"):
        return _validar(hoy + timedelta(days=7))

    # "en X días / en X dias"
    m = re.match(r"^en\s+(\d+)\s+d[ií]as?$", t)
    if m:
        x = int(m.group(1))
        if not (1 <= x <= 60):
            return (None, "El número de días debe estar entre 1 y 60.")
        return _validar(hoy + timedelta(days=x))

    # ── Formatos numéricos ───────────────────────────────────
    # DD/MM/YYYY | DD-MM-YYYY | DD MM YYYY
    m = re.match(r"^(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{4})$", t)
    if m:
        try:
            return _validar(date(int(m.group(3)), int(m.group(2)), int(m.group(1))))
        except ValueError:
            return (None, _FECHA_ERROR_MSG)

    # DD/MM/YY | DD-MM-YY (asume 20XX)
    m = re.match(r"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})$", t)
    if m:
        try:
            return _validar(date(2000 + int(m.group(3)), int(m.group(2)), int(m.group(1))))
        except ValueError:
            return (None, _FECHA_ERROR_MSG)

    # ── Formatos con nombre de mes ────────────────────────────
    # Quitar prefijo "el <dia_semana> " o "<dia_semana> "
    t_proc = t
    for ds in DIAS_SEMANA:
        t_proc = re.sub(rf"^el\s+{ds}\s+", "", t_proc)
        t_proc = re.sub(rf"^{ds}\s+", "", t_proc)

    # "10 de julio" | "10 de julio 2026"
    m = re.match(r"^(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+(\d{4}))?$", t_proc)
    if m:
        mes_str = m.group(2)
        if mes_str in MESES:
            try:
                anio = int(m.group(3)) if m.group(3) else hoy.year
                d = date(anio, MESES[mes_str], int(m.group(1)))
                # Si el año implícito ya pasó, probar siguiente año
                if not m.group(3) and d < hoy:
                    d = date(hoy.year + 1, MESES[mes_str], int(m.group(1)))
                return _validar(d)
            except ValueError:
                return (None, _FECHA_ERROR_MSG)

    # "10 julio" | "10 julio 2026"
    m = re.match(r"^(\d{1,2})\s+([a-záéíóúñ]+)(?:\s+(\d{4}))?$", t_proc)
    if m:
        mes_str = m.group(2)
        if mes_str in MESES:
            try:
                anio = int(m.group(3)) if m.group(3) else hoy.year
                d = date(anio, MESES[mes_str], int(m.group(1)))
                if not m.group(3) and d < hoy:
                    d = date(hoy.year + 1, MESES[mes_str], int(m.group(1)))
                return _validar(d)
            except ValueError:
                return (None, _FECHA_ERROR_MSG)

    return (None, _FECHA_ERROR_MSG)


# ── Hooks de IA (red de seguridad Groq) ──────────────────────

def _hook_coherencia(sesion: SesionChat, texto: str) -> Optional[str]:
    """
    Hook 1: si la validación de un campo numérico falla y el texto parece lenguaje libre,
    consulta IA para detectar emergencias, confusiones u hostilidad y responder con empatía.
    Retorna mensaje de respuesta o None si IA no sugiere nada relevante.
    """
    try:
        _, pregunta = PREGUNTAS_FICHA[sesion.paso_recopilacion]
        contexto = f"Servicio solicitado: {sesion.nombre_servicio or 'no seleccionado'}"
        resultado = groq_service.analizar_coherencia(pregunta, texto, contexto)
        if (
            not resultado.get("coherente")
            and resultado.get("tipo_problema")
            and resultado.get("confianza", 0) >= 0.5
            and resultado.get("sugerencia_respuesta")
        ):
            return (
                f"{resultado['sugerencia_respuesta']}\n\n"
                f"{pregunta}\n\n"
                "---\n"
                "Escribe *volver* para la pregunta anterior\n"
                "Escribe *menú* para cancelar y volver al inicio"
            )
    except Exception:
        pass
    return None


def _hook_menu_principal(sesion: SesionChat, texto: str) -> Optional[str]:
    """
    Hook para el menú principal: si el cliente escribe texto libre con más de 1 palabra,
    clasifica su intención y responde de forma empática sin requerir que escriba 1/2/3.
    """
    try:
        resultado = groq_service.clasificar_intencion(texto)
        confianza = resultado.get("confianza", 0)
        if confianza < 0.6:
            return None

        intencion_menu = resultado.get("intencion_menu")
        mensaje_empatico = resultado.get("mensaje_empatico") or ""

        if intencion_menu == "cotizacion" and confianza >= 0.7:
            sesion.estado = EstadoChat.ESPERANDO_CATEGORIA
            sesion_service.guardar_sesion(sesion)
            saludo = mensaje_empatico or "Entendido, con gusto te ayudo con tu cotización. 😊"
            return f"🤖 {saludo}\n\n{_menu_categorias()}"

        if intencion_menu == "reunion" and confianza >= 0.7:
            saludo = mensaje_empatico or "Claro, me alegra que quieras contactarnos."
            return (
                f"🤖 {saludo}\n\n"
                "📅 *Agendar reunión*\n\n"
                "Contáctanos directamente:\n\n"
                "📞 +56 9 XXXX XXXX\n"
                "📧 contacto@servielec.cl\n\n"
                "_Escribe *menú* para volver._"
            )

        if intencion_menu == "info_empresa" and confianza >= 0.7:
            saludo = mensaje_empatico or "¡Gracias por tu interés en Servi Elec!"
            return (
                f"🤖 {saludo}\n\n"
                "🏢 *Sobre Servi Elec*\n\n"
                "Empresa de instalaciones eléctricas con más de 10 años "
                "de experiencia en el sector residencial e industrial.\n\n"
                "Trabajamos bajo la normativa RIC vigente.\n\n"
                "_Escribe *menú* para volver._"
            )

        # Categoría de servicio detectada en el menú principal
        cat_sugerida = resultado.get("categoria_sugerida")
        if cat_sugerida and confianza >= 0.7:
            saludo = mensaje_empatico or f"Parece que buscas servicios de _{cat_sugerida}_."
            sesion.estado = EstadoChat.ESPERANDO_CATEGORIA
            sesion_service.guardar_sesion(sesion)
            return f"🤖 {saludo}\n\n{_menu_categorias()}"
    except Exception:
        pass
    return None


def _hook_clasificar_intencion(sesion: SesionChat, texto: str, cats: dict) -> Optional[str]:
    """
    Hook 2: si el cliente escribe texto libre (≥4 palabras) en el menú de categorías,
    la IA intenta clasificar su intención y selecciona la categoría automáticamente
    si la confianza supera 0.8.
    Retorna el menú de servicios de la categoría detectada, o None.
    """
    try:
        resultado = groq_service.clasificar_intencion(texto)
        cat_sugerida = resultado.get("categoria_sugerida")
        if not cat_sugerida or resultado.get("confianza", 0) < 0.8:
            return None

        for _, nombre in cats.items():
            if nombre.lower() == cat_sugerida.lower():
                plantillas = gestion_client.obtener_plantillas_por_categoria(nombre)
                if not plantillas:
                    return None
                texto_menu, mapa = _menu_servicios(plantillas, nombre)
                sesion.categoria_elegida = nombre
                sesion.mapa_servicios = mapa
                sesion.estado = EstadoChat.ESPERANDO_SERVICIO
                sesion_service.guardar_sesion(sesion)
                palabras = resultado.get("palabras_clave", [])
                descripcion = ", ".join(palabras[:3]) if palabras else texto[:40]
                return f"🤖 Entendí que buscas: _{descripcion}_\n\n{texto_menu}"
    except Exception:
        pass
    return None


def _hook_extraer_datos(sesion: SesionChat, texto: str) -> Optional[str]:
    """
    Hook 3: si el cliente envía un mensaje largo (>50 chars) en los primeros pasos,
    la IA intenta extraer múltiples campos a la vez y avanza la sesión.
    Solo activa si extrae ≥2 campos válidos. Retorna siguiente pregunta o None.
    """
    try:
        datos = groq_service.extraer_datos_libres(texto)

        MAPA = [
            ("nombre_cliente",  "nombre"),
            ("direccion",       "direccion"),
            ("comuna",          "comuna"),
            ("fecha_preferida", "fecha_preferida"),
        ]

        extraidos = 0
        max_paso_lleno = sesion.paso_recopilacion - 1

        for campo_sesion, campo_groq in MAPA:
            valor = datos.get(campo_groq)
            if not valor:
                continue
            paso_campo = next(
                (i for i, (c, _) in enumerate(PREGUNTAS_FICHA) if c == campo_sesion),
                None,
            )
            if paso_campo is None or paso_campo < sesion.paso_recopilacion:
                continue

            if campo_sesion == "comuna":
                valor_lower = valor.strip().lower()
                if valor_lower not in COMUNAS_QUINTA_REGION:
                    continue
                valor = valor.strip().title()
                grupo = gestion_client.obtener_comuna_grupo_por_nombre(valor_lower)
                sesion.comuna_grupo_id = grupo.get("id_cg") if grupo else None

            setattr(sesion, campo_sesion, valor)
            if paso_campo > max_paso_lleno:
                max_paso_lleno = paso_campo
            extraidos += 1

        if extraidos < 2:
            return None

        sesion.paso_recopilacion = max_paso_lleno + 1

        if sesion.paso_recopilacion >= len(PREGUNTAS_FICHA):
            sesion_service.guardar_sesion(sesion)
            return _crear_proyecto(sesion)

        _, siguiente = PREGUNTAS_FICHA[sesion.paso_recopilacion]
        sesion_service.guardar_sesion(sesion)
        return (
            f"🤖 Capturé {extraidos} datos de tu mensaje. Continuamos:\n\n"
            f"{siguiente}\n\n"
            "---\n"
            "Escribe *volver* para la pregunta anterior\n"
            "Escribe *menú* para cancelar y volver al inicio"
        )
    except Exception:
        pass
    return None


# ── Textos del bot ────────────────────────────────────────────


# Funciones que generan los mensajes del bot
# Están separadas de la lógica para que sea fácil editar los textos
def _menu_principal() -> str:
    # Mensaje de bienvenida con las 3 opciones principales
    return (
        "━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ *Bienvenido a Servi Elec* ⚡\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "Seleccione una opción:\n\n"
        "1️⃣  Cotización\n"
        "2️⃣  Agendar reunión\n"
        "3️⃣  Sobre nosotros\n\n"
        "_Escribe el número de tu elección_"
    )


def _menu_categorias() -> str:
    cats = _obtener_categorias()
    if not cats:
        return (
            "📂 *Seleccione una categoría:*\n\n"
            "_(Categorías no disponibles en este momento. Intente más tarde.)_\n\n"
            "_Escribe *menú* para volver al inicio_"
        )
    emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]
    lineas = ["📂 *Seleccione una categoría:*\n"]
    for i, (num, nombre) in enumerate(cats.items()):
        emoji = emojis[i] if i < len(emojis) else f"{num}."
        lineas.append(f"{emoji}  {nombre}")
    lineas.append(f"\n_Escribe el número de tu elección_")
    lineas.append("_Escribe *menú* para volver al inicio_")
    return "\n".join(lineas)


def _menu_servicios(plantillas: list, categoria: str) -> Tuple[str, dict]:
    # plantillas ya viene filtrada por categoría y activa=True desde ms-gestion
    mapa = {str(i + 1): p for i, p in enumerate(plantillas)}

    lineas = [f"🔧 *Servicios — {categoria}:*\n"]
    for num, p in mapa.items():
        lineas.append(f"{num}️⃣  {p['nombre_servicio']}")
    lineas.append("\n_Escribe el número de tu elección_")
    lineas.append("_Escribe *menú* para volver al inicio_")

    return "\n".join(lineas), mapa


def _texto_cotizacion(nombre_servicio: str, cotizacion: dict, bencina_ref: float = None) -> str:
    total = cotizacion.get("total_estimado", 0) or 0
    sin_precio = cotizacion.get("materiales_sin_precio", [])
    materiales = cotizacion.get("materiales", [])

    if not materiales:
        return _texto_sin_precio(nombre_servicio)
    if float(total) == 0 and sin_precio:
        return _texto_sin_precio(nombre_servicio)

    mat_fmt = f"${float(total):,.0f}".replace(",", ".")
    subtotal = float(total)

    lineas = [
        f"📋 *Cotización aproximada — {nombre_servicio}*\n",
        f"🔧 Materiales: *{mat_fmt}*",
    ]

    if bencina_ref is not None:
        benc_fmt = f"${bencina_ref:,.0f}".replace(",", ".")
        lineas.append(f"⛽ Bencina (estimada): *{benc_fmt}*")
        subtotal += bencina_ref

    subtotal_fmt = f"${subtotal:,.0f}".replace(",", ".")
    lineas += [
        "\n────────────────────",
        f"💰 *Subtotal estimado: {subtotal_fmt}*",
        "",
        "⚠️ _El total final incluye además mano de obra que coordinaremos contigo según los días y horas del trabajo. Este precio se confirma tras la visita técnica._",
    ]

    if sin_precio:
        nombres = ", ".join(sin_precio)
        lineas.append(
            f"\n⚠️ Materiales sin precio actualizado: {nombres}.\n"
            "Un administrador completará la cotización al revisar tu solicitud."
        )

    return "\n".join(lineas)


def _pregunta_precio_caro() -> str:
    return (
        "¿Considera que el precio es caro?\n\n"
        "Responda *sí* o *no* para continuar."
    )


def _texto_empatico() -> str:
    return (
        "Entendemos su preocupación. Algunos precios pueden parecer altos por estas razones:\n\n"
        "- Los materiales se cotizan en tiempo real y a veces incluyen productos premium.\n\n"
        "- El precio incluye servicio profesional, traslado del técnico y materiales de calidad.\n\n"
        "- Es una estimación inicial: el precio FINAL se ajusta tras una llamada y posterior visita técnica, "
        "considerando el alcance real del trabajo para que el monto final sea justo para ambas partes.\n\n"
        "- No se asuste si una mantención o instalación tiene un precio que parece irreal. "
        "Continúe respondiendo las preguntas y espere la comunicación de la empresa. "
        "Al ponernos en contacto, podremos manejar correctamente los montos para llegar a un acuerdo apropiado.\n\n"
        "¿Desea continuar con la cotización? Responda *sí* para seguir o *menú* para cancelar."
    )


def _texto_sin_precio(nombre_servicio: str) -> str:
    return (
        f"📋 *{nombre_servicio}*\n\n"
        "Este servicio requiere evaluación personalizada.\n\n"
        "Si desea que un administrador lo contacte escribe *OK*.\n"
        "Para volver al menú escribe *menú*."
    )


def _texto_proyecto_creado(
    nombre_servicio: str,
    nombre_cliente: str,
    materiales_cost: float = 0,
    mot: float = 0,
    dias: int = 0,
    bencina: float = None,
) -> str:
    nombre_txt = f", {nombre_cliente}" if nombre_cliente else ""
    lineas = [
        f"✅ *¡Listo{nombre_txt}!*\n",
        f"Tu solicitud de *{nombre_servicio}* fue registrada.\n",
    ]

    if materiales_cost > 0:
        mat_fmt = f"${materiales_cost:,.0f}".replace(",", ".")
        mot_fmt = f"${mot:,.0f}".replace(",", ".")
        total = materiales_cost + mot + (bencina or 0)

        lineas += [
            "━━━━━━━━━━━━━━━━",
            "*Resumen de costos:*\n",
            f"🔧 Materiales: *{mat_fmt}*",
        ]
        if bencina is not None:
            benc_fmt = f"${bencina:,.0f}".replace(",", ".")
            lineas.append(f"⛽ Bencina ({dias} días): *{benc_fmt}*")
        lineas.append(f"👷 Mano de obra ({dias} días): *{mot_fmt}*")
        total_fmt = f"${total:,.0f}".replace(",", ".")
        lineas += [
            "\n────────────────────",
            f"💰 *TOTAL estimado: {total_fmt}*",
            "",
            "_Precio final se confirma tras visita técnica._\n",
        ]

    lineas += [
        "Un administrador revisará los detalles y te contactará.",
        "_Escribe *menú* si deseas otra consulta._",
    ]
    return "\n".join(lineas)


# ── Motor principal ───────────────────────────────────────────

def procesar_mensaje(telefono: str, texto: str) -> str:
    texto_limpio = texto.strip().lower() # "  HOLA  " → "hola"
    sesion = sesion_service.obtener_sesion(telefono) # Recuperar memoria del cliente
    estado = sesion.estado # ¿En qué paso está?

    # "hola" tiene comportamiento contextual según el estado de la conversación
    if texto_limpio == "hola":
        if estado == EstadoChat.RECOPILANDO_DATOS:
            _, pregunta_actual = PREGUNTAS_FICHA[sesion.paso_recopilacion]
            return f"¡Hola! Aquí sigo 😊 Continuemos con tu solicitud:\n\n{pregunta_actual}"
        if estado == EstadoChat.FINALIZADO:
            sesion_service.reiniciar_sesion(telefono)
            return "¡Hola de nuevo! 👋 Es un gusto atenderte otra vez en Servi Elec.\n\n" + _menu_principal()
        sesion_service.reiniciar_sesion(telefono)
        return "¡Hola! 👋 Es un gusto saludarte. ¿En qué puedo ayudarte hoy?\n\n" + _menu_principal()

    # Reinicio explícito (menú, cancelar, salir, etc.) desde cualquier estado
    if texto_limpio in PALABRAS_REINICIO:
        habia_progreso = estado in (
            EstadoChat.RECOPILANDO_DATOS,
            EstadoChat.COTIZACION_ENVIADA,
            EstadoChat.FINALIZADO,
        )
        sesion_service.reiniciar_sesion(telefono)
        if habia_progreso:
            return "Conversación reiniciada. ¡Empecemos de nuevo!\n\n" + _menu_principal()
        return _menu_principal()

    # Primer mensaje / sesión nueva o expirada
    if estado == EstadoChat.INICIO:
        sesion_service.reiniciar_sesion(telefono)
        return _menu_principal()

    # Retroceder una pregunta (solo durante la recopilación de datos)
    if texto_limpio in PALABRAS_VOLVER and estado == EstadoChat.RECOPILANDO_DATOS:
        if sesion.paso_recopilacion == 0:
            _, pregunta_actual = PREGUNTAS_FICHA[0]
            return (
                "Estás en la primera pregunta, no puedes volver atrás.\n\n"
                "Si quieres cancelar todo escribe *menú*.\n\n"
                f"Continúa respondiendo: {pregunta_actual}"
            )
        sesion.paso_recopilacion -= 1
        campo_anterior, pregunta_anterior = PREGUNTAS_FICHA[sesion.paso_recopilacion]
        setattr(sesion, campo_anterior, None)
        sesion_service.guardar_sesion(sesion)
        return f"Volviendo a la pregunta anterior:\n\n{pregunta_anterior}"

    # ── Menú principal ───────────────────────────────────────
    # El cliente ve: 1-Cotización / 2-Reunión / 3-Nosotros
    if estado == EstadoChat.ESPERANDO_OPCION:
        if texto_limpio in ("1", "cotizacion", "cotización"):
            sesion.estado = EstadoChat.ESPERANDO_CATEGORIA # Avanzar al siguiente estado
            sesion_service.guardar_sesion(sesion) # Guardar el cambio
            return _menu_categorias()
          # ... opciones 2 y 3 ...


        if texto_limpio in ("2", "agendar", "reunion", "reunión"):
            return (
                "📅 *Agendar reunión*\n\n"
                "Contáctanos directamente:\n\n"
                "📞 +56 9 XXXX XXXX\n"
                "📧 contacto@servielec.cl\n\n"
                "_Escribe *menú* para volver._"
            )

        if texto_limpio in ("3", "nosotros", "sobre"):
            return (
                "🏢 *Sobre Servi Elec*\n\n"
                "Empresa de instalaciones eléctricas con más de 10 años "
                "de experiencia en el sector residencial e industrial.\n\n"
                "Trabajamos bajo la normativa RIC vigente.\n\n"
                "_Escribe *menú* para volver._"
            )

        # Hook menú: texto libre con más de 1 palabra → clasificar intención con IA
        if len(texto.strip().split()) > 1:
            respuesta_ia = _hook_menu_principal(sesion, texto)
            if respuesta_ia:
                return respuesta_ia

        return (
            "Disculpa, no logré entender tu mensaje. 😊\n\n"
            "Te muestro las opciones de nuevo:\n\n" + _menu_principal()
        )

    # ── Selección de categoría ───────────────────────────────
    if estado == EstadoChat.ESPERANDO_CATEGORIA:
        cats = _obtener_categorias()
        cat = cats.get(texto_limpio)
        n = len(cats)
        if not cat:
            # Hook 2: texto libre con ≥4 palabras → clasificar intención con IA
            if len(texto.strip().split()) >= 4:
                respuesta_ia = _hook_clasificar_intencion(sesion, texto, cats)
                if respuesta_ia:
                    return respuesta_ia
            opciones = f"1 al {n}" if n > 1 else "1"
            return f"Por favor escribe un número del {opciones}.\n\n{_menu_categorias()}"

        # Traer plantillas activas de la categoría desde ms-gestion
        plantillas = gestion_client.obtener_plantillas_por_categoria(cat)
        if plantillas is None:
            # Error de conexión con ms-gestion
            return (
                "⚠️ No pudimos conectar con el sistema en este momento.\n"
                "Por favor intenta más tarde o escribe *menú*."
            )
        if len(plantillas) == 0:
            return (
                f"Actualmente no hay servicios disponibles en {cat}.\n"
                "Contáctanos directamente para una cotización personalizada.\n\n"
                "_Escribe *menú* para volver._"
            )

        texto_menu, mapa = _menu_servicios(plantillas, cat)
        sesion.categoria_elegida = cat
        sesion.mapa_servicios = mapa
        sesion.estado = EstadoChat.ESPERANDO_SERVICIO
        sesion_service.guardar_sesion(sesion)
        return texto_menu

    # ── Selección de servicio ────────────────────────────────
    if estado == EstadoChat.ESPERANDO_SERVICIO:
        plantilla = sesion.mapa_servicios.get(texto_limpio)
        if not plantilla:
            return "Por favor escribe el número del servicio que deseas."

        sesion.plantilla_id    = plantilla["id_plantilla"]
        sesion.nombre_servicio = plantilla["nombre_servicio"]
        sesion.dias_minimos    = plantilla.get("dias_minimos") or 1
        sesion.horas_minimas   = plantilla.get("horas_minimas") or 1

        # Obtener cotizacion calculada con precios Sodimac actuales
        cotizacion = gestion_client.obtener_cotizacion_plantilla(sesion.plantilla_id)
        if cotizacion is None:
            sesion.precio_estimado = None
            sesion.estado = EstadoChat.COTIZACION_ENVIADA
            sesion_service.guardar_sesion(sesion)
            return _texto_sin_precio(sesion.nombre_servicio)

        total      = cotizacion.get("total_estimado", 0) or 0
        materiales = cotizacion.get("materiales", [])
        sin_precio = cotizacion.get("materiales_sin_precio", [])

        # Sin datos de precio → flujo sin cotización
        if not materiales or (float(total) == 0 and sin_precio):
            sesion.precio_estimado = None
            sesion.estado = EstadoChat.COTIZACION_ENVIADA
            sesion_service.guardar_sesion(sesion)
            return _texto_sin_precio(sesion.nombre_servicio)

        # Con precio → flujo de feedback
        sesion.precio_estimado = float(total) if float(total) > 0 else None
        bencina_ref = gestion_client.obtener_bencina_referencia(dias=5)
        texto_cot = _texto_cotizacion(sesion.nombre_servicio, cotizacion, bencina_ref)
        sesion.cotizacion_texto = texto_cot
        sesion.estado = EstadoChat.PRECIO_FEEDBACK
        sesion_service.guardar_sesion(sesion)
        return texto_cot + "\n\n" + _pregunta_precio_caro()

    # ── Feedback de precio (¿le parece caro?) ───────────────
    if estado == EstadoChat.PRECIO_FEEDBACK:
        if texto_limpio in PALABRAS_VOLVER:
            texto_cot = sesion.cotizacion_texto or ""
            return texto_cot + "\n\n" + _pregunta_precio_caro()

        if texto_limpio in PALABRAS_PRECIO_CARO:
            sesion.estado = EstadoChat.PRECIO_FEEDBACK_EMPATICO
            sesion_service.guardar_sesion(sesion)
            return _texto_empatico()

        if texto_limpio in PALABRAS_PRECIO_OK:
            sesion.estado = EstadoChat.RECOPILANDO_DATOS
            sesion.paso_recopilacion = 0
            sesion_service.guardar_sesion(sesion)
            _, pregunta = PREGUNTAS_FICHA[0]
            return (
                f"¡Perfecto! Necesito algunos datos.\n\n{pregunta}\n\n"
                "---\n"
                "Escribe *volver* para la pregunta anterior\n"
                "Escribe *menú* para cancelar y volver al inicio"
            )

        return _pregunta_precio_caro()

    # ── Tras explicación empática: sí → continuar ────────────
    if estado == EstadoChat.PRECIO_FEEDBACK_EMPATICO:
        if texto_limpio in PALABRAS_VOLVER:
            sesion.estado = EstadoChat.PRECIO_FEEDBACK
            sesion_service.guardar_sesion(sesion)
            return _pregunta_precio_caro()

        if texto_limpio in ("si", "sí"):
            sesion.estado = EstadoChat.RECOPILANDO_DATOS
            sesion.paso_recopilacion = 0
            sesion_service.guardar_sesion(sesion)
            _, pregunta = PREGUNTAS_FICHA[0]
            return (
                f"¡Perfecto! Necesito algunos datos.\n\n{pregunta}\n\n"
                "---\n"
                "Escribe *volver* para la pregunta anterior\n"
                "Escribe *menú* para cancelar y volver al inicio"
            )

        return "Responda *sí* para continuar o *menú* para cancelar."

    # ── Cliente confirma con OK ──────────────────────────────
    if estado == EstadoChat.COTIZACION_ENVIADA:
        if texto_limpio not in ("ok", "si", "sí", "acepto", "confirmar"):
            return "Para continuar escribe *OK*.\nPara volver escribe *menú*."

        sesion.estado = EstadoChat.RECOPILANDO_DATOS
        sesion.paso_recopilacion = 0
        sesion_service.guardar_sesion(sesion)
        _, pregunta = PREGUNTAS_FICHA[0]
        return (
            f"¡Perfecto! Necesito algunos datos.\n\n{pregunta}\n\n"
            "---\n"
            "Escribe *volver* para la pregunta anterior\n"
            "Escribe *menú* para cancelar y volver al inicio"
        )

# ── Recopilación de datos de la ficha ────────────────────
    if estado == EstadoChat.RECOPILANDO_DATOS:
        campo, _ = PREGUNTAS_FICHA[sesion.paso_recopilacion]

        # Hook 3: mensaje largo en pasos iniciales → intentar extraer múltiples campos
        if len(texto.strip()) > 50 and sesion.paso_recopilacion < 4:
            respuesta_ia = _hook_extraer_datos(sesion, texto)
            if respuesta_ia:
                return respuesta_ia

        # Validación contextual para nombre_cliente
        if campo == "nombre_cliente":
            texto_stripped = texto.strip()
            palabras = texto_stripped.split()
            FRASES_NO_NOMBRE = {
                "necesito", "ayuda", "hola", "no", "si", "sí", "ok", "help",
                "quiero", "tengo", "hay", "me", "mi", "necesitas", "puede",
                "urgente", "por", "favor", "gracias",
            }
            tiene_numero = any(c.isdigit() for c in texto_stripped)
            es_muy_corto = len(palabras) < 2
            parece_frase = palabras[0].lower() in FRASES_NO_NOMBRE if palabras else True
            if tiene_numero or parece_frase or es_muy_corto:
                respuesta_ia = _hook_coherencia(sesion, texto_stripped)
                if respuesta_ia:
                    return respuesta_ia
                _, pregunta = PREGUNTAS_FICHA[sesion.paso_recopilacion]
                return (
                    "Disculpa, no logré identificar tu nombre. 😊 "
                    "Necesito tu nombre completo (nombre y apellido). "
                    "Por ejemplo: *Juan Pérez*\n\n"
                    f"{pregunta}\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            setattr(sesion, campo, texto_stripped)

        # Validación contextual para dirección
        elif campo == "direccion":
            texto_stripped = texto.strip()
            tiene_numero = any(c.isdigit() for c in texto_stripped)
            palabras_dir = texto_stripped.split()
            if not tiene_numero or len(palabras_dir) < 2:
                respuesta_ia = _hook_coherencia(sesion, texto_stripped)
                if respuesta_ia:
                    return respuesta_ia
                _, pregunta = PREGUNTAS_FICHA[sesion.paso_recopilacion]
                return (
                    "Entiendo, necesito la dirección completa con calle y número. 😊 "
                    "Por ejemplo: *Av. Argentina 1234*\n\n"
                    f"{pregunta}\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            setattr(sesion, campo, texto_stripped)

        # Validación especial para la comuna
        elif campo == "comuna":
            texto_lower = texto.strip().lower()
            if texto_lower not in COMUNAS_QUINTA_REGION:
                return (
                    "Esa comuna no pertenece a la Quinta Región.\n\n"
                    "Por favor escribe una comuna válida, por ejemplo:\n"
                    "Valparaíso, Viña del Mar, Quilpué, Villa Alemana, "
                    "San Antonio, Quillota, Los Andes, San Felipe...\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            # Guardar con la primera letra en mayúscula
            setattr(sesion, campo, texto.strip().title())
            # Resolver grupo de distancia (best-effort: si falla, se crea el proyecto sin grupo)
            grupo = gestion_client.obtener_comuna_grupo_por_nombre(texto_lower)
            sesion.comuna_grupo_id = grupo.get("id_cg") if grupo else None
        elif campo == "dias_estimados":
            dias_min = sesion.dias_minimos or 1
            try:
                dias_val = int(texto.strip())
                if not (1 <= dias_val <= 30):
                    raise ValueError()
            except (ValueError, TypeError):
                # Hook 1: texto con letras → verificar coherencia con IA
                if re.search(r"[a-zA-ZáéíóúñÁÉÍÓÚÑ]", texto):
                    respuesta_ia = _hook_coherencia(sesion, texto)
                    if respuesta_ia:
                        return respuesta_ia
                return (
                    "Por favor escribe un número entre 1 y 30.\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            if dias_val < dias_min:
                return (
                    f"Este servicio requiere mínimo *{dias_min} día{'s' if dias_min != 1 else ''}*.\n\n"
                    f"Por favor escribe un número igual o mayor a {dias_min}.\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            setattr(sesion, campo, dias_val)
        elif campo == "fecha_preferida":
            resultado, error_fecha = _parsear_fecha(texto)
            if error_fecha:
                return error_fecha
            # resultado es "sin preferencia" o "YYYY-MM-DD"
            setattr(sesion, campo, resultado)
        elif campo == "horas_diarias":
            horas_min = sesion.horas_minimas or 1
            try:
                horas_val = int(texto.strip())
                if not (1 <= horas_val <= 12):
                    raise ValueError()
            except (ValueError, TypeError):
                # Hook 1: texto con letras → verificar coherencia con IA
                if re.search(r"[a-zA-ZáéíóúñÁÉÍÓÚÑ]", texto):
                    respuesta_ia = _hook_coherencia(sesion, texto)
                    if respuesta_ia:
                        return respuesta_ia
                return (
                    "Por favor escribe un número entre 1 y 12.\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            if horas_val < horas_min:
                return (
                    f"Este servicio requiere mínimo *{horas_min} hora{'s' if horas_min != 1 else ''} diarias*.\n\n"
                    f"Por favor escribe un número igual o mayor a {horas_min}.\n\n"
                    "---\n"
                    "Escribe *volver* para la pregunta anterior\n"
                    "Escribe *menú* para cancelar y volver al inicio"
                )
            setattr(sesion, campo, horas_val)
        else:
            setattr(sesion, campo, texto)

        sesion.paso_recopilacion += 1

        if sesion.paso_recopilacion < len(PREGUNTAS_FICHA):
            _, siguiente = PREGUNTAS_FICHA[sesion.paso_recopilacion]
            sesion_service.guardar_sesion(sesion)
            return (
                f"{siguiente}\n\n"
                "---\n"
                "Escribe *volver* para la pregunta anterior\n"
                "Escribe *menú* para cancelar y volver al inicio"
            )

        sesion_service.guardar_sesion(sesion)
        return _crear_proyecto(sesion)

    # ── Finalizado ───────────────────────────────────────────
    if estado == EstadoChat.FINALIZADO:
        return "Tu solicitud ya fue registrada. ✅\nEscribe *menú* para una nueva consulta."

     # Fallback: si algo falla, reiniciar
    sesion_service.reiniciar_sesion(telefono)
    return _menu_principal()


def _crear_proyecto(sesion: SesionChat) -> str:
    dias = sesion.dias_estimados or 5
    proyecto = gestion_client.crear_proyecto(
        nombre_cliente  = sesion.nombre_cliente or "Cliente WhatsApp",
        telefono        = sesion.telefono,
        plantilla_id    = sesion.plantilla_id,
        nombre_servicio = sesion.nombre_servicio,
        direccion       = sesion.direccion,
        comuna          = sesion.comuna,
        comuna_grupo_id = sesion.comuna_grupo_id,
        fecha_preferida = sesion.fecha_preferida,
        observaciones   = sesion.observaciones,
        precio_estimado = sesion.precio_estimado,
        dias_estimados  = dias,
        horas_diarias   = sesion.horas_diarias,
    )
    sesion.estado = EstadoChat.FINALIZADO
    sesion_service.guardar_sesion(sesion)

    if proyecto:
        # Notificar al administrador
        from app.core.config import ADMIN_PHONE_NUMBER
        if ADMIN_PHONE_NUMBER:
            precio_fmt = (
                f"${sesion.precio_estimado:,.0f}".replace(",", ".")
                if sesion.precio_estimado
                else "por evaluar"
            )
            msg_admin = (
                f" *Nueva solicitud recibida*\n\n"
                f"Cliente: {sesion.nombre_cliente or 'Sin nombre'}\n"
                f"Servicio: {sesion.nombre_servicio}\n"
                f"Presupuesto: {precio_fmt}\n"
                f"Teléfono: +{sesion.telefono}\n\n"
                f"Revisa la plataforma para aceptar o rechazar."
            )
            whatsapp_service.enviar_mensaje(ADMIN_PHONE_NUMBER, msg_admin)

        # Calcular bencina con días reales y zona real del proyecto
        bencina = None
        if sesion.comuna_grupo_id:
            bencina = gestion_client.obtener_costo_bencina_grupo(sesion.comuna_grupo_id, dias)

        return _texto_proyecto_creado(
            sesion.nombre_servicio,
            sesion.nombre_cliente or "",
            materiales_cost=sesion.precio_estimado or 0,
            mot=dias * 60_000,
            dias=dias,
            bencina=bencina,
        )

    return (
        "⚠️ Hubo un error al registrar tu solicitud.\n"
        "Contáctanos directamente al +56 9 XXXX XXXX.\n\n"
        "Escribe *menú* para volver al inicio."
    )