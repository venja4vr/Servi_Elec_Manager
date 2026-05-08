from app.schemas.webhook import WAWebhookPayload
from app.services import chatbot_service, whatsapp_service


def manejar_webhook(payload: WAWebhookPayload) -> dict:
    mensajes = payload.get_mensajes()
    resultados = []

    for msg in mensajes:
        telefono = msg.from_numero
        texto    = msg.text.body if msg.text else ""

        if not telefono or not texto:
            continue

        respuesta = chatbot_service.procesar_mensaje(telefono, texto)
        enviado   = whatsapp_service.enviar_mensaje(telefono, respuesta)

        resultados.append({
            "telefono": telefono,
            "recibido": texto[:50],
            "enviado":  enviado,
        })

    return {"procesados": len(resultados), "detalle": resultados}