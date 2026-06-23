import os
import json
import time
import hashlib
from typing import Optional

_GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
_GROQ_ENABLED: bool = bool(_GROQ_API_KEY)
_GROQ_MODEL = "llama-3.3-70b-versatile"
_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_CACHE_TTL = 30  # segundos

_cache: dict = {}

if not _GROQ_ENABLED:
    print("[GROQ] GROQ_API_KEY no configurada. Funciones IA deshabilitadas.")


def _hash_key(*partes: str) -> str:
    texto = "|".join(str(p) for p in partes)
    return hashlib.md5(texto.encode()).hexdigest()


def _get_cache(clave: str):
    entrada = _cache.get(clave)
    if entrada:
        ts, val = entrada
        if time.time() - ts < _CACHE_TTL:
            return val
        del _cache[clave]
    return None


def _set_cache(clave: str, val) -> None:
    _cache[clave] = (time.time(), val)


def _llamar_groq(messages: list, json_mode: bool = True, intento: int = 0) -> Optional[str]:
    """Llama a la API de Groq. Reintenta 1 vez en caso de 429. Nunca lanza excepción."""
    if not _GROQ_ENABLED:
        return None
    try:
        from openai import OpenAI
        cliente = OpenAI(base_url=_GROQ_BASE_URL, api_key=_GROQ_API_KEY)
        kwargs: dict = {
            "model": _GROQ_MODEL,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 512,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = cliente.chat.completions.create(**kwargs)
        return resp.choices[0].message.content
    except Exception as e:
        if "429" in str(e) and intento == 0:
            time.sleep(2)
            return _llamar_groq(messages, json_mode=json_mode, intento=1)
        print(f"[GROQ] Error al llamar API: {e}")
        return None


def analizar_coherencia(
    pregunta_bot: str,
    respuesta_cliente: str,
    contexto_corto: str = "",
) -> dict:
    """
    Analiza si la respuesta del cliente es coherente con la pregunta del bot.
    Retorna dict con: coherente, tipo_problema, sugerencia_respuesta, confianza.
    Si IA no está disponible o falla, retorna {coherente: True} para no interrumpir el flujo.
    """
    FALLBACK = {"coherente": True, "tipo_problema": None, "sugerencia_respuesta": None, "confianza": 0.0}
    if not _GROQ_ENABLED:
        return FALLBACK

    clave = _hash_key("coherencia", pregunta_bot, respuesta_cliente)
    cached = _get_cache(clave)
    if cached is not None:
        return cached

    messages = [
        {
            "role": "system",
            "content": (
                "Eres el asistente virtual de Servi Elec, empresa de servicios eléctricos en Chile. "
                "Tu objetivo es acompañar al cliente con calidez y cercanía, generando confianza para retenerlo.\n\n"
                "Analiza si la respuesta del cliente es coherente con lo que el bot le preguntó. "
                "Detecta confusión, hostilidad, emergencias o respuestas fuera de contexto.\n\n"
                "Devuelve JSON con exactamente estos campos:\n"
                "- coherente: boolean (true si la respuesta tiene sentido para la pregunta)\n"
                "- tipo_problema: null | 'emergencia' | 'confusion' | 'hostilidad' | 'fuera_contexto'\n"
                "- sugerencia_respuesta: string con un mensaje CÁLIDO y EMPÁTICO para redirigir al cliente. "
                "Usa 'tú', sé cercano, muestra comprensión genuina. Ejemplos de tono:\n"
                "  * Confusión con nombre: 'Entiendo, a veces no es claro lo que se necesita. "
                "Lo que necesito es tu nombre completo (nombre y apellido). ¿Me lo compartes?'\n"
                "  * Confusión con dirección: 'Claro, entiendo. Necesito la calle y número donde "
                "realizaremos el trabajo. Por ejemplo: Av. Argentina 1234. ¿Me lo indicas?'\n"
                "  * Confusión con días/horas: 'Tranquilo/a, no te preocupes. Solo necesito que "
                "me indiques un número aproximado. Por ejemplo: 3 días. ¿Cuántos estimas?'\n"
                "  * Hostilidad: 'Entiendo tu frustración y lamento los inconvenientes. "
                "Estoy aquí para ayudarte de la mejor forma posible. [redirigir con la pregunta]'\n"
                "  * Emergencia eléctrica: 'Lamento que estés pasando por eso. Para emergencias "
                "eléctricas urgentes, contacta al 131 (Bomberos) o al 800 220 520 (CGE). "
                "Para un trabajo programado, con gusto te ayudo.'\n"
                "  * Fuera de contexto: 'Entiendo que tienes dudas. Estoy aquí para ayudarte "
                "con tu solicitud de servicio eléctrico. [repetir la pregunta de forma amable]'\n"
                "Solo incluir sugerencia_respuesta si no es coherente; null si es coherente.\n"
                "- confianza: número entre 0.0 y 1.0\n\n"
                "IMPORTANTE: Mantén siempre el tono profesional y cálido de Servi Elec. "
                "Nunca respondas de forma fría o mecánica."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Pregunta del bot: {pregunta_bot}\n"
                f"Respuesta del cliente: {respuesta_cliente}\n"
                f"Contexto: {contexto_corto or 'Sin contexto adicional'}"
            ),
        },
    ]

    contenido = _llamar_groq(messages)
    if not contenido:
        return FALLBACK
    try:
        resultado = json.loads(contenido)
        _set_cache(clave, resultado)
        return resultado
    except Exception:
        return FALLBACK


def clasificar_intencion(texto_libre: str) -> dict:
    """
    Clasifica la intención del cliente: opción del menú principal (cotización/reunión/info)
    o un servicio eléctrico específico por categoría/plantilla.
    Retorna dict con: intencion_menu, categoria_sugerida, palabras_clave,
    plantilla_sugerida_id, plantilla_sugerida_nombre, confianza, mensaje_empatico.
    """
    FALLBACK = {
        "intencion_menu": None,
        "categoria_sugerida": None,
        "palabras_clave": [],
        "plantilla_sugerida_id": None,
        "plantilla_sugerida_nombre": None,
        "confianza": 0.0,
        "mensaje_empatico": None,
    }
    if not _GROQ_ENABLED:
        return FALLBACK

    clave = _hash_key("intencion", texto_libre)
    cached = _get_cache(clave)
    if cached is not None:
        return cached

    # Obtener datos reales desde ms-gestion
    try:
        from app.services import gestion_client
        categorias = gestion_client.obtener_categorias_con_plantillas()
        plantillas = gestion_client.obtener_plantillas()
    except Exception:
        categorias, plantillas = [], []

    cat_nombres = [c["nombre"] for c in (categorias or [])]
    plant_info = [
        {
            "id": p["id_plantilla"],
            "nombre": p["nombre_servicio"],
            "categoria": p.get("categoria", ""),
        }
        for p in (plantillas or [])
    ]

    messages = [
        {
            "role": "system",
            "content": (
                "Eres el asistente virtual de Servi Elec, empresa de servicios eléctricos en Chile. "
                "Analiza el mensaje del cliente y determina su intención con empatía.\n\n"
                "OPCIONES DEL MENÚ PRINCIPAL (intencion_menu):\n"
                "- 'cotizacion': cliente quiere precio, presupuesto, cotización o hablar de un trabajo eléctrico\n"
                "- 'reunion': cliente quiere hablar con alguien, agendar, contactar, llamar o atención personalizada\n"
                "- 'info_empresa': cliente pregunta quiénes somos, dónde estamos, experiencia, confiabilidad\n\n"
                f"CATEGORÍAS DE SERVICIO disponibles: {cat_nombres}\n"
                f"SERVICIOS específicos: {[p['nombre'] for p in plant_info]}\n\n"
                "Devuelve JSON con exactamente estos campos:\n"
                "- intencion_menu: 'cotizacion' | 'reunion' | 'info_empresa' | null. "
                "Usar cuando la intención encaja con las opciones del menú.\n"
                "- categoria_sugerida: string (exactamente uno de los nombres de categoría) o null. "
                "Solo si el cliente describe un servicio eléctrico específico.\n"
                "- palabras_clave: lista de strings con las palabras clave detectadas\n"
                "- plantilla_sugerida_id: null (se calcula luego)\n"
                "- plantilla_sugerida_nombre: string con el nombre del servicio más probable o null\n"
                "- confianza: número entre 0.0 y 1.0\n"
                "- mensaje_empatico: string breve y CÁLIDO que confirme lo que detectaste "
                "(ej: '¡Entendido! Parece que necesitas una cotización, con gusto te ayudo 😊'). "
                "null si confianza < 0.6 o si no detectas intención clara.\n\n"
                "REGLA: Si el mensaje encaja con intencion_menu, deja categoria_sugerida en null. "
                "Si es un servicio específico, deja intencion_menu en null. "
                "Si no está claro, pon confianza baja (< 0.5)."
            ),
        },
        {
            "role": "user",
            "content": f"Mensaje del cliente: {texto_libre}",
        },
    ]

    contenido = _llamar_groq(messages)
    if not contenido:
        return FALLBACK
    try:
        resultado = json.loads(contenido)
        # Asegurar que los campos nuevos existen (compatibilidad con respuestas antiguas cacheadas)
        resultado.setdefault("intencion_menu", None)
        resultado.setdefault("mensaje_empatico", None)
        # Resolver ID real de plantilla a partir del nombre sugerido
        nombre_sug = resultado.get("plantilla_sugerida_nombre", "")
        if nombre_sug:
            for p in plant_info:
                if p["nombre"].lower() == nombre_sug.lower():
                    resultado["plantilla_sugerida_id"] = p["id"]
                    break
        _set_cache(clave, resultado)
        return resultado
    except Exception:
        return FALLBACK


def extraer_datos_libres(texto: str) -> dict:
    """
    Extrae datos personales de un texto en lenguaje libre.
    Retorna dict con: nombre, telefono, direccion, comuna, fecha_preferida.
    Los campos no encontrados se devuelven como None.
    Si IA no está disponible o falla, todos los campos son None.
    """
    FALLBACK = {
        "nombre": None,
        "telefono": None,
        "direccion": None,
        "comuna": None,
        "fecha_preferida": None,
    }
    if not _GROQ_ENABLED:
        return FALLBACK

    clave = _hash_key("extraccion", texto)
    cached = _get_cache(clave)
    if cached is not None:
        return cached

    messages = [
        {
            "role": "system",
            "content": (
                "Eres un extractor de datos de contacto para Servi Elec, empresa eléctrica en Chile. "
                "Extrae datos del texto del cliente.\n\n"
                "Devuelve JSON con exactamente estos campos (null si no se encuentra):\n"
                "- nombre: string con nombre completo o null\n"
                "- telefono: string en formato +569XXXXXXXX o null\n"
                "- direccion: string con calle y número o null\n"
                "- comuna: string con nombre de la comuna (solo Quinta Región) o null\n"
                "- fecha_preferida: string en formato DD/MM/YYYY o null\n\n"
                "Solo extrae datos explícitamente mencionados. No inventes información."
            ),
        },
        {
            "role": "user",
            "content": f"Texto del cliente: {texto}",
        },
    ]

    contenido = _llamar_groq(messages)
    if not contenido:
        return FALLBACK
    try:
        resultado = json.loads(contenido)
        _set_cache(clave, resultado)
        return resultado
    except Exception:
        return FALLBACK


def generar_resumen_corto(texto_largo: str, max_palabras: int = 15) -> str:
    """
    Resume un texto en máximo max_palabras palabras en español.
    Retorna string vacío si IA no está disponible o falla.
    """
    if not _GROQ_ENABLED:
        return ""

    clave = _hash_key("resumen", texto_largo, str(max_palabras))
    cached = _get_cache(clave)
    if cached is not None:
        return cached

    messages = [
        {
            "role": "system",
            "content": (
                f"Resume el siguiente texto en máximo {max_palabras} palabras en español. "
                "Devuelve solo el resumen, sin explicaciones ni formato adicional."
            ),
        },
        {"role": "user", "content": texto_largo},
    ]

    contenido = _llamar_groq(messages, json_mode=False)
    if not contenido:
        return ""
    resumen = contenido.strip()
    _set_cache(clave, resumen)
    return resumen
