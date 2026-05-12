from app.schemas.webhook import WAWebhookPayload
from app.services import chatbot_service, whatsapp_service


def manejar_webhook(payload: WAWebhookPayload) -> dict:
    mensajes = payload.get_mensajes() # Extraer mensajes del JSON de Meta
    resultados = []

    for msg in mensajes:
        telefono = msg.from_numero # Quién escribió
        texto    = msg.text.body if msg.text else "" # Qué escribió

        if not telefono or not texto:
            continue # Ignorar mensajes vacíos o sin remitente
        
        # 1. Procesar el mensaje y obtener la respuesta
        respuesta = chatbot_service.procesar_mensaje(telefono, texto)

        # 2. Enviar la respuesta al cliente por WhatsApp
        enviado   = whatsapp_service.enviar_mensaje(telefono, respuesta)

        resultados.append({
            "telefono": telefono,
            "recibido": texto[:50],
            "enviado":  enviado,
        })

    return {"procesados": len(resultados), "detalle": resultados}