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
PALABRAS_REINICIO = {"hola", "menu", "menú", "inicio", "restart", "volver", "empezar"}


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
    # Las 3 categorías de servicio
    return (
        "📂 *Seleccione una categoría:*\n\n"
        "1️⃣  Instalaciones Eléctricas\n"
        "2️⃣  Mantenciones Eléctricas\n"
        "3️⃣  Servicios Industriales\n\n"
        "_Escribe el número de tu elección_"
    )


def _menu_servicios(plantillas: list, categoria: str) -> Tuple[str, dict]:
    # plantillas ya viene filtrada por categoría y activa=True desde ms-gestion
    mapa = {str(i + 1): p for i, p in enumerate(plantillas)}

    lineas = [f"🔧 *Servicios — {categoria}:*\n"]
    for num, p in mapa.items():
        lineas.append(f"{num}️⃣  {p['nombre_servicio']}")
    lineas.append("\n_Escribe el número de tu elección_")

    return "\n".join(lineas), mapa


def _texto_cotizacion(nombre_servicio: str, cotizacion: dict) -> str:
    total = cotizacion.get("total_estimado", 0) or 0
    sin_precio = cotizacion.get("materiales_sin_precio", [])
    materiales = cotizacion.get("materiales", [])

    # Sin materiales → evaluación personalizada
    if not materiales:
        return _texto_sin_precio(nombre_servicio)

    # Todos sin precio → evaluación personalizada
    if float(total) == 0 and sin_precio:
        return _texto_sin_precio(nombre_servicio)

    precio_fmt = f"${float(total):,.0f}".replace(",", ".")
    texto = (
        f"📋 *{nombre_servicio}*\n\n"
        f"💰 Valor aproximado: *{precio_fmt}*\n\n"
        "_Precio referencial basado en materiales actuales._\n\n"
    )
    if sin_precio:
        nombres = ", ".join(sin_precio)
        texto += (
            f"⚠️ Algunos materiales no tienen precio actualizado: {nombres}.\n"
            "Un administrador te dará la cotización completa al revisar tu solicitud.\n\n"
        )
    texto += "Si desea continuar escribe *OK*.\nPara volver al menú escribe *menú*."
    return texto


def _texto_sin_precio(nombre_servicio: str) -> str:
    return (
        f"📋 *{nombre_servicio}*\n\n"
        "Este servicio requiere evaluación personalizada.\n\n"
        "Si desea que un administrador lo contacte escribe *OK*.\n"
        "Para volver al menú escribe *menú*."
    )


def _texto_proyecto_creado(nombre_servicio: str, nombre_cliente: str) -> str:
    # Confirmación final al cliente
    return (
        f"✅ *¡Listo, {nombre_cliente}!*\n\n"
        f"Tu solicitud de *{nombre_servicio}* fue registrada.\n\n"
        "Un administrador de Servi Elec revisará los detalles "
        "y te contactará a la brevedad.\n\n"
        "_Escribe *menú* si deseas realizar otra consulta._"
    )


# ── Motor principal ───────────────────────────────────────────

def procesar_mensaje(telefono: str, texto: str) -> str:
    texto_limpio = texto.strip().lower() # "  HOLA  " → "hola"
    sesion = sesion_service.obtener_sesion(telefono) # Recuperar memoria del cliente
    estado = sesion.estado # ¿En qué paso está?

    # Reinicio en cualquier momento o primer mensaje
    # Si escribe "hola", "menú", etc. → volver al inicio sin importar el estado
    if texto_limpio in PALABRAS_REINICIO or estado == EstadoChat.INICIO:
        sesion = sesion_service.reiniciar_sesion(telefono)
        return _menu_principal()

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
        return _texto_cotizacion(sesion.nombre_servicio, cotizacion)

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
                    "San Antonio, Quillota, Los Andes, San Felipe..."
                )
            # Guardar con la primera letra en mayúscula
            setattr(sesion, campo, texto.strip().title())
        else:
            setattr(sesion, campo, texto)

        sesion.paso_recopilacion += 1

        if sesion.paso_recopilacion < len(PREGUNTAS_FICHA):
            _, siguiente = PREGUNTAS_FICHA[sesion.paso_recopilacion]
            sesion_service.guardar_sesion(sesion)
            return siguiente

        sesion_service.guardar_sesion(sesion)
        return _crear_proyecto(sesion)

    # ── Finalizado ───────────────────────────────────────────
    if estado == EstadoChat.FINALIZADO:
        return "Tu solicitud ya fue registrada. ✅\nEscribe *menú* para una nueva consulta."

     # Fallback: si algo falla, reiniciar
    sesion_service.reiniciar_sesion(telefono)
    return _menu_principal()


def _crear_proyecto(sesion: SesionChat) -> str:
    proyecto = gestion_client.crear_proyecto(
        nombre_cliente  = sesion.nombre_cliente or "Cliente WhatsApp",
        telefono        = sesion.telefono,
        plantilla_id    = sesion.plantilla_id,
        nombre_servicio = sesion.nombre_servicio,
        direccion       = sesion.direccion,
        comuna          = sesion.comuna,          # ← NUEVA LÍNEA
        fecha_preferida = sesion.fecha_preferida,
        observaciones   = sesion.observaciones,
        precio_estimado = sesion.precio_estimado,
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

        return _texto_proyecto_creado(sesion.nombre_servicio, sesion.nombre_cliente or "")

    return (
        "⚠️ Hubo un error al registrar tu solicitud.\n"
        "Contáctanos directamente al +56 9 XXXX XXXX.\n\n"
        "Escribe *menú* para volver al inicio."
    )