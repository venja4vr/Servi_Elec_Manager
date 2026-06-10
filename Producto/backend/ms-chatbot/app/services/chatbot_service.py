from typing import Tuple, List
from app.models.sesion import SesionChat, EstadoChat
from app.services import sesion_service, gestion_client, whatsapp_service


# Mapa de número → nombre de categoría
CATEGORIAS = {
    "1": "Instalaciones Eléctricas",
    "2": "Mantenciones Eléctricas",
    "3": "Servicios Industriales",
}


# Palabras que reinician la conversación desde cualquier estado
PALABRAS_REINICIO = {"menu", "menú", "inicio", "cancelar", "salir"}

# Palabras para retroceder una pregunta (solo en RECOPILANDO_DATOS)
PALABRAS_VOLVER = {
    "volver", "atras", "atrás", "anterior", "regresar",
    "corregir", "error", "equivoque", "equivoqué", "me equivoque",
}


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
    return (
        "📂 *Seleccione una categoría:*\n\n"
        "1️⃣  Instalaciones Eléctricas\n"
        "2️⃣  Mantenciones Eléctricas\n"
        "3️⃣  Servicios Industriales\n\n"
        "_Escribe el número de tu elección_\n"
        "_Escribe *menú* para volver al inicio_"
    )


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

    texto = "\n".join(lineas)
    texto += "\n\nSi desea continuar escribe *OK*.\nPara volver al menú escribe *menú*."
    return texto


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
            return f"¡Sigo aquí! Estábamos en esta pregunta:\n\n{pregunta_actual}"
        if estado == EstadoChat.FINALIZADO:
            sesion_service.reiniciar_sesion(telefono)
            return "¡Bienvenido nuevamente a Servi Elec! 👋\n\n" + _menu_principal()
        sesion_service.reiniciar_sesion(telefono)
        return _menu_principal()

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

        return "No entendí tu respuesta.\n\n" + _menu_principal()

    # ── Selección de categoría ───────────────────────────────
    if estado == EstadoChat.ESPERANDO_CATEGORIA:
        cat = CATEGORIAS.get(texto_limpio)
        if not cat:
            return f"Por favor escribe 1, 2 o 3.\n\n{_menu_categorias()}"

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

        # Obtener cotizacion calculada con precios Sodimac actuales
        cotizacion = gestion_client.obtener_cotizacion_plantilla(sesion.plantilla_id)
        if cotizacion is None:
            # ms-gestion caído: mostrar sin precio pero continuar el flujo
            sesion.precio_estimado = None
            sesion.estado = EstadoChat.COTIZACION_ENVIADA
            sesion_service.guardar_sesion(sesion)
            return _texto_sin_precio(sesion.nombre_servicio)

        total = cotizacion.get("total_estimado", 0) or 0
        sesion.precio_estimado = float(total) if float(total) > 0 else None
        sesion.estado = EstadoChat.COTIZACION_ENVIADA
        sesion_service.guardar_sesion(sesion)
        bencina_ref = gestion_client.obtener_bencina_referencia(dias=5)
        return _texto_cotizacion(sesion.nombre_servicio, cotizacion, bencina_ref)

    # ── Cliente confirma con OK ──────────────────────────────
    if estado == EstadoChat.COTIZACION_ENVIADA:
        if texto_limpio not in ("ok", "si", "sí", "acepto", "confirmar"):
            return "Para continuar escribe *OK*.\nPara volver escribe *menú*."

        sesion.estado = EstadoChat.RECOPILANDO_DATOS
        sesion.paso_recopilacion = 0 # Empezar desde la primera pregunta
        sesion_service.guardar_sesion(sesion)
        _, pregunta = PREGUNTAS_FICHA[0] # Primera pregunta: nombre
        return f"¡Perfecto! Necesito algunos datos.\n\n{pregunta}"

# ── Recopilación de datos de la ficha ────────────────────
    if estado == EstadoChat.RECOPILANDO_DATOS:
        campo, _ = PREGUNTAS_FICHA[sesion.paso_recopilacion]

        # Validación especial para la comuna
        if campo == "comuna":
            texto_lower = texto.strip().lower()
            if texto_lower not in COMUNAS_QUINTA_REGION:
                return (
                    "⚠️ Esa comuna no pertenece a la Quinta Región.\n\n"
                    "Por favor escribe una comuna válida, por ejemplo:\n"
                    "Valparaíso, Viña del Mar, Quilpué, Villa Alemana, "
                    "San Antonio, Quillota, Los Andes, San Felipe...\n\n"
                    "_Escribe *volver* para corregir la dirección o *menú* para cancelar._"
                )
            # Guardar con la primera letra en mayúscula
            setattr(sesion, campo, texto.strip().title())
            # Resolver grupo de distancia (best-effort: si falla, se crea el proyecto sin grupo)
            grupo = gestion_client.obtener_comuna_grupo_por_nombre(texto_lower)
            sesion.comuna_grupo_id = grupo.get("id_cg") if grupo else None
        elif campo == "dias_estimados":
            try:
                dias_val = int(texto.strip())
                if not (1 <= dias_val <= 30):
                    raise ValueError()
            except (ValueError, TypeError):
                return (
                    "Por favor escribe un número entre 1 y 30.\n\n"
                    "_Escribe *volver* para la pregunta anterior o *menú* para cancelar._"
                )
            setattr(sesion, campo, dias_val)
        elif campo == "horas_diarias":
            try:
                horas_val = int(texto.strip())
                if not (1 <= horas_val <= 12):
                    raise ValueError()
            except (ValueError, TypeError):
                return (
                    "Por favor escribe un número entre 1 y 12.\n\n"
                    "_Escribe *volver* para la pregunta anterior o *menú* para cancelar._"
                )
            setattr(sesion, campo, horas_val)
        else:
            setattr(sesion, campo, texto)

        sesion.paso_recopilacion += 1

        if sesion.paso_recopilacion < len(PREGUNTAS_FICHA):
            _, siguiente = PREGUNTAS_FICHA[sesion.paso_recopilacion]
            sesion_service.guardar_sesion(sesion)
            return f"{siguiente}\n\n_Escribe *volver* si te equivocaste o *menú* para empezar de nuevo._"

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